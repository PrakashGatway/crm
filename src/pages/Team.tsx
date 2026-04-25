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
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    Group as GroupIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import api from '../axiosInstance';
import { useAuth } from '../context/UserContext';

interface TeamMember {
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    joinedAt: string;
}

interface Team {
    _id?: string;
    name: string;
    website?: string;
    description?: string;
    members: TeamMember[];
    isActive: boolean;
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export default function TeamManagement() {
    const { user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openMemberDialog, setOpenMemberDialog] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        description: '',
        isActive: true,
    });
    const [formErrors, setFormErrors] = useState({
        name: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await api.get('/teams');
            setTeams(response.data.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch teams');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users?role=counselor');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'isActive' ? checked : value,
        }));
        if (name === 'name' && formErrors.name) {
            setFormErrors(prev => ({ ...prev, name: '' }));
        }
    };

    const validateForm = () => {
        const errors = { name: '' };
        if (!formData.name.trim()) {
            errors.name = 'Team name is required';
        }
        setFormErrors(errors);
        return !errors.name;
    };

    const handleSubmitTeam = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                ...(selectedTeam?._id && { _id: selectedTeam._id }),
                createdBy: user?._id,
            };

            const response = await api.post('/teams', payload);
            toast.success(selectedTeam?._id ? 'Team updated successfully' : 'Team created successfully');
            fetchTeams();
            handleCloseDialog();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save team');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        const result = await Swal.fire({
            title: 'Delete Team?',
            text: 'This action cannot be undone. All team data will be permanently removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/teams/${teamId}`);
                toast.success('Team deleted successfully');
                fetchTeams();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to delete team');
            }
        }
    };

    const handleAddMember = async () => {
        if (!selectedTeam?._id || !selectedUserId) {
            toast.warn('Please select a user to add');
            return;
        }

        try {
            await api.post('/teams/add-member', {
                teamId: selectedTeam._id,
                userId: selectedUserId,
            });
            toast.success('Member added successfully');
            fetchTeams();
            setOpenMemberDialog(false);
            setSelectedUserId('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (teamId: string, userId: string) => {
        const result = await Swal.fire({
            title: 'Remove Member?',
            text: 'Are you sure you want to remove this member from the team?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove',
        });

        if (result.isConfirmed) {
            try {
                await api.post('/teams/remove-member', {
                    teamId,
                    userId,
                });
                toast.success('Member removed successfully');
                fetchTeams();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to remove member');
            }
        }
    };

    const openCreateDialog = () => {
        setSelectedTeam(null);
        setFormData({
            name: '',
            website: '',
            description: '',
            isActive: true,
        });
        setFormErrors({ name: '' });
        setOpenDialog(true);
    };

    const openEditDialog = (team: Team) => {
        setSelectedTeam(team);
        setFormData({
            name: team.name,
            website: team.website || '',
            description: team.description || '',
            isActive: team.isActive,
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTeam(null);
    };

    const openMemberDialogForTeam = (team: Team) => {
        setSelectedTeam(team);
        setSelectedUserId('');
        setOpenMemberDialog(true);
    };

    const getAvailableUsers = () => {
        if (!selectedTeam) return users;
        const memberIds = selectedTeam.members.map(m => m.user._id);
        return users.filter(u => !memberIds.includes(u._id));
    };

    return (
        <div className="mx-auto">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Team Management</h2>
                            <p className="text-white/80 text-xs">
                                Create and manage teams, assign members, and track team activity
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchTeams}
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
                            Create Team
                        </Button>
                    </div>
                </div>
            </div>

            {/* Teams Grid */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <CircularProgress />
                </div>
            ) : teams.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                    <GroupIcon sx={{ fontSize: 60, color: '#9ca3af', marginBottom: 2 }} />
                    <h3 className="text-lg font-medium text-gray-600 mb-1">No teams yet</h3>
                    <p className="text-gray-500 text-sm mb-4">Create your first team to start collaborating</p>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openCreateDialog}
                        className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !px-6 !py-2 !capitalize !font-medium"
                    >
                        Create Team
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {teams.map((team) => (
                        <div
                            key={team._id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 capitalize break-words">{team.name}</h3>
                                        {team.website && (
                                            <span className="text-xs text-gray-500 block mt-1">{team.website}</span>
                                        )}
                                    </div>
                                    <Chip
                                        label={team.isActive ? 'Active' : 'Inactive'}
                                        color={team.isActive ? 'success' : 'default'}
                                        size="small"
                                        className="!font-medium"
                                    />
                                </div>

                                {team.description && (
                                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{team.description}</p>
                                )}

                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                            <GroupIcon fontSize="small" />
                                            Members ({team.members.length})
                                        </span>
                                        <Button
                                            size="small"
                                            startIcon={<PersonAddIcon />}
                                            onClick={() => openMemberDialogForTeam(team)}
                                            className="!text-indigo-600 !capitalize !text-xs !font-medium !px-2 !min-w-auto"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <List dense disablePadding className="!p-0">
                                        {team?.members.length === 0 ? (
                                            <span className="text-xs text-gray-500 block py-2">No members yet</span>
                                        ) : (
                                            team?.members?.map((member) => (
                                                <ListItem key={member?.user?._id} disableGutters className="!py-1 !px-0">
                                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                                        <Avatar
                                                            sx={{
                                                                width: 28,
                                                                height: 28,
                                                                bgcolor: '#6366f1',
                                                                fontSize: 14,
                                                            }}
                                                        >
                                                            {member?.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {member?.user?.name || member?.user?.email}
                                                            </span>
                                                        }
                                                        secondary={
                                                            <span className="text-xs text-gray-500">{member?.user?.role}</span>
                                                        }
                                                    />
                                                    <Tooltip title="Remove member">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRemoveMember(team._id!, member?.user._id)}
                                                            className="!text-red-500 hover:!bg-red-50"
                                                        >
                                                            <PersonRemoveIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </ListItem>
                                            ))
                                        )}
                                    </List>
                                </div>

                                {team.createdBy && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Created by: {team.createdBy.name || team.createdBy.email}
                                    </p>
                                )}
                                {team.createdAt && (
                                    <p className="text-xs text-gray-500">
                                        Created: {new Date(team.createdAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            <div className="px-5 pb-4 flex justify-end gap-2">
                                <Button
                                    size="small"
                                    startIcon={<EditIcon />}
                                    onClick={() => openEditDialog(team)}
                                    className="!text-gray-700 !capitalize !text-xs !font-medium !px-3 !min-w-auto"
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => handleDeleteTeam(team._id!)}
                                    className="!capitalize !text-xs !font-medium !px-3 !min-w-auto"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Team Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    className: '!rounded-2xl',
                }}
            >
                <DialogTitle className="!pb-2 !font-semibold">
                    {selectedTeam?._id ? 'Edit Team' : 'Create New Team'}
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
                        label="Team Name"
                        name="name"
                        fullWidth
                        variant="standard"
                        value={formData.name}
                        onChange={handleFormChange}
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                        required
                        className="!mb-4"
                        InputLabelProps={{ className: '!text-gray-700' }}
                    />
                    {/* <FormControl fullWidth margin="dense" className='!mb-4' variant="standard">
                        <InputLabel id="select-user-label" className="!text-gray-700">
                            Website
                        </InputLabel>
                        <Select
                            labelId="select-user-label"
                            value={formData.website}
                            onChange={(e)=>setFormData({...formData, website: e.target.value})}
                            label="Website"
                            variant="standard"
                            className="!mt-2 py-1"
                            MenuProps={{
                                PaperProps: {
                                    className: '!rounded-lg !shadow-lg',
                                },
                            }}
                        >
                            <MenuItem value={'ooshas'} className="!text-gray-700">
                                Ooshas
                            </MenuItem>
                            <MenuItem value={'gateway'} className="!text-gray-700">
                                Gateway
                            </MenuItem>
                        </Select>
                        
                    </FormControl> */}
                    <TextField
                        margin="dense"
                        label="Description"
                        name="description"
                        fullWidth
                        multiline
                        rows={3}
                        variant="standard"
                        value={formData.description}
                        onChange={handleFormChange}
                        className="!mb-4"
                        InputLabelProps={{ className: '!text-gray-700' }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleFormChange}
                                color="primary"
                            />
                        }
                        label="Team Active"
                        className="!mt-2 !ml-1"
                        componentsProps={{ typography: { className: '!text-gray-700' } }}
                    />
                </DialogContent>
                <DialogActions className="!px-6 !pb-6 !pt-2">
                    <Button
                        onClick={handleCloseDialog}
                        className="!text-gray-700 !capitalize !font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitTeam}
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                        className="!bg-indigo-600 hover:!bg-indigo-700 !capitalize !font-medium !px-6"
                    >
                        {selectedTeam?._id ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog
                open={openMemberDialog}
                onClose={() => setOpenMemberDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    className: '!rounded-2xl',
                }}
            >
                <DialogTitle className="!pb-2 !font-semibold">
                    Add Member to {selectedTeam?.name}
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenMemberDialog(false)}
                        className="!absolute !right-3 !top-3 !text-gray-500 hover:!text-gray-700"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers className="!pt-4">
                    <FormControl fullWidth margin="dense" variant="standard">
                        <InputLabel id="select-user-label" className="!text-gray-700">
                            Select User
                        </InputLabel>
                        <Select
                            labelId="select-user-label"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value as string)}
                            label="Select User"
                            variant="standard"
                            className="!mt-2 p-2"
                            MenuProps={{
                                PaperProps: {
                                    className: '!rounded-lg !shadow-lg p-2',
                                },
                            }}
                        >
                            {getAvailableUsers().map((u) => (
                                <MenuItem key={u._id} value={u._id} className="!text-gray-700">
                                    {u.name || u.email} ({u.role})
                                </MenuItem>
                            ))}
                            {getAvailableUsers().length === 0 && (
                                <MenuItem disabled className="!text-gray-400">
                                    No available users to add
                                </MenuItem>
                            )}
                        </Select>
                        <FormHelperText className="!text-gray-500 !ml-0">
                            Choose a user to add to this team
                        </FormHelperText>
                    </FormControl>
                </DialogContent>
                <DialogActions className="!px-6 !pb-6 !pt-2">
                    <Button
                        onClick={() => setOpenMemberDialog(false)}
                        className="!text-gray-700 !capitalize !font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddMember}
                        disabled={!selectedUserId}
                        startIcon={<PersonAddIcon />}
                        className="!bg-indigo-600 hover:!bg-indigo-700 !capitalize !font-medium !px-6"
                    >
                        Add Member
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}