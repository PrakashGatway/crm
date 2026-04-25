// components/EmailMarketing/EmailBroadcast.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TextField,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Switch,
    FormControlLabel,
    CircularProgress,
    Avatar,
    Divider,
    Tooltip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    InputAdornment,
    TableSortLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Alert,
    Snackbar,
    Tab,
    Tabs,
    Box,
    Radio,
    RadioGroup,
    FormLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Send as SendIcon,
    Schedule as ScheduleIcon,
    Cancel as CancelIcon,
    PlayArrow as PlayArrowIcon,
    Visibility as VisibilityIcon,
    BarChart as BarChartIcon,
    Email as EmailIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import api from '../axiosInstance';
import { SearchIcon } from 'lucide-react';

const broadcastStatuses = {
    draft: { label: 'Draft', color: 'default' },
    scheduled: { label: 'Scheduled', color: 'info' },
    processing: { label: 'Processing', color: 'warning' },
    sent: { label: 'Sent', color: 'success' },
    failed: { label: 'Failed', color: 'error' },
    cancelled: { label: 'Cancelled', color: 'secondary' },
    partial: { label: 'Partial', color: 'warning' },
};

export default function EmailBroadcast() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [previewLeads, setPreviewLeads] = useState(null);
    const [selectedBroadcast, setSelectedBroadcast] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [templates, setTemplates] = useState([]);
    const [leadStatuses, setLeadStatuses] = useState([]);
    const [leadSources, setLeadSources] = useState([]);
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        templateId: '',
        broadcastType: 'immediate',
        scheduledFor: null,
        filters: {
            statuses: [],
            sources: [],
            assignedCounselor: null,
            dateRange: {
                start: null,
                end: null,
            },
        },
        batchSize: 50,
        batchDelay: 1000,
    });

    useEffect(() => {
        loadBroadcasts();
        loadTemplates();
        loadLeadStatuses();
        loadLeadSources();
        loadUsers();
    }, []);

    const loadBroadcasts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/broadcast');
            setBroadcasts(response.data.data || []);
        } catch (err) {
            toast.error('Failed to load broadcasts');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const response = await api.get('/email-templates');
            setTemplates(response.data.data || []);
        } catch (err) {
            console.error('Failed to load templates');
        }
    };

    const loadLeadStatuses = async () => {
        try {
            const response = await api.get('/status');
            setLeadStatuses(response.data.data || []);
        } catch (err) {
            console.error('Failed to load lead statuses');
        }
    };

    const loadLeadSources = () => {
        setLeadSources([
            'googleAds', 'website', 'referral', 'metaAds',
            'social_media', 'partner', 'facebook', 'excel', 'other'
        ]);
    };

    const loadUsers = async () => {
        try {
            const response = await api.get('/users?role=counselor');
            setUsers(response.data.users || []);
        } catch (err) {
            console.error('Failed to load users');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (filterName, value) => {
        setFormData(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [filterName]: value,
            },
        }));
    };

    const handleStatusFilterChange = (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                statuses: typeof value === 'string' ? value.split(',') : value,
            },
        }));
    };

    const handleSourceFilterChange = (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                sources: typeof value === 'string' ? value.split(',') : value,
            },
        }));
    };

    const handleDateRangeChange = (type, date) => {
        setFormData(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                dateRange: {
                    ...prev.filters.dateRange,
                    [type]: date,
                },
            },
        }));
    };

    const handleOpenDialog = (broadcast = null) => {
        if (broadcast) {
            setEditingId(broadcast._id);
            setFormData({
                name: broadcast.name,
                description: broadcast.description || '',
                templateId: broadcast.templateId?._id || broadcast.templateId,
                broadcastType: broadcast.broadcastType,
                scheduledFor: broadcast.scheduledFor ? new Date(broadcast.scheduledFor) : null,
                filters: broadcast.filters || {
                    statuses: [],
                    sources: [],
                    assignedCounselor: null,
                    dateRange: { start: null, end: null },
                },
                batchSize: broadcast.batchSize || 50,
                batchDelay: broadcast.batchDelay || 1000,
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                templateId: '',
                broadcastType: 'immediate',
                scheduledFor: null,
                filters: {
                    statuses: [],
                    sources: [],
                    assignedCounselor: null,
                    dateRange: { start: null, end: null },
                },
                batchSize: 50,
                batchDelay: 1000,
            });
        }
        setOpenDialog(true);
    };

    const handlePreviewLeads = async () => {
        try {
            setSubmitting(true);
            const response = await api.post('/broadcast/preview/leads', {
                filters: formData.filters,
            });
            setPreviewLeads(response.data.data);
            setOpenPreviewDialog(true);
        } catch (err) {
            toast.error('Failed to preview leads');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Broadcast name is required');
            return;
        }
        if (!formData.templateId) {
            toast.error('Please select an email template');
            return;
        }
        if (formData.broadcastType === 'scheduled' && !formData.scheduledFor) {
            toast.error('Please select a schedule date and time');
            return;
        }
        if (formData.filters.assignedCounselor === '') {
            formData.filters.assignedCounselor = null;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/broadcast/${editingId}`, formData);
                toast.success('Broadcast updated successfully');
            } else {
                const response = await api.post('/broadcast', formData);
                toast.success('Broadcast created successfully');

                // If immediate broadcast, show info
                if (formData.broadcastType === 'immediate') {
                    toast.info('Broadcast is being processed in the background');
                }
            }
            handleCloseDialog();
            loadBroadcasts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save broadcast');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingId(null);
    };

    const handleStartBroadcast = async (id) => {
        const result = await Swal.fire({
            title: 'Start Broadcast?',
            text: 'This will start sending emails to all matching leads. This action cannot be undone.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, start it!',
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/broadcast/${id}/start`);
                toast.success('Broadcast started successfully');
                loadBroadcasts();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to start broadcast');
            }
        }
    };

    const handleCancelBroadcast = async (id) => {
        const result = await Swal.fire({
            title: 'Cancel Broadcast?',
            text: 'This will stop the broadcast from sending more emails.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel it!',
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/broadcast/${id}/cancel`);
                toast.success('Broadcast cancelled successfully');
                loadBroadcasts();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to cancel broadcast');
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Broadcast?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/broadcast/${id}`);
                toast.success('Broadcast deleted successfully');
                loadBroadcasts();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to delete broadcast');
            }
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-700',
            scheduled: 'bg-blue-100 text-blue-700',
            processing: 'bg-yellow-100 text-yellow-700',
            sent: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
            cancelled: 'bg-purple-100 text-purple-700',
            partial: 'bg-orange-100 text-orange-700',
        };
        return colors[status] || colors.draft;
    };

    const filteredBroadcasts = broadcasts.filter(broadcast =>
        broadcast.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === 'all' || broadcast.status === statusFilter)
    );

    const paginatedBroadcasts = filteredBroadcasts.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <div className="p-2 mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Email Broadcast</h1>
                <p className="text-gray-500 text-sm">Create and manage email campaigns to your leads</p>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex gap-3 w-full md:w-auto">
                    <TextField
                        size="small"
                        placeholder="Search broadcasts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="!w-64"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon className="!text-gray-400" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Select
                        size="small"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="!w-40"
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        {Object.entries(broadcastStatuses).map(([key, { label }]) => (
                            <MenuItem key={key} value={key}>{label}</MenuItem>
                        ))}
                    </Select>
                </div>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !px-4 !py-2 !capitalize"
                >
                    Create Broadcast
                </Button>
            </div>

            {/* Broadcasts Table */}
            <Paper className="!rounded-2xl !shadow-sm !border !border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <CircularProgress />
                    </div>
                ) : paginatedBroadcasts.length === 0 ? (
                    <div className="p-12 text-center">
                        <EmailIcon sx={{ fontSize: 60, color: '#9ca3af', marginBottom: 2 }} />
                        <h3 className="text-lg font-medium text-gray-600 mb-1">
                            {searchTerm ? 'No matches found' : 'No broadcasts yet'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {searchTerm ? 'Try adjusting your search' : 'Click "Create Broadcast" to start your first campaign'}
                        </p>
                    </div>
                ) : (
                    <>
                        <TableContainer className="max-h-[600px] overflow-auto">
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow className="!bg-gray-50">
                                        <TableCell className="!font-semibold">Name</TableCell>
                                        <TableCell className="!font-semibold">Template</TableCell>
                                        <TableCell className="!font-semibold">Status</TableCell>
                                        <TableCell className="!font-semibold">Progress</TableCell>
                                        <TableCell className="!font-semibold">Stats</TableCell>
                                        <TableCell className="!font-semibold">Schedule</TableCell>
                                        <TableCell className="!font-semibold text-right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedBroadcasts.map((broadcast) => (
                                        <TableRow key={broadcast._id} className="hover:!bg-gray-50">
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium text-gray-900">{broadcast.name}</div>
                                                    {broadcast.description && (
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {broadcast.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {broadcast.templateId?.name || 'Template not found'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(broadcast.status)}`}>
                                                    {broadcastStatuses[broadcast.status]?.label || broadcast.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {broadcast.status === 'processing' ? (
                                                    <div className="w-32">
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={broadcast.progress || 0}
                                                            className="h-2 rounded"
                                                        />
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {Math.round(broadcast.progress || 0)}%
                                                        </div>
                                                    </div>
                                                ) : broadcast.status === 'sent' ? (
                                                    <div className="text-sm text-green-600">
                                                        {broadcast.sentCount} / {broadcast.totalLeads} sent
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500">
                                                        {broadcast.totalLeads || 0} leads
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-sm flex items-center gap-2">
                                                        <CheckCircleIcon className="!text-green-500 !text-sm" />
                                                        <span>Sent: {broadcast.sentCount || 0}</span>
                                                    </div>
                                                    <div className="text-sm flex items-center gap-2">
                                                        <ErrorIcon className="!text-red-500 !text-sm" />
                                                        <span>Failed: {broadcast.failedCount || 0}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {broadcast.broadcastType === 'scheduled' && broadcast.scheduledFor ? (
                                                    <div className="text-sm">
                                                        <div>{new Date(broadcast.scheduledFor).toLocaleDateString()}</div>
                                                        <div className="text-gray-500 text-xs">
                                                            {new Date(broadcast.scheduledFor).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                ) : broadcast.broadcastType === 'immediate' ? (
                                                    <span className="text-xs text-blue-600">Immediate</span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {broadcast.status === 'scheduled' || broadcast.status === 'draft' && (
                                                        <>
                                                            <Tooltip title="Edit">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenDialog(broadcast)}
                                                                    className="!text-blue-600"
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Start">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleStartBroadcast(broadcast._id)}
                                                                    className="!text-green-600"
                                                                >
                                                                    <PlayArrowIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    {broadcast.status === 'scheduled' && (
                                                        <>
                                                            <Tooltip title="Cancel">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleCancelBroadcast(broadcast._id)}
                                                                    className="!text-red-600"
                                                                >
                                                                    <CancelIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDelete(broadcast._id)}
                                                                className="!text-red-600"
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    <Tooltip title="View Details">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setSelectedBroadcast(broadcast)}
                                                            className="!text-gray-600"
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={filteredBroadcasts.length}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                        />
                    </>
                )}
            </Paper>

            {/* Create/Edit Broadcast Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{ className: '!rounded-2xl' }}
            >
                <DialogTitle className="!pb-2">
                    {editingId ? 'Edit Broadcast' : 'Create New Broadcast'}
                    <IconButton
                        onClick={handleCloseDialog}
                        className="!absolute !right-3 !top-3"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Full-width on all screens */}
                        <div className="md:col-span-2">
                            <TextField label="Broadcast Name *" name="name" fullWidth value={formData.name} onChange={handleInputChange} required />
                        </div>

                        <div className="md:col-span-2">
                            <TextField label="Description" name="description" fullWidth multiline rows={2} value={formData.description} onChange={handleInputChange} />
                        </div>

                        <div className="md:col-span-2">
                            <FormControl fullWidth>
                                <InputLabel>Email Template *</InputLabel>
                                <Select name="templateId" value={formData.templateId} onChange={handleInputChange} label="Email Template *">
                                    {templates.map(template => (
                                        <MenuItem key={template._id} value={template._id}>{template.name} - {template.subject}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>

                        {/* Divider */}
                        <div className="md:col-span-2">
                            <Divider className="my-2"><Chip label="Lead Filters" /></Divider>
                        </div>

                        <div className="md:col-span-2">
                            <FormControl fullWidth>
                                <InputLabel>Lead Statuses</InputLabel>
                                <Select multiple value={formData.filters.statuses} onChange={handleStatusFilterChange} label="Lead Statuses"
                                    renderValue={(selected) => (
                                        <div className="flex flex-wrap gap-1">
                                            {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                                        </div>
                                    )}>
                                    {leadStatuses.map(status => (
                                        <MenuItem key={status._id} value={status.key}>{status.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>

                        <div className="md:col-span-2">
                            <FormControl fullWidth>
                                <InputLabel>Lead Sources</InputLabel>
                                <Select multiple value={formData.filters.sources} onChange={handleSourceFilterChange} label="Lead Sources"
                                    renderValue={(selected) => (
                                        <div className="flex flex-wrap gap-1">
                                            {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                                        </div>
                                    )}>
                                    {leadSources.map(source => (
                                        <MenuItem key={source} value={source}>{source}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>

                        <div className="md:col-span-2">
                            <FormControl fullWidth>
                                <InputLabel>Assigned Counselor</InputLabel>
                                <Select name="filters.assignedCounselor" value={formData.filters.assignedCounselor}
                                    onChange={(e) => handleFilterChange('assignedCounselor', e.target.value)} label="Assigned Counselor">
                                    <MenuItem value="">All Counselors</MenuItem>
                                    {users.map(user => (
                                        <MenuItem key={user._id} value={user._id}>{user.name || user.email}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>

                        {/* Half-width on desktop */}
                        <div>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker label="Date Range Start" value={formData.filters.dateRange.start}
                                    onChange={(date) => handleDateRangeChange('start', date)}
                                    slotProps={{ textField: { fullWidth: true } }} />
                            </LocalizationProvider>
                        </div>

                        <div>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker label="Date Range End" value={formData.filters.dateRange.end}
                                    onChange={(date) => handleDateRangeChange('end', date)}
                                    slotProps={{ textField: { fullWidth: true } }} />
                            </LocalizationProvider>
                        </div>

                        <div className="md:col-span-2">
                            <Button variant="outlined" onClick={handlePreviewLeads} disabled={submitting} className="w-full">
                                Preview Matching Leads
                            </Button>
                        </div>

                        <div className="md:col-span-2">
                            <Divider className="my-2"><Chip label="Broadcast Settings" /></Divider>
                        </div>

                        <div className="md:col-span-2">
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Broadcast Type</FormLabel>
                                <RadioGroup name="broadcastType" value={formData.broadcastType} onChange={handleInputChange} row>
                                    <FormControlLabel value="immediate" control={<Radio />} label="Send Immediately" />
                                    <FormControlLabel value="scheduled" control={<Radio />} label="Schedule for Later" />
                                </RadioGroup>
                            </FormControl>
                        </div>

                        {formData.broadcastType === 'scheduled' && (
                            <div className="md:col-span-2">
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DateTimePicker label="Schedule Date & Time" value={formData.scheduledFor}
                                        onChange={(date) => setFormData(prev => ({ ...prev, scheduledFor: date }))}
                                        slotProps={{ textField: { fullWidth: true } }} />
                                </LocalizationProvider>
                            </div>
                        )}

                        {/* Half-width on desktop */}
                        <div>
                            <TextField label="Batch Size" name="batchSize" type="number" value={formData.batchSize} onChange={handleInputChange}
                                helperText="Number of emails per batch" fullWidth />
                        </div>

                        <div>
                            <TextField label="Batch Delay (ms)" name="batchDelay" type="number" value={formData.batchDelay} onChange={handleInputChange}
                                helperText="Delay between batches" fullWidth />
                        </div>

                    </div>
                </DialogContent>
                <DialogActions className="!px-6 !pb-6">
                    <Button onClick={handleCloseDialog} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                        className="!bg-indigo-600"
                    >
                        {editingId ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Leads Preview Dialog */}
            <Dialog
                open={openPreviewDialog}
                onClose={() => setOpenPreviewDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Matching Leads Preview
                    <IconButton
                        onClick={() => setOpenPreviewDialog(false)}
                        className="!absolute !right-3 !top-3"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {previewLeads && (
                        <>
                            <Alert severity="info" className="!mb-4">
                                Total matching leads: <strong>{previewLeads.total}</strong>
                            </Alert>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Phone</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previewLeads.sample.map((lead) => (
                                            <TableRow key={lead._id}>
                                                <TableCell>{lead.fullName}</TableCell>
                                                <TableCell>{lead.email}</TableCell>
                                                <TableCell>{lead.phone}</TableCell>
                                                <TableCell>{lead.status}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPreviewDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Broadcast Details Dialog */}
            <Dialog
                open={!!selectedBroadcast}
                onClose={() => setSelectedBroadcast(null)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    Broadcast Details: {selectedBroadcast?.name}
                    <IconButton
                        onClick={() => setSelectedBroadcast(null)}
                        className="!absolute !right-3 !top-3"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedBroadcast && (
                        <div className="space-y-4">
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Statistics</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={3}>
                                            <div className="text-center">
                                                <PeopleIcon className="!text-blue-500 !text-3xl" />
                                                <div className="text-2xl font-bold">{selectedBroadcast.totalLeads || 0}</div>
                                                <div className="text-sm text-gray-500">Total Leads</div>
                                            </div>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <div className="text-center">
                                                <CheckCircleIcon className="!text-green-500 !text-3xl" />
                                                <div className="text-2xl font-bold">{selectedBroadcast.sentCount || 0}</div>
                                                <div className="text-sm text-gray-500">Sent</div>
                                            </div>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <div className="text-center">
                                                <ErrorIcon className="!text-red-500 !text-3xl" />
                                                <div className="text-2xl font-bold">{selectedBroadcast.failedCount || 0}</div>
                                                <div className="text-sm text-gray-500">Failed</div>
                                            </div>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <div className="text-center">
                                                <EmailIcon className="!text-purple-500 !text-3xl" />
                                                <div className="text-2xl font-bold">{selectedBroadcast.openedCount || 0}</div>
                                                <div className="text-sm text-gray-500">Opened</div>
                                            </div>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Filters Applied</Typography>
                                    <div className="space-y-2">
                                        {selectedBroadcast.filters?.statuses?.length > 0 && (
                                            <div>
                                                <strong>Statuses:</strong>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {selectedBroadcast.filters.statuses.map(status => (
                                                        <Chip key={status} label={status} size="small" />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedBroadcast.filters?.sources?.length > 0 && (
                                            <div>
                                                <strong>Sources:</strong>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {selectedBroadcast.filters.sources.map(source => (
                                                        <Chip key={source} label={source} size="small" />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedBroadcast.filters?.assignedCounselor && (
                                            <div>
                                                <strong>Assigned Counselor:</strong> {selectedBroadcast.filters.assignedCounselor}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedBroadcast(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}