import React, { useState, useEffect } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Button,
    IconButton,
    Tooltip,
    Chip,
    CircularProgress,
    InputAdornment,
    TableSortLabel,
    Card,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Preview as PreviewIcon,
    Send as SendIcon,
    ContentCopy as ContentCopyIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Dashboard as DashboardIcon,
    ViewList as ViewListIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import api from '../../axiosInstance';
import EmailTemplateEditor, { EmailTemplate } from './EmailTemplate';

type ViewMode = 'grid' | 'table';
type Order = 'asc' | 'desc';
type OrderBy = 'name' | 'subject' | 'createdAt' | 'updatedAt';

const EmailTemplatesList: React.FC = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEditor, setOpenEditor] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    // Table/Grid state
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(12);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [order, setOrder] = useState<Order>('desc');
    const [orderBy, setOrderBy] = useState<OrderBy>('createdAt');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/email-templates');
            setTemplates(response.data.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Delete Template?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/email-templates/${id}`);
                toast.success('Template deleted successfully');
                loadTemplates();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to delete template');
            }
        }
    };

    const handleSendTest = async (template: EmailTemplate) => {
        const { value: email } = await Swal.fire({
            title: 'Send Test Email',
            input: 'email',
            inputLabel: 'Enter recipient email address',
            inputPlaceholder: 'test@example.com',
            showCancelButton: true,
            confirmButtonText: 'Send',
        });

        if (email) {
            try {
                await api.post(`/email-templates/${template._id}/test`, { email });
                toast.success(`Test email sent to ${email}`);
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to send test email');
            }
        }
    };

    const handleDuplicate = async (template: EmailTemplate) => {
        try {
            const duplicatedTemplate = {
                ...template,
                name: `${template.name} (Copy)`,
                isActive: false,
            };
            delete duplicatedTemplate._id;
            delete duplicatedTemplate.createdAt;
            delete duplicatedTemplate.updatedAt;

            await api.post('/email-templates', duplicatedTemplate);
            toast.success('Template duplicated successfully');
            loadTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to duplicate template');
        }
    };

    // Filtering and sorting
    const getUniqueCategories = () => {
        const categories = templates.map(t => t.category || 'uncategorized');
        return ['all', ...new Set(categories)];
    };

    const filteredTemplates = templates
        .filter(template => {
            const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.subject.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
            const matchesActive = activeFilter === 'all' ||
                (activeFilter === 'active' && template.isActive) ||
                (activeFilter === 'inactive' && !template.isActive);
            return matchesSearch && matchesCategory && matchesActive;
        })
        .sort((a, b) => {
            if (orderBy === 'name') {
                return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            if (orderBy === 'subject') {
                return order === 'asc' ? a.subject.localeCompare(b.subject) : b.subject.localeCompare(a.subject);
            }
            if (orderBy === 'createdAt' && a.createdAt && b.createdAt) {
                return order === 'asc'
                    ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (orderBy === 'updatedAt' && a.updatedAt && b.updatedAt) {
                return order === 'asc'
                    ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
                    : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            return 0;
        });

    const paginatedTemplates = filteredTemplates.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Grid View Component
    const GridView = () => (
        <Grid container spacing={3}>
            {paginatedTemplates.map((template, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={template._id}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px -12px rgba(0,0,0,0.2)',
                                },
                            }}
                        >
                            <CardContent sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Chip
                                        label={template.category || 'Uncategorized'}
                                        size="small"
                                        sx={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}
                                    />
                                    <Chip
                                        label={template.isActive ? 'Active' : 'Inactive'}
                                        size="small"
                                        color={template.isActive ? 'success' : 'default'}
                                    />
                                </Box>

                                <h3 style={{ margin: '8px 0', fontSize: '16px', fontWeight: 600 }}>
                                    {template.name}
                                </h3>
                                <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                                    Subject: {template.subject}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '11px', color: '#9ca3af' }}>
                                    Updated: {new Date(template.updatedAt || '').toLocaleDateString()}
                                </p>
                            </CardContent>

                            <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Tooltip title="Send Test">
                                    <IconButton size="small" onClick={() => handleSendTest(template)}>
                                        <SendIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Duplicate">
                                    <IconButton size="small" onClick={() => handleDuplicate(template)}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setEditingTemplate(template);
                                            setOpenEditor(true);
                                        }}
                                        sx={{ color: '#6366f1' }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(template._id!)}
                                        sx={{ color: '#ef4444' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Card>
                    </motion.div>
                </Grid>
            ))}
        </Grid>
    );

    // Table View Component
    const TableView = () => (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                        <TableCell>
                            <TableSortLabel
                                active={orderBy === 'name'}
                                direction={orderBy === 'name' ? order : 'asc'}
                                onClick={() => {
                                    setOrder(orderBy === 'name' && order === 'asc' ? 'desc' : 'asc');
                                    setOrderBy('name');
                                }}
                            >
                                Name
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={orderBy === 'subject'}
                                direction={orderBy === 'subject' ? order : 'asc'}
                                onClick={() => {
                                    setOrder(orderBy === 'subject' && order === 'asc' ? 'desc' : 'asc');
                                    setOrderBy('subject');
                                }}
                            >
                                Subject
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={orderBy === 'updatedAt'}
                                direction={orderBy === 'updatedAt' ? order : 'asc'}
                                onClick={() => {
                                    setOrder(orderBy === 'updatedAt' && order === 'asc' ? 'desc' : 'asc');
                                    setOrderBy('updatedAt');
                                }}
                            >
                                Last Updated
                            </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedTemplates.map((template) => (
                        <TableRow key={template._id} hover>
                            <TableCell>
                                <strong>{template.name}</strong>
                            </TableCell>
                            <TableCell>{template.subject}</TableCell>
                            <TableCell>
                                <Chip label={template.category || 'Uncategorized'} size="small" />
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={template.isActive ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={template.isActive ? 'success' : 'default'}
                                />
                            </TableCell>
                            <TableCell>
                                {new Date(template.updatedAt || '').toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                                <Tooltip title="Send Test">
                                    <IconButton size="small" onClick={() => handleSendTest(template)}>
                                        <SendIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Duplicate">
                                    <IconButton size="small" onClick={() => handleDuplicate(template)}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setEditingTemplate(template);
                                            setOpenEditor(true);
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(template._id!)}
                                        sx={{ color: '#ef4444' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <div>
            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                label="Category"
                            >
                                {getUniqueCategories().map(cat => (
                                    <MenuItem key={cat} value={cat}>
                                        {cat === 'all' ? 'All Categories' : cat}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Grid View">
                            <IconButton
                                onClick={() => setViewMode('grid')}
                                color={viewMode === 'grid' ? 'primary' : 'default'}
                            >
                                <DashboardIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Table View">
                            <IconButton
                                onClick={() => setViewMode('table')}
                                color={viewMode === 'table' ? 'primary' : 'default'}
                            >
                                <ViewListIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Table View">

                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setOpenEditor(true);
                                }}
                                sx={{
                                    backgroundColor: '#6366f1',
                                    '&:hover': { backgroundColor: '#4f46e5' },
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    px: 3,
                                }}
                            >
                                Create Template
                            </Button>
                        </Tooltip>
                    </Grid>

                </Grid>
            </Paper>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <CircularProgress />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '16px' }}>
                    <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No templates found</h3>
                    <p style={{ color: '#9ca3af' }}>
                        {searchTerm ? 'Try adjusting your search' : 'Create your first email template to get started'}
                    </p>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenEditor(true)}
                        sx={{ mt: 2 }}
                    >
                        Create Template
                    </Button>
                </Paper>
            ) : (
                <>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {viewMode === 'grid' ? <GridView /> : <TableView />}
                        </motion.div>
                    </AnimatePresence>

                    {/* Pagination */}
                    {filteredTemplates.length > rowsPerPage && (
                        <TablePagination
                            component="div"
                            count={filteredTemplates.length}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[12, 24, 36]}
                            sx={{ mt: 2 }}
                        />
                    )}
                </>
            )}

            {/* Template Editor Dialog */}
            <EmailTemplateEditor
                open={openEditor}
                onClose={() => setOpenEditor(false)}
                template={editingTemplate}
                onSave={loadTemplates}
            />
        </div>
    );
};

export default EmailTemplatesList;