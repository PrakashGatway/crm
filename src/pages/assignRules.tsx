import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Switch,
    FormControlLabel,
    CircularProgress,
    Avatar,
    Divider,
    Tooltip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    IconButton,
    FormHelperText as MuiFormHelperText,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Group as GroupIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    ToggleOn as ToggleOnIcon,
    ToggleOff as ToggleOffIcon,
    Assignment as AssignmentIcon,
    Groups as TeamIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import api from '../axiosInstance';
import { useAuth } from '../context/UserContext';

// ─────────────────────────────────────────────────────────────
// Interfaces matching backend populate structure
// ─────────────────────────────────────────────────────────────
interface TeamMember {
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
}

interface Team {
    _id: string;
    name: string;
    members: TeamMember[];
    isActive: boolean;
}

interface LeadAssignmentConfig {
    _id?: string;
    formId: string;
    campaignId?: string;
    teamId: string | Team; // Can be string (ID) or populated Team object
    team?: Team; // Populated from backend
    isActive: boolean;
    assignmentType: 'round_robin' | 'random' | 'manual';
    totalAssigned?: number;
    lastAssignedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export default function LeadAssignmentManagement() {
    const { user } = useAuth();
    const [configs, setConfigs] = useState<LeadAssignmentConfig[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<LeadAssignmentConfig | null>(null);
    const [formData, setFormData] = useState({
        formId: '',
        campaignId: '',
        teamId: '',
        isActive: true,
        assignmentType: 'round_robin' as const,
    });
    const [formErrors, setFormErrors] = useState({
        formId: '',
        teamId: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/assign');
            setConfigs(response.data.data || []);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to fetch configurations');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams?isActive=true');
            setTeams(response.data.data || response.data.teams || []);
        } catch (error) {
            console.error('Failed to fetch teams', error);
            toast.error('Failed to fetch teams');
        }
    };

    useEffect(() => {
        fetchConfigs();
        fetchTeams();
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'isActive' ? checked : value,
        }));
        if (name === 'formId' && formErrors.formId) {
            setFormErrors(prev => ({ ...prev, formId: '' }));
        }
        if (name === 'teamId' && formErrors.teamId) {
            setFormErrors(prev => ({ ...prev, teamId: '' }));
        }
    };

    const handleAssignmentTypeChange = (e: any) => {
        setFormData(prev => ({
            ...prev,
            assignmentType: e.target.value,
        }));
    };

    const validateForm = () => {
        const errors = { formId: '', teamId: '' };
        if (!formData.formId.trim()) {
            errors.formId = 'Form ID is required';
        }
        if (!formData.teamId) {
            errors.teamId = 'Please select a team';
        }
        setFormErrors(errors);
        return !errors.formId && !errors.teamId;
    };

    // ─────────────────────────────────────────────────────────
    // CRUD Operations - Match backend payload & endpoints
    // ─────────────────────────────────────────────────────────
    const handleSubmitConfig = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            // Payload matches backend expectations:
            // { formId, teamId, campaignId?, assignmentType?, isActive?, _id? }
            const payload = {
                formId: formData.formId,
                teamId: formData.teamId,
                ...(formData.campaignId && { campaignId: formData.campaignId }),
                ...(formData.assignmentType && { assignmentType: formData.assignmentType }),
                ...(formData.isActive !== undefined && { isActive: formData.isActive }),
                ...(selectedConfig?._id && { _id: selectedConfig._id }),
            };

            // POST /assign - upsert (create or update)
            const response = await api.post('/assign', payload);
            
            toast.success(
                selectedConfig?._id 
                    ? 'Configuration updated successfully' 
                    : 'Configuration created successfully'
            );
            fetchConfigs();
            handleCloseDialog();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save configuration');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfig = async (configId: string) => {
        const result = await Swal.fire({
            title: 'Delete Configuration?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                // DELETE /assign/:id
                await api.delete(`/assign/${configId}`);
                toast.success('Configuration deleted successfully');
                fetchConfigs();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to delete configuration');
            }
        }
    };

    const handleToggleActive = async (configId: string, currentStatus: boolean) => {
        try {
            // PATCH /assign/:id/toggle-active
            await api.patch(`/assign/toggle/${configId}`);
            toast.success(`Configuration ${currentStatus ? 'deactivated' : 'activated'}`);
            fetchConfigs();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    // ─────────────────────────────────────────────────────────
    // Dialog Handlers
    // ─────────────────────────────────────────────────────────
    const openCreateDialog = () => {
        setSelectedConfig(null);
        setFormData({
            formId: '',
            campaignId: '',
            teamId: '',
            isActive: true,
            assignmentType: 'round_robin',
        });
        setFormErrors({ formId: '', teamId: '' });
        setOpenDialog(true);
    };

    const openEditDialog = (config: LeadAssignmentConfig) => {
        setSelectedConfig(config);
        // Handle teamId as string or populated object
        const teamIdValue = typeof config.teamId === 'string' ? config.teamId : config.teamId._id;
        
        setFormData({
            formId: config.formId,
            campaignId: config.campaignId || '',
            teamId: teamIdValue,
            isActive: config.isActive,
            assignmentType: config.assignmentType,
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedConfig(null);
    };

    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────
    const getAssignmentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            round_robin: 'Round Robin',
            random: 'Random',
            manual: 'Manual',
        };
        return labels[type] || type;
    };

    const getAssignmentTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            round_robin: 'info',
            random: 'primary',
            manual: 'default',
        };
        return colors[type] || 'default';
    };

    // Extract members from populated team object (backend structure)
    const getTeamMembers = (config: LeadAssignmentConfig): TeamMember[] => {
        // If team is populated from backend
        if (config?.team?.members) {
            return config?.team?.members;
        }
        // Fallback: find team in local state
        const teamId = typeof config.teamId === 'string' ? config?.teamId : config?.teamId?._id;
        const team = teams?.find(t => t._id === teamId);
        return team?.members || [];
    };

    // Get team name safely
    const getTeamName = (config: LeadAssignmentConfig): string => {
        if (config.teamId?.name) return config.teamId.name;
        if (typeof config.teamId === 'string') {
            const team = teams.find(t => t._id === config.teamId);
            return team?.name || 'Unknown Team';
        }
        return 'Unknown Team';
    };

    return (
        <div className="p-4 mx-auto">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <AssignmentIcon sx={{ fontSize: 40, color: 'white' }} />
                        <div>
                            <h2 className="text-xl font-semibold text-white">Lead Assignment</h2>
                            <p className="text-white/80 text-xs">
                                Assign leads to teams by form and campaign
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchConfigs}
                            className="!text-white !border-white/50 hover:!border-white hover:!bg-white/10 !rounded-lg !px-4 !py-2 !capitalize"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={openCreateDialog}
                            className="!bg-white !text-indigo-600 hover:!bg-gray-100 !rounded-lg !px-4 !py-2 !capitalize !font-medium"
                        >
                            Create Config
                        </Button>
                    </div>
                </div>
            </div>

            {/* Configs Grid */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <CircularProgress />
                </div>
            ) : configs.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                    <AssignmentIcon sx={{ fontSize: 60, color: '#9ca3af', marginBottom: 2 }} />
                    <h3 className="text-lg font-medium text-gray-600 mb-1">No configurations yet</h3>
                    <p className="text-gray-500 text-sm mb-4">Create your first lead assignment configuration</p>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openCreateDialog}
                        className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !px-6 !py-2 !capitalize !font-medium"
                    >
                        Create Config
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {configs.map((config) => {
                        const teamMembers = getTeamMembers(config);
                        return (
                            <div
                                key={config._id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 break-words">{config.formId}</h3>
                                            {config.campaignId && (
                                                <span className="text-xs text-gray-500 block mt-1">
                                                    Campaign: {config.campaignId}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Chip
                                                label={getAssignmentTypeLabel(config.assignmentType)}
                                                color={getAssignmentTypeColor(config.assignmentType) as any}
                                                size="small"
                                                className="!font-medium !text-xs"
                                            />
                                            {/* <IconButton
                                                size="small"
                                                onClick={() => handleToggleActive(config._id!, config.isActive)}
                                                className={config.isActive ? '!text-green-600' : '!text-gray-400'}
                                            >
                                                {config.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                                            </IconButton> */}
                                        </div>
                                    </div>

                                    {/* Team Section - Using populated team from backend */}
                                    <div className="mb-4 mt-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TeamIcon className="!text-indigo-600" fontSize="small" />
                                            <span className="text-sm font-semibold text-gray-700">Assigned Team</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="!bg-indigo-100 !text-indigo-700 !w-8 !h-8 !text-sm">
                                                {getTeamName(config).charAt(0).toUpperCase()}
                                            </Avatar>
                                            <span className="text-sm font-medium uppercase text-gray-900">
                                                {getTeamName(config)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
                                            <GroupIcon fontSize="small" />
                                            Team Members ({teamMembers.length})
                                        </span>
                                        <List dense disablePadding className="grid grid-cols-2 gap-1">
                                            {teamMembers.length === 0 ? (
                                                <span className="text-xs text-gray-500 block py-2">No members in team</span>
                                            ) : (
                                                teamMembers.slice(0, 3).map((member) => (
                                                    <ListItem key={member.user._id} disableGutters className=" !px-0">
                                                        <ListItemAvatar sx={{ minWidth: 36 }}>
                                                            <Avatar
                                                                sx={{
                                                                    width: 28,
                                                                    height: 28,
                                                                    bgcolor: '#6366f1',
                                                                    fontSize: 14,
                                                                }}
                                                            >
                                                                {member.user.name?.charAt(0).toUpperCase() || 'U'}
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <div className='space-y-0'>
                                                            <span className="text-xs !mb-0 !pb-0 font-medium text-gray-900">
                                                                {member.user.name}
                                                            </span>
                                                            <span className="text-xs !m-0 !p-0 text-gray-400 block">
                                                                {member.user.role}
                                                            </span>
                                                        </div>
                                                    </ListItem>
                                                ))
                                            )}
                                            {teamMembers.length > 3 && (
                                                <span className="text-xs text-gray-400 block py-1">
                                                    +{teamMembers.length - 3} more...
                                                </span>
                                            )}
                                        </List>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-start justify-between gap-4 text-xs text-gray-500">
                                        <div>
                                        {config.totalAssigned !== undefined && (
                                            <span>Total Assigned: {config.totalAssigned}</span>
                                        )}
                                        {config.lastAssignedAt && (
                                            <span>Last: {new Date(config.lastAssignedAt).toLocaleDateString()}</span>
                                        )}
                                        
                                        </div>
                                        {config.createdAt && (
                                        <p className="text-xs text-gray-400">
                                            Created: {new Date(config.createdAt).toLocaleDateString()}
                                        </p>
                                    )}
                                    </div>

                                    
                                </div>

                                <div className="px-5 pb-4 flex justify-end gap-2">
                                    <Button
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => openEditDialog(config)}
                                        className="!text-gray-700 !capitalize !text-xs !font-medium !px-3 !min-w-auto"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleDeleteConfig(config._id!)}
                                        className="!capitalize !text-xs !font-medium !px-3 !min-w-auto"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Config Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ className: '!rounded-2xl' }}
            >
                <DialogTitle className="!pb-2 !font-semibold">
                    {selectedConfig?._id ? 'Edit Configuration' : 'Create New Configuration'}
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseDialog}
                        className="!absolute !right-3 !top-3 !text-gray-500 hover:!text-gray-700"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers className="!pt-4">
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Form ID"
                        name="formId"
                        fullWidth
                        variant="standard"
                        value={formData.formId}
                        onChange={handleFormChange}
                        error={!!formErrors.formId}
                        helperText={formErrors.formId}
                        required
                        className="!mb-4"
                        InputLabelProps={{ className: '!text-gray-700' }}
                        placeholder="e.g., contact_form_v2"
                    />
                    <TextField
                        margin="dense"
                        label="Campaign ID (Optional)"
                        name="campaignId"
                        fullWidth
                        variant="standard"
                        value={formData.campaignId}
                        onChange={handleFormChange}
                        className="!mb-4"
                        InputLabelProps={{ className: '!text-gray-700' }}
                        placeholder="e.g., summer_promo_2024"
                    />
                    
                    {/* Team Select - Send teamId (ObjectId string) to backend */}
                    <FormControl fullWidth margin="dense" variant="standard" className="!mb-4" error={!!formErrors.teamId}>
                        <InputLabel id="team-label" className="!text-gray-700">
                            Assign Team <span className="text-red-500">*</span>
                        </InputLabel>
                        <Select
                            labelId="team-label"
                            value={formData.teamId}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, teamId: e.target.value as string }));
                                if (formErrors.teamId) {
                                    setFormErrors(prev => ({ ...prev, teamId: '' }));
                                }
                            }}
                            label="Assign Team *"
                            variant="standard"
                            className="!mt-2"
                            MenuProps={{
                                PaperProps: { className: '!rounded-lg !shadow-lg' },
                            }}
                        >
                            {teams.map((team) => (
                                <MenuItem key={team._id} value={team._id} className="!text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#6366f1', fontSize: 12 }}>
                                            {team.name?.charAt(0).toUpperCase() || 'T'}
                                        </Avatar>
                                        <span>{team.name}</span>
                                        <span className="text-gray-400 text-xs">({team.members?.length || 0} members)</span>
                                    </div>
                                </MenuItem>
                            ))}
                            {teams.length === 0 && (
                                <MenuItem disabled className="!text-gray-400">
                                    No active teams available
                                </MenuItem>
                            )}
                        </Select>
                        {formErrors.teamId && (
                            <FormHelperText className="!text-red-500 !ml-0">
                                {formErrors.teamId}
                            </FormHelperText>
                        )}
                        <FormHelperText className="!text-gray-500 !ml-0">
                            Leads will be assigned to members of this team
                        </FormHelperText>
                    </FormControl>

                    <FormControl fullWidth margin="dense" variant="standard" className="!mb-4">
                        <InputLabel id="assignment-type-label" className="!text-gray-700">
                            Assignment Type
                        </InputLabel>
                        <Select
                            labelId="assignment-type-label"
                            value={formData.assignmentType}
                            onChange={handleAssignmentTypeChange}
                            label="Assignment Type"
                            variant="standard"
                            className="!mt-2"
                            MenuProps={{
                                PaperProps: { className: '!rounded-lg !shadow-lg' },
                            }}
                        >
                            <MenuItem value="round_robin" className="!text-gray-700">
                                Round Robin - Distribute evenly in order
                            </MenuItem>
                            <MenuItem value="random" className="!text-gray-700">
                                Random - Assign randomly
                            </MenuItem>
                            <MenuItem value="manual" className="!text-gray-700">
                                Manual - No auto-assignment
                            </MenuItem>
                        </Select>
                        <MuiFormHelperText className="!text-gray-500 !ml-0">
                            How leads should be distributed among team members
                        </MuiFormHelperText>
                    </FormControl>

                    {/* Preview Selected Team Members */}
                    {formData.teamId && (
                        <div className="!mb-4 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 block mb-2">
                                Team Members ({(() => {
                                    const team = teams.find(t => t._id === formData.teamId);
                                    return team?.members?.length || 0;
                                })()})
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const team = teams.find(t => t._id === formData.teamId);
                                    const members = team?.members || [];
                                    if (members.length === 0) {
                                        return <span className="text-xs text-gray-500">No members in this team</span>;
                                    }
                                    return members.map((member) => (
                                        <Chip
                                            key={member.user._id}
                                            label={member.user.name || member.user.email}
                                            size="small"
                                            className="!bg-gray-200 !text-gray-700"
                                            avatar={
                                                <Avatar sx={{ width: 20, height: 20, bgcolor: '#6366f1', fontSize: 10 }}>
                                                    {member.user.name?.charAt(0).toUpperCase()}
                                                </Avatar>
                                            }
                                        />
                                    ));
                                })()}
                            </div>
                        </div>
                    )}

                    <FormControlLabel
                        control={
                            <Switch
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleFormChange}
                                color="primary"
                            />
                        }
                        label="Configuration Active"
                        className="!mt-2 !ml-1"
                        componentsProps={{ typography: { className: '!text-gray-700' } }}
                    />
                </DialogContent>
                <DialogActions className="!px-6 !pb-6 !pt-2">
                    <Button onClick={handleCloseDialog} className="!text-gray-700 !capitalize !font-medium">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitConfig}
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                        className="!bg-indigo-600 hover:!bg-indigo-700 !capitalize !font-medium !px-6"
                    >
                        {selectedConfig?._id ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}