// components/WhatsAppMarketing/WhatsAppBroadcast.jsx
import React, { useState, useEffect, use } from 'react';
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
    FormLabel,
    FormHelperText
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
    WhatsApp as WhatsAppIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Image as ImageIcon,
    Description as DescriptionIcon,
    Link as LinkIcon,
    Pause as PauseIcon,
    PlayCircle as PlayCircleIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import api from '../../axiosInstance';
import { SearchIcon } from 'lucide-react';
import { useAuth } from '../../context/UserContext';

const broadcastStatuses = {
    draft: { label: 'Draft', color: 'default' },
    scheduled: { label: 'Scheduled', color: 'info' },
    processing: { label: 'Processing', color: 'warning' },
    sent: { label: 'Sent', color: 'success' },
    failed: { label: 'Failed', color: 'error' },
    cancelled: { label: 'Cancelled', color: 'secondary' },
    partial: { label: 'Partial', color: 'warning' },
    paused: { label: 'Paused', color: 'warning' },
};

const messageTypes = {
    template: { label: 'Template Message', icon: <WhatsAppIcon /> }
};

export default function WhatsAppBroadcast() {
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
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [templateVariables, setTemplateVariables] = useState({});
    const [cronExpression, setCronExpression] = useState('');
    const [recurringPattern, setRecurringPattern] = useState('once');
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        messageType: 'text',
        templateId: '',
        content: '',
        mediaUrl: '',
        mediaType: '',
        broadcastType: 'immediate',
        scheduledFor: null,
        recurringPattern: 'once',
        cronExpression: '',
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
        allowMarketing: true,
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
            const response = await api.get('/wsbroadcast');
            setBroadcasts(response.data.data || []);
        } catch (err) {
            toast.error('Failed to load WhatsApp broadcasts');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const response = await api.get('/ws/templates');
            setTemplates(response.data.template || []);
        } catch (err) {
            console.error('Failed to load WhatsApp templates');
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

        if (name === 'messageType') {
            setFormData(prev => ({ ...prev, templateId: '', content: '' }));
        }
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

    const handleRecurringPatternChange = (pattern) => {
        setRecurringPattern(pattern);
        setFormData(prev => ({ ...prev, recurringPattern: pattern }));

        // Set cron expression based on pattern
        let cron = '';
        switch (pattern) {
            case 'daily':
                cron = '0 9 * * *'; // 9 AM daily
                break;
            case 'weekly':
                cron = '0 9 * * 1'; // Monday 9 AM
                break;
            case 'monthly':
                cron = '0 9 1 * *'; // 1st of month 9 AM
                break;
            case 'custom':
                cron = '';
                break;
            default:
                cron = '';
        }
        setCronExpression(cron);
        setFormData(prev => ({ ...prev, cronExpression: cron }));
    };

    const handleTemplateSelect = (templateId) => {
        const template = templates.find(t => t._id === templateId);
        if (template && template.variables) {
            const vars = {};
            template.variables.forEach(v => {
                vars[v.name] = '';
            });
            setTemplateVariables(vars);
        }
    };

    const renderTemplatePreview = () => {
        const template = templates.find(t => t.name === formData.templateId);
        if (!template) return null;
        let previewContent = template.text;

        return (
            <Card className="!mt-4 !bg-gray-50">
                <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                        Template Preview
                    </Typography>
                    <Box className="mt-3">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <Typography className="text-sm whitespace-pre-wrap">
                                {previewContent}
                            </Typography>
                        </div>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const handleOpenDialog = (broadcast = null) => {
        if (broadcast) {
            setEditingId(broadcast._id);
            setFormData({
                name: broadcast.name,
                description: broadcast.description || '',
                messageType: broadcast.messageType || 'text',
                templateId: broadcast.templateId || broadcast.templateId || '',
                content: broadcast.content || '',
                mediaUrl: broadcast.mediaUrl || '',
                mediaType: broadcast.mediaType || '',
                broadcastType: broadcast.broadcastType,
                scheduledFor: broadcast.scheduledFor ? new Date(broadcast.scheduledFor) : null,
                recurringPattern: broadcast.recurringPattern || 'once',
                cronExpression: broadcast.cronExpression || '',
                filters: broadcast.filters || {
                    statuses: [],
                    sources: [],
                    assignedCounselor: null,
                    dateRange: { start: null, end: null },
                },
                batchSize: broadcast.batchSize || 50,
                batchDelay: broadcast.batchDelay || 1000,
                allowMarketing: broadcast.allowMarketing !== false,
            });
            setRecurringPattern(broadcast.recurringPattern || 'once');
            setCronExpression(broadcast.cronExpression || '');
            if (broadcast.templateId?._id) {
                handleTemplateSelect(broadcast.templateId._id);
            }
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                messageType: 'text',
                templateId: '',
                content: '',
                mediaUrl: '',
                mediaType: '',
                broadcastType: 'immediate',
                scheduledFor: null,
                recurringPattern: 'once',
                cronExpression: '',
                filters: {
                    statuses: [],
                    sources: [],
                    assignedCounselor: null,
                    dateRange: { start: null, end: null },
                },
                batchSize: 50,
                batchDelay: 1000,
                allowMarketing: true,
            });
            setMediaFile(null);
            setMediaPreview(null);
            setTemplateVariables({});
            setRecurringPattern('once');
            setCronExpression('');
        }
        setOpenDialog(true);
    };

    const handlePreviewLeads = async () => {
        try {
            setSubmitting(true);
            const response = await api.post('/wsbroadcast/preview/leads', {
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

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error('Broadcast name is required');
            return false;
        }

        if (formData.messageType === 'template') {
            if (!formData.templateId) {
                toast.error('Please select a WhatsApp template');
                return false;
            }
            const template = templates.find(t => t.name === formData.templateId);
            // if (template && template.total_parameters) {
            //     const missingVars = template.total_parameters
            //     if (missingVars > 0) {
            //         toast.error(`Please fill all template variables`);
            //         return false;
            //     }
            // }
        } else if (formData.messageType === 'text') {
            if (!formData.content.trim()) {
                toast.error('Message content is required');
                return false;
            }
            if (formData.content.length > 4096) {
                toast.error('Message content must be less than 4096 characters');
                return false;
            }
        } else if (formData.messageType === 'media') {
            if (!formData.mediaUrl && !mediaFile) {
                toast.error('Please upload a media file');
                return false;
            }
        }

        if (formData.broadcastType !== 'immediate') {
            if (formData.recurringPattern === 'once' && !formData.scheduledFor) {
                toast.error('Please select a schedule date and time');
                return false;
            }
            if (formData.recurringPattern === 'custom' && !formData.cronExpression) {
                toast.error('Please enter a valid cron expression');
                return false;
            }
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                templateVariables: formData.messageType === 'template' ? templateVariables : undefined,
                recurringPattern,
                cronExpression: recurringPattern === 'custom' ? cronExpression : undefined,
            };

            if (editingId) {
                await api.put(`/wsbroadcast/${editingId}`, payload);
                toast.success('WhatsApp broadcast updated successfully');
            } else {
                const response = await api.post('/wsbroadcast', payload);
                toast.success('WhatsApp broadcast created successfully');

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
        setMediaFile(null);
        setMediaPreview(null);
        setTemplateVariables({});
    };

    const handleStartBroadcast = async (id) => {
        const result = await Swal.fire({
            title: 'Start WhatsApp Broadcast?',
            text: 'This will start sending WhatsApp messages to all matching leads. Please ensure recipients have opted in for marketing messages.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#25D366',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, start it!',
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/wsbroadcast/${id}/start`);
                toast.success('Broadcast started successfully');
                loadBroadcasts();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to start broadcast');
            }
        }
    };

    const handlePauseBroadcast = async (id) => {
        try {
            await api.post(`/wsbroadcast/${id}/pause`);
            toast.success('Broadcast paused successfully');
            loadBroadcasts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to pause broadcast');
        }
    };

    const handleResumeBroadcast = async (id) => {
        try {
            await api.post(`/wsbroadcast/${id}/resume`);
            toast.success('Broadcast resumed successfully');
            loadBroadcasts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resume broadcast');
        }
    };

    const handleCancelBroadcast = async (id) => {
        const result = await Swal.fire({
            title: 'Cancel Broadcast?',
            text: 'This will stop the broadcast from sending more messages.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel it!',
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/wsbroadcast/${id}/cancel`);
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
                await api.delete(`/wsbroadcast/${id}`);
                toast.success('Broadcast deleted successfully');
                loadBroadcasts();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to delete broadcast');
            }
        }
    };

    const handleMediaUpload = async (file) => {
        try {
            if (!file) return;

            const localPreview = URL.createObjectURL(file);
            setMediaPreview(localPreview);
            setMediaFile(file);

            // ✅ set media type
            setFormData(prev => ({
                ...prev,
                mediaType: file.type,
            }));

            // ✅ upload to server
            const formDataObj = new FormData();
            formDataObj.append("file", file);

            const res = await api.post("/upload/single", formDataObj, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const url = res.data?.url;

            if (!url) {
                throw new Error("Upload failed: No URL returned");
            }
            setFormData(prev => ({
                ...prev,
                mediaUrl: url,
            }));

        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload media");
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
            paused: 'bg-orange-100 text-orange-700',
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
                    className="!bg-green-600 hover:!bg-green-700 !rounded-lg !px-4 !py-2 !capitalize"
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
                        <WhatsAppIcon sx={{ fontSize: 60, color: '#25D366', marginBottom: 2 }} />
                        <h3 className="text-lg font-medium text-gray-600 mb-1">
                            {searchTerm ? 'No matches found' : 'No WhatsApp broadcasts yet'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {searchTerm ? 'Try adjusting your search' : 'Click "Create WhatsApp Broadcast" to start your first campaign'}
                        </p>
                    </div>
                ) : (
                    <>
                        <TableContainer className="max-h-[600px] overflow-auto">
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow className="!bg-gray-50">
                                        <TableCell className="!font-semibold">Name</TableCell>
                                        <TableCell className="!font-semibold">Message Type</TableCell>
                                        <TableCell className="!font-semibold">Status</TableCell>
                                        <TableCell className="!font-semibold">Schedule</TableCell>
                                        <TableCell className="!font-semibold">Progress</TableCell>
                                        <TableCell className="!font-semibold">Stats</TableCell>
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
                                                <div className="flex items-center gap-1">
                                                    {messageTypes[broadcast.messageType]?.icon}
                                                    <span className="text-sm">
                                                        {messageTypes[broadcast.messageType]?.label || broadcast.messageType}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(broadcast.status)}`}>
                                                    {broadcastStatuses[broadcast.status]?.label || broadcast.status}
                                                </span>
                                                {broadcast.recurringPattern && broadcast.recurringPattern !== 'once' && (
                                                    <Chip
                                                        size="small"
                                                        label={`Recurring: ${broadcast.recurringPattern}`}
                                                        className="!ml-2 !text-xs"
                                                    />
                                                )}
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
                                                    <span className="text-xs text-green-600">Immediate</span>
                                                ) : broadcast.recurringPattern && broadcast.recurringPattern !== 'once' ? (
                                                    <span className="text-xs text-blue-600">
                                                        {broadcast.recurringPattern} schedule
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {broadcast.status === 'processing' ? (
                                                    <div className="w-32">
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={broadcast.progress || 0}
                                                            className="h-2 rounded"
                                                            sx={{ backgroundColor: '#E8F5E9', '& .MuiLinearProgress-bar': { backgroundColor: '#25D366' } }}
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
                                                <div className="flex gap-2">
                                                    <div className="text-xs flex items-center">
                                                        <CheckCircleIcon className="!text-green-500 !text-sm" />
                                                        <span>Sent: {broadcast.sentCount || 0}</span>
                                                    </div>
                                                    <div className="text-xs flex items-center">
                                                        <ErrorIcon className="!text-red-500 !text-sm" />
                                                        <span>Failed: {broadcast.failedCount || 0}</span>
                                                    </div>
                                                    <div className="text-xs flex items-center">
                                                        <WhatsAppIcon className="!text-green-500 !text-sm" />
                                                        <span>Delivered: {broadcast.deliveredCount || 0}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell align="right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {(broadcast.status === 'scheduled' || broadcast.status === 'draft') && (
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
                                                            <Tooltip title="Start Now">
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
                                                    {broadcast.status === 'processing' && (
                                                        <Tooltip title="Pause">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handlePauseBroadcast(broadcast._id)}
                                                                className="!text-orange-600"
                                                            >
                                                                <PauseIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {broadcast.status === 'paused' && (
                                                        <Tooltip title="Resume">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleResumeBroadcast(broadcast._id)}
                                                                className="!text-green-600"
                                                            >
                                                                <PlayCircleIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {(broadcast.status === 'scheduled' || broadcast.status === 'processing' || broadcast.status === 'paused') && (
                                                        <Tooltip title="Cancel">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleCancelBroadcast(broadcast._id)}
                                                                className="!text-red-600"
                                                            >
                                                                <CancelIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
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
                    {editingId ? 'Edit WhatsApp Broadcast' : 'Create New WhatsApp Broadcast'}
                    <IconButton
                        onClick={handleCloseDialog}
                        className="!absolute !right-3 !top-3"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Basic Info */}
                        <div className="md:col-span-2">
                            <TextField
                                label="Broadcast Name *"
                                name="name"
                                fullWidth
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <TextField
                                label="Description"
                                name="description"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Message Type Selection */}
                        <div className="md:col-span-2">
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Message Type *</FormLabel>
                                <RadioGroup
                                    name="messageType"
                                    value={formData.messageType}
                                    onChange={handleInputChange}
                                    row
                                >

                                    <FormControlLabel value="template" control={<Radio />} label={
                                        <div className="flex items-center gap-1">
                                            <WhatsAppIcon fontSize="small" />
                                            Template Message
                                        </div>
                                    } />
                                </RadioGroup>
                            </FormControl>
                        </div>

                        {/* Template Selection */}
                        {formData.messageType === 'template' && (
                            <>
                                <div className="md:col-span-2">
                                    <FormControl fullWidth>
                                        <InputLabel>WhatsApp Template *</InputLabel>
                                        <Select
                                            name="templateId"
                                            value={formData.templateId}
                                            onChange={(e) => {
                                                handleInputChange(e);
                                                handleTemplateSelect(e.target.value);
                                            }}
                                            label="WhatsApp Template *"
                                        >
                                            {[...templates.filter(template => template.status === 'APPROVED')].map(template => (
                                                <MenuItem key={template._id} value={template.name}>
                                                    {template.name} - {template.language} - {template?.status}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText>Select an approved WhatsApp template</FormHelperText>
                                    </FormControl>
                                </div>

                                {formData.templateId &&
                                    (() => {
                                        const selectedTemplate = templates.find(
                                            (template) => template.name === formData.templateId
                                        );

                                        if (!selectedTemplate || selectedTemplate.total_parameters <= 0) return null;

                                        return (
                                            <div className="md:col-span-2 space-y-3">
                                                <Typography variant="subtitle2">Template Variables:</Typography>

                                                {Array.from({ length: selectedTemplate.total_parameters }).map((_, index) => {
                                                    const key = `param_${index + 1}`;

                                                    return (
                                                        <TextField
                                                            key={key}
                                                            label={`Parameter ${index + 1}`}
                                                            value={templateVariables[key] || ""}
                                                            onChange={(e) =>
                                                                setTemplateVariables((prev) => ({
                                                                    ...prev,
                                                                    [key]: e.target.value,
                                                                }))
                                                            }
                                                            fullWidth
                                                            size="small"
                                                            helperText={`Enter value for {{${index + 1}}}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}

                                {renderTemplatePreview()}
                            </>
                        )}

                        {formData.messageType === 'template' && (() => {
                            const selectedTemplate = templates.find(
                                t => t.name === formData.templateId
                            );

                            if (!selectedTemplate) return null;

                            const isMediaTemplate = selectedTemplate.type != "TEXT";

                            console.log(selectedTemplate);

                            if (!isMediaTemplate) return null;

                            return (
                                <>
                                    {/* Upload Section */}
                                    <div className="md:col-span-2">
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<ImageIcon />}
                                            className="!mb-4"
                                        >
                                            Upload {selectedTemplate.type} Media
                                            <input
                                                type="file"
                                                hidden
                                                accept={
                                                    selectedTemplate.type === "IMAGE"
                                                        ? "image/*"
                                                        : selectedTemplate.type === "VIDEO"
                                                            ? "video/*"
                                                            : ".pdf"
                                                }
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    // ✅ validate type
                                                    if (
                                                        selectedTemplate.type === "IMAGE" &&
                                                        !file.type.startsWith("image/")
                                                    ) {
                                                        alert("Please upload an image");
                                                        return;
                                                    }

                                                    if (
                                                        selectedTemplate.type === "VIDEO" &&
                                                        !file.type.startsWith("video/")
                                                    ) {
                                                        alert("Please upload a video");
                                                        return;
                                                    }

                                                    setFormData(prev => ({
                                                        ...prev,
                                                        mediaType: file.type
                                                    }));

                                                    handleMediaUpload(file); // ✅ pass file properly
                                                }}
                                            />
                                        </Button>

                                        {/* Preview */}
                                        {mediaPreview && (
                                            <div className="mt-2">
                                                {formData.mediaType?.startsWith("image/") && (
                                                    <img
                                                        src={mediaPreview}
                                                        alt="Preview"
                                                        className="max-w-full h-auto rounded-lg max-h-64"
                                                    />
                                                )}

                                                {formData.mediaType?.startsWith("video/") && (
                                                    <video
                                                        src={mediaPreview}
                                                        controls
                                                        className="max-w-full rounded-lg max-h-64"
                                                    />
                                                )}

                                                {!formData.mediaType?.startsWith("image/") &&
                                                    !formData.mediaType?.startsWith("video/") && (
                                                        <Alert severity="info">
                                                            File uploaded successfully
                                                        </Alert>
                                                    )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Caption */}
                                    <div className="md:col-span-2">
                                        <TextField
                                            label="Caption (Optional)"
                                            name="content"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            helperText={`${formData.content.length}/1024 characters`}
                                            error={formData.content.length > 1024}
                                        />
                                    </div>
                                </>
                            );
                        })()}

                        {/* Lead Filters Section */}
                        <div className="md:col-span-2">
                            <Divider className="my-2">
                                <Chip label="Lead Filters" />
                            </Divider>
                        </div>

                        <div className="md:col-span-2">
                            <FormControl fullWidth>
                                <InputLabel>Lead Statuses</InputLabel>
                                <Select
                                    multiple
                                    value={formData.filters.statuses}
                                    onChange={handleStatusFilterChange}
                                    label="Lead Statuses"
                                    renderValue={(selected) => (
                                        <div className="flex flex-wrap gap-1">
                                            {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                                        </div>
                                    )}
                                >
                                    {leadStatuses.map(status => (
                                        <MenuItem key={status._id} value={status.key}>{status.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>

                        {user.role === "admin" && <div className="md:col-span-2">
                            <FormControl fullWidth>
                                <InputLabel>Lead Sources</InputLabel>
                                <Select
                                    multiple
                                    value={formData.filters.sources}
                                    onChange={handleSourceFilterChange}
                                    label="Lead Sources"
                                    renderValue={(selected) => (
                                        <div className="flex flex-wrap gap-1">
                                            {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                                        </div>
                                    )}
                                >
                                    {leadSources.map(source => (
                                        <MenuItem key={source} value={source}>{source}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>}

                        <div className="md:col-span-2">
                            <FormControl fullWidth>
                                <InputLabel>Assigned Counselor</InputLabel>
                                <Select
                                    name="filters.assignedCounselor"
                                    value={formData.filters.assignedCounselor}
                                    onChange={(e) => handleFilterChange('assignedCounselor', e.target.value)}
                                    label="Assigned Counselor"
                                >
                                    <MenuItem value="">All Counselors</MenuItem>
                                    {users.map(user => (
                                        <MenuItem key={user._id} value={user._id}>{user.name || user.email}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>

                        <div>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Date Range Start"
                                    value={formData.filters.dateRange.start}
                                    onChange={(date) => handleDateRangeChange('start', date)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </div>

                        <div>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Date Range End"
                                    value={formData.filters.dateRange.end}
                                    onChange={(date) => handleDateRangeChange('end', date)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </div>

                        <div className="md:col-span-2">
                            <Button
                                variant="outlined"
                                onClick={handlePreviewLeads}
                                disabled={submitting}
                                className="w-full"
                            >
                                Preview Matching Leads
                            </Button>
                        </div>

                        {/* Broadcast Settings */}
                        <div className="md:col-span-2">
                            <Divider className="my-2">
                                <Chip label="Broadcast Settings" />
                            </Divider>
                        </div>

                        <div className="md:col-span-2">
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.allowMarketing}
                                        onChange={(e) => setFormData(prev => ({ ...prev, allowMarketing: e.target.checked }))}
                                        color="success"
                                    />
                                }
                                label="Only send to leads who have opted in for marketing messages"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Broadcast Type</FormLabel>
                                <RadioGroup
                                    name="broadcastType"
                                    value={formData.broadcastType}
                                    onChange={handleInputChange}
                                    row
                                >
                                    <FormControlLabel value="immediate" control={<Radio />} label="Send Immediately" />
                                    <FormControlLabel value="scheduled" control={<Radio />} label="Schedule for Later" />
                                </RadioGroup>
                            </FormControl>
                        </div>

                        {formData.broadcastType === 'scheduled' && (
                            <>
                                <div className="md:col-span-2">
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend">Recurring Pattern</FormLabel>
                                        <RadioGroup
                                            value={recurringPattern}
                                            onChange={(e) => handleRecurringPatternChange(e.target.value)}
                                            row
                                        >
                                            <FormControlLabel value="once" control={<Radio />} label="Once" />
                                            <FormControlLabel value="daily" control={<Radio />} label="Daily" />
                                            <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
                                            <FormControlLabel value="monthly" control={<Radio />} label="Monthly" />
                                            <FormControlLabel value="custom" control={<Radio />} label="Custom Cron" />
                                        </RadioGroup>
                                    </FormControl>
                                </div>

                                {recurringPattern === 'once' && (
                                    <div className="md:col-span-2">
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DateTimePicker
                                                label="Schedule Date & Time *"
                                                value={formData.scheduledFor}
                                                onChange={(date) => setFormData(prev => ({ ...prev, scheduledFor: date }))}
                                                slotProps={{ textField: { fullWidth: true } }}
                                            />
                                        </LocalizationProvider>
                                    </div>
                                )}

                                {recurringPattern === 'custom' && (
                                    <div className="md:col-span-2">
                                        <TextField
                                            label="Cron Expression *"
                                            value={cronExpression}
                                            onChange={(e) => {
                                                setCronExpression(e.target.value);
                                                setFormData(prev => ({ ...prev, cronExpression: e.target.value }));
                                            }}
                                            fullWidth
                                            helperText="Example: 0 9 * * * (daily at 9 AM), 0 9 * * 1 (Monday at 9 AM), 0 9 1 * * (1st of month at 9 AM)"
                                            placeholder="* * * * *"
                                        />
                                    </div>
                                )}

                                {(recurringPattern === 'daily' || recurringPattern === 'weekly' || recurringPattern === 'monthly') && (
                                    <div className="md:col-span-2">
                                        <Alert severity="info">
                                            This broadcast will run automatically on the scheduled {recurringPattern} basis.
                                            {recurringPattern === 'daily' && ' It will send at 9:00 AM every day.'}
                                            {recurringPattern === 'weekly' && ' It will send at 9:00 AM every Monday.'}
                                            {recurringPattern === 'monthly' && ' It will send at 9:00 AM on the 1st of every month.'}
                                        </Alert>
                                    </div>
                                )}
                            </>
                        )}

                        <div>
                            <TextField
                                label="Batch Size"
                                name="batchSize"
                                type="number"
                                value={formData.batchSize}
                                onChange={handleInputChange}
                                helperText="Number of messages per batch (max 50 for WhatsApp)"
                                fullWidth
                                inputProps={{ min: 1, max: 50 }}
                            />
                        </div>

                        <div>
                            <TextField
                                label="Batch Delay (ms)"
                                name="batchDelay"
                                type="number"
                                value={formData.batchDelay}
                                onChange={handleInputChange}
                                helperText="Delay between batches to avoid rate limits"
                                fullWidth
                                inputProps={{ min: 1000 }}
                            />
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
                        className="!bg-green-600"
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
                                            <TableCell>WhatsApp Number</TableCell>
                                            <TableCell>Phone</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Opt-in</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previewLeads.sample.map((lead) => (
                                            <TableRow key={lead._id}>
                                                <TableCell>{lead.fullName}</TableCell>
                                                <TableCell>{lead.whatsappNumber || lead.phone}</TableCell>
                                                <TableCell>{lead.phone}</TableCell>
                                                <TableCell>{lead.status}</TableCell>
                                                <TableCell>
                                                    {lead.marketingOptIn ? (
                                                        <CheckCircleIcon className="!text-green-500 !text-sm" />
                                                    ) : (
                                                        <ErrorIcon className="!text-red-500 !text-sm" />
                                                    )}
                                                </TableCell>
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
                                                <WhatsAppIcon className="!text-green-500 !text-3xl" />
                                                <div className="text-2xl font-bold">{selectedBroadcast.sentCount || 0}</div>
                                                <div className="text-sm text-gray-500">Sent</div>
                                            </div>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <div className="text-center">
                                                <CheckCircleIcon className="!text-green-500 !text-3xl" />
                                                <div className="text-2xl font-bold">{selectedBroadcast.deliveredCount || 0}</div>
                                                <div className="text-sm text-gray-500">Delivered</div>
                                            </div>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <div className="text-center">
                                                <ErrorIcon className="!text-red-500 !text-3xl" />
                                                <div className="text-2xl font-bold">{selectedBroadcast.failedCount || 0}</div>
                                                <div className="text-sm text-gray-500">Failed</div>
                                            </div>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {selectedBroadcast.recurringPattern && selectedBroadcast.recurringPattern !== 'once' && (
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Schedule Details</Typography>
                                        <div className="space-y-2">
                                            <div><strong>Pattern:</strong> {selectedBroadcast.recurringPattern}</div>
                                            {selectedBroadcast.cronExpression && (
                                                <div><strong>Cron Expression:</strong> <code>{selectedBroadcast.cronExpression}</code></div>
                                            )}
                                            <div><strong>Next Run:</strong> {selectedBroadcast.nextRunAt ? new Date(selectedBroadcast.nextRunAt).toLocaleString() : 'Not scheduled'}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {selectedBroadcast.messageType === 'template' && selectedBroadcast.templateId && (
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Message Content</Typography>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="space-y-2">
                                                <div><strong>Template:</strong> {selectedBroadcast.templateId.name}</div>
                                                <div><strong>Language:</strong> {selectedBroadcast.templateId.language}</div>
                                                <div><strong>Body:</strong></div>
                                                <div className="whitespace-pre-wrap pl-4">{selectedBroadcast.content}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {selectedBroadcast.messageType === 'text' && selectedBroadcast.content && (
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Message Content</Typography>
                                        <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {selectedBroadcast.content}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {selectedBroadcast.mediaUrl && (
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Media</Typography>
                                        {selectedBroadcast.mediaType?.startsWith('image/') ? (
                                            <img src={selectedBroadcast.mediaUrl} alt="Media" className="max-w-full rounded-lg" />
                                        ) : selectedBroadcast.mediaType?.startsWith('video/') ? (
                                            <video src={selectedBroadcast.mediaUrl} controls className="max-w-full rounded-lg" />
                                        ) : (
                                            <Button href={selectedBroadcast.mediaUrl} target="_blank">Download Media</Button>
                                        )}
                                        {selectedBroadcast.content && (
                                            <div className="mt-2 text-gray-600">{selectedBroadcast.content}</div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

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