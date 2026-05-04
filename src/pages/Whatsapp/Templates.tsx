// WhatsAppTemplateList.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Grid,
    TextField,
    InputAdornment,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    Box,
    LinearProgress,
    Alert,
    Snackbar,
    Tabs,
    Tab,
} from '@mui/material';
import {
    ContentCopy as ContentCopyIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Visibility as VisibilityIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    WhatsApp as WhatsAppIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
    Pending as PendingIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import api from '../../axiosInstance';

interface WhatsAppTemplate {
    id?: string;
    name: string;
    label: string;
    category: 'MARKETING' | 'TRANSACTIONAL' | 'OTP' | 'UTILITY';
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'LOCATION' | 'CAROUSEL' | 'ORDER_DETAILS';
    language: string;
    text: string;
    sample_text: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    total_parameters?: number;
    created_at?: string;
    updated_at?: string;
}

interface TemplateListProps {
    onEditTemplate?: (template: WhatsAppTemplate) => void;
    onDeleteTemplate?: (templateId: string) => void;
    refreshTrigger?: number;
}

const STATUS_COLORS = {
    APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: <ApprovedIcon fontSize="small" /> },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: <RejectedIcon fontSize="small" /> },
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <PendingIcon fontSize="small" /> },
};

const CATEGORY_COLORS = {
    MARKETING: 'bg-purple-100 text-purple-700',
    TRANSACTIONAL: 'bg-blue-100 text-blue-700',
    OTP: 'bg-green-100 text-green-700',
    UTILITY: 'bg-orange-100 text-orange-700',
};

export default function WhatsAppTemplateList({
    onEditTemplate,
    onDeleteTemplate,
    refreshTrigger = 0
}: TemplateListProps) {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [filteredTemplates, setFilteredTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
    });

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/ws/templates');
            const templateData = response.data.template || [];
            setTemplates(templateData);
            applyFilters(templateData, searchTerm, statusFilter, categoryFilter);
            calculateStats(templateData);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (templateList: WhatsAppTemplate[]) => {
        const approved = templateList.filter(t => t.status === 'APPROVED').length;
        const pending = templateList.filter(t => t.status === 'PENDING').length;
        const rejected = templateList.filter(t => t.status === 'REJECTED').length;
        setStats({
            total: templateList.length,
            approved,
            pending,
            rejected,
        });
    };

    const applyFilters = (
        templateList: WhatsAppTemplate[],
        search: string,
        status: string,
        category: string
    ) => {
        let filtered = [...templateList];

        if (search) {
            filtered = filtered.filter(template =>
                template.label.toLowerCase().includes(search.toLowerCase()) ||
                template.name.toLowerCase().includes(search.toLowerCase()) ||
                template.text.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (status !== 'ALL') {
            filtered = filtered.filter(template => template.status === status);
        }

        if (category !== 'ALL') {
            filtered = filtered.filter(template => template.category === category);
        }

        setFilteredTemplates(filtered);
    };

    useEffect(() => {
        loadTemplates();
    }, [refreshTrigger]);

    useEffect(() => {
        applyFilters(templates, searchTerm, statusFilter, categoryFilter);
    }, [searchTerm, statusFilter, categoryFilter, templates]);

    const handleCopyTemplateId = (templateId: string) => {
        navigator.clipboard.writeText(templateId);
        toast.success('Template ID copied to clipboard');
    };


    const handleDeleteConfirm = async () => {
        if (selectedTemplate?.id) {
            try {
                await api.delete(`/ws/templates/${selectedTemplate.id}?name=${selectedTemplate.name}&language=${selectedTemplate.language}`);
                toast.success('Template deleted successfully');
                setDeleteDialogOpen(false);
                loadTemplates();
                if (onDeleteTemplate) {
                    onDeleteTemplate(selectedTemplate.id);
                }
            } catch (error) {
                console.error('Error deleting template:', error);
                toast.error('Failed to delete template');
            }
        }
    };

    const handleExportTemplates = () => {
        const dataToExport = filteredTemplates.map(template => ({
            id: template.id,
            name: template.name,
            label: template.label,
            category: template.category,
            type: template.type,
            language: template.language,
            text: template.text,
            status: template.status,
            created_at: template.created_at,
        }));

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whatsapp-templates-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Templates exported successfully');
    };

    const getStatusChip = (status?: string) => {
        const statusKey = (status || 'PENDING') as keyof typeof STATUS_COLORS;
        const config = STATUS_COLORS[statusKey] || STATUS_COLORS.PENDING;

        return (
            <Chip
                icon={config.icon}
                label={status || 'PENDING'}
                size="small"
                className={`${config.bg} ${config.text} border-none`}
            />
        );
    };

    return (
        <div className="space-y-4">

            {/* Search and Filter Bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                <div className="flex-1 min-w-[200px]">
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search templates by name, label, or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" className="text-gray-400" />
                                </InputAdornment>
                            ),
                        }}
                        variant="outlined"
                    />
                </div>

                <div className="flex gap-2">
                    <FormControl size="small" className="min-w-[120px]">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label="Status"
                        >
                            <MenuItem value="ALL">All Status</MenuItem>
                            <MenuItem value="APPROVED">Approved</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                            <MenuItem value="REJECTED">Rejected</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" className="min-w-[140px]">
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            label="Category"
                        >
                            <MenuItem value="ALL">All Categories</MenuItem>
                            <MenuItem value="MARKETING">Marketing</MenuItem>
                            <MenuItem value="TRANSACTIONAL">Transactional</MenuItem>
                            <MenuItem value="OTP">OTP</MenuItem>
                            <MenuItem value="UTILITY">Utility</MenuItem>
                        </Select>
                    </FormControl>

                    <Tooltip title="Refresh">
                        <IconButton onClick={loadTemplates} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Export Templates">
                        <IconButton onClick={handleExportTemplates}>
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="py-8">
                    <LinearProgress />
                    <Typography className="text-center mt-4 text-gray-500">
                        Loading templates...
                    </Typography>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <WhatsAppIcon className="text-6xl text-gray-300 mb-3" />
                    <Typography variant="h6" className="text-gray-500">
                        No templates found
                    </Typography>
                    <Typography variant="body2" className="text-gray-400">
                        {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                            ? 'Try adjusting your filters'
                            : 'Create your first WhatsApp template to get started'}
                    </Typography>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template, idx) => (
                        <Card
                            key={template.id || idx}
                            className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200"
                        >
                            <CardContent className="p-4 relative">
                                <div className="flex justify-between items-start mt-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <Typography variant="subtitle1" className="font-semibold text-gray-800">
                                                {template.label}
                                            </Typography>
                                            {getStatusChip(template.status)}
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Chip
                                                label={template.category}
                                                size="small"
                                                className={`${CATEGORY_COLORS[template.category]} border-none`}
                                            />
                                            <Chip
                                                label={template.type}
                                                size="small"
                                                className="bg-gray-100 text-gray-700 border-none"
                                            />
                                        </div>

                                        <Typography variant="body2" className="text-gray-500 mb-1">
                                            Name: <span className="font-mono text-xs">{template.name}</span>
                                        </Typography>

                                        <Typography variant="caption" className="text-gray-400">
                                            Language: {template.language}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            className="text-gray-600 mt-2 line-clamp-3 bg-gray-50 p-2 rounded text-sm"
                                        >
                                            {template.text}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="absolute top-1 right-1 flex justify-end gap-1">
                                    <Tooltip title="View Details">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                setViewDialogOpen(true);
                                            }}
                                            className="text-gray-500 hover:text-blue-600"
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Copy Template ID">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleCopyTemplateId(template.id || '')}
                                            className="text-gray-500 hover:text-green-600"
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>

                                    {onEditTemplate && (
                                        <Tooltip title="Edit Template">
                                            <IconButton
                                                size="small"
                                                onClick={() => onEditTemplate(template)}
                                                className="text-gray-500 hover:text-orange-600"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    <Tooltip title="Delete Template">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                setDeleteDialogOpen(true);
                                            }}
                                            className="text-gray-500 hover:text-red-600"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* View Template Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle className="bg-gray-50 border-b">
                    <div className="flex justify-between items-center">
                        <Typography variant="h6">Template Details</Typography>
                        {getStatusChip(selectedTemplate?.status)}
                    </div>
                </DialogTitle>
                <DialogContent className="pt-4">
                    {selectedTemplate && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Typography variant="caption" className="text-gray-500">Template Name</Typography>
                                    <Typography variant="body2" className="font-mono">{selectedTemplate.name}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" className="text-gray-500">Label</Typography>
                                    <Typography variant="body2">{selectedTemplate.label}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" className="text-gray-500">Category</Typography>
                                    <Typography variant="body2">{selectedTemplate.category}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" className="text-gray-500">Type</Typography>
                                    <Typography variant="body2">{selectedTemplate.type}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" className="text-gray-500">Language</Typography>
                                    <Typography variant="body2">{selectedTemplate.language}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" className="text-gray-500">Template ID</Typography>
                                    <Typography variant="body2" className="font-mono text-xs break-all">
                                        {selectedTemplate.id}
                                    </Typography>
                                </div>
                            </div>

                            <div>
                                <Typography variant="caption" className="text-gray-500">Message Content</Typography>
                                <div className="bg-gray-50 rounded-lg p-3 mt-1">
                                    <Typography variant="body2" className="whitespace-pre-wrap">
                                        {selectedTemplate.text}
                                    </Typography>
                                </div>
                            </div>

                            {selectedTemplate.sample_text && (
                                <div>
                                    <Typography variant="caption" className="text-gray-500">Sample Preview</Typography>
                                    <div className="bg-green-50 rounded-lg p-3 mt-1 border-l-4 border-green-500">
                                        <Typography variant="body2" className="italic">
                                            {selectedTemplate.sample_text}
                                        </Typography>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                    {selectedTemplate?.status === 'REJECTED' && onEditTemplate && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setViewDialogOpen(false);
                                onEditTemplate(selectedTemplate);
                            }}
                        >
                            Edit & Resubmit
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Template</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete template "{selectedTemplate?.label}"?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}