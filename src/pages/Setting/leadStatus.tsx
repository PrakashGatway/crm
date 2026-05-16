import React, { useState, useEffect, use } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Label as LabelIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import api from '../../axiosInstance';
import EmailTemplatesList from './TemplateList';
import TeamManagement from '../Team';
import { GroupIcon, ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/UserContext';
import AssetsManager from './assetManagement';

interface LeadStatus {
  _id?: string;
  name: string;
  key: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type TabType = 'statuses' | 'leads' | 'emailEditor' | 'settings';
type Order = 'asc' | 'desc';
type OrderBy = 'name' | 'key' | 'order' | 'createdAt';

export default function LeadStatusPage() {
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('emailEditor');

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('order');
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    order: 0,
    isActive: true,
  });

  // ─────────────────────────────────────────────────────────
  // API Calls
  // ─────────────────────────────────────────────────────────
  const loadStatuses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/status');
      setStatuses(response.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  // ─────────────────────────────────────────────────────────
  // Table Handlers
  // ─────────────────────────────────────────────────────────
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  // Filter and sort statuses
  const filteredStatuses = statuses
    .filter(status =>
      status.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.key.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (orderBy === 'order') {
        return order === 'asc' ? a.order - b.order : b.order - a.order;
      }
      if (orderBy === 'name' || orderBy === 'key') {
        const aVal = a[orderBy].toLowerCase();
        const bVal = b[orderBy].toLowerCase();
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      }
      if (orderBy === 'createdAt' && a.createdAt && b.createdAt) {
        return order === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  const paginatedStatuses = filteredStatuses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' || type === 'switch' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleOpenDialog = (status: LeadStatus | null = null) => {
    if (status) {
      setEditingId(status._id || null);
      setFormData({
        name: status.name,
        key: status.key,
        order: status.order,
        isActive: status.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', key: '', order: 0, isActive: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Status name is required');
      return false;
    }
    if (!formData.key.trim()) {
      toast.error('Unique key is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/status/${editingId}`, formData);
        toast.success('Status updated successfully');
      } else {
        await api.post('/status', formData);
        toast.success('Status created successfully');
      }
      handleCloseDialog();
      loadStatuses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Status?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/status/${id}`);
        toast.success('Status deleted successfully');
        loadStatuses();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete status');
      }
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/status/${id}/toggle`, { isActive: !currentStatus });
      toast.success(`Status ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadStatuses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // ─────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  const getTabLabel = (tab: TabType) => {
    const labels: Record<TabType, string> = {
      statuses: 'Statuses',
      leads: 'Leads',
      assets: 'Assets',
      teams: 'Teams',
      settings: 'Settings',
      emailEditor: 'Email Templates',
      whatsapp: 'WhatsApp Templates',
    };
    return labels[tab];
  };

  const getTabIcon = (tab: TabType) => {
    const icons: Record<TabType, JSX.Element> = {
      statuses: <LabelIcon fontSize="small" />,
      teams: <GroupIcon fontSize="small" />,
      assets: <ImageIcon fontSize="small" />,
      leads: <ListIcon fontSize="small" />,
      settings: <SettingsIcon fontSize="small" />,
      emailEditor: <SettingsIcon fontSize="small" />,
      whatsapp: <SettingsIcon fontSize="small" />,
    };
    return icons[tab];
  };

  const createSortHandler = (property: OrderBy) => () => {
    handleRequestSort(property);
  };

  return (
    <div className="p-4 mx-auto">
      {/* ─── Animated Tabs with Framer Motion ─── */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-2 mb-6">
        <div className="relative flex gap-1">
          {(user.role === 'admin' ? ['statuses', "emailEditor", "assets", "teams"] : ['emailEditor']).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center justify-center gap-2 py-2 px-5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab
                ? 'text-white'
                : 'text-white/50 hover:text-white'
                }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/30 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-2">
                {getTabIcon(tab)}
                {getTabLabel(tab)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content with AnimatePresence ─── */}
      <AnimatePresence mode="wait">
        {activeTab === 'statuses' && (
          <motion.div
            key="statuses-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Table Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Lead Statuses</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Manage the pipeline stages for your leads
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <TextField
                  size="small"
                  variant="standard"
                  placeholder="Search statuses..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="!flex-1 md:!w-64"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon className="!text-gray-400" />
                      </InputAdornment>
                    ),
                    className: '!text-gray-700 py-1',
                  }}
                  InputLabelProps={{ className: '!text-gray-700' }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !px-4 !py-2 !capitalize !font-medium !whitespace-nowrap"
                >
                  Add Status
                </Button>
              </div>
            </div>

            {/* Table Container */}
            <Paper className="!rounded-2xl !shadow-sm !border !border-gray-100 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-16">
                  <CircularProgress />
                </div>
              ) : paginatedStatuses.length === 0 ? (
                <div className="p-12 text-center">
                  <LabelIcon sx={{ fontSize: 60, color: '#9ca3af', marginBottom: 2 }} />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">
                    {searchTerm ? 'No matches found' : 'No statuses yet'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'Try adjusting your search' : 'Click "Add Status" to create your first status'}
                  </p>
                </div>
              ) : (
                <>
                  <TableContainer className="max-h-[500px] overflow-auto">
                    <Table stickyHeader size="medium">
                      <TableHead>
                        <TableRow className="!bg-gray-50">
                          <TableCell
                            className="!font-semibold !text-gray-600 !text-xs !uppercase !tracking-wider"
                            sortDirection={orderBy === 'order' ? order : false}
                          >
                            <TableSortLabel
                              active={orderBy === 'order'}
                              direction={orderBy === 'order' ? order : 'asc'}
                              onClick={createSortHandler('order')}
                              IconComponent={(props) =>
                                props.direction === 'asc' ? (
                                  <ArrowUpwardIcon fontSize="small" {...props} />
                                ) : (
                                  <ArrowDownwardIcon fontSize="small" {...props} />
                                )
                              }
                              className="!text-gray-600 hover:!text-gray-900"
                            >
                              Order
                            </TableSortLabel>
                          </TableCell>
                          <TableCell
                            className="!font-semibold !text-gray-600 !text-xs !uppercase !tracking-wider"
                            sortDirection={orderBy === 'name' ? order : false}
                          >
                            <TableSortLabel
                              active={orderBy === 'name'}
                              direction={orderBy === 'name' ? order : 'asc'}
                              onClick={createSortHandler('name')}
                              IconComponent={(props) =>
                                props.direction === 'asc' ? (
                                  <ArrowUpwardIcon fontSize="small" {...props} />
                                ) : (
                                  <ArrowDownwardIcon fontSize="small" {...props} />
                                )
                              }
                              className="!text-gray-600 hover:!text-gray-900"
                            >
                              Status
                            </TableSortLabel>
                          </TableCell>
                          <TableCell
                            className="!font-semibold !text-gray-600 !text-xs !uppercase !tracking-wider"
                            sortDirection={orderBy === 'key' ? order : false}
                          >
                            <TableSortLabel
                              active={orderBy === 'key'}
                              direction={orderBy === 'key' ? order : 'asc'}
                              onClick={createSortHandler('key')}
                              className="!text-gray-600 hover:!text-gray-900"
                            >
                              Key
                            </TableSortLabel>
                          </TableCell>
                          <TableCell className="!font-semibold !text-gray-600 !text-xs !uppercase !tracking-wider !text-center">
                            Active
                          </TableCell>
                          <TableCell
                            className="!font-semibold !text-gray-600 !text-xs !uppercase !tracking-wider"
                            sortDirection={orderBy === 'createdAt' ? order : false}
                          >
                            <TableSortLabel
                              active={orderBy === 'createdAt'}
                              direction={orderBy === 'createdAt' ? order : 'asc'}
                              onClick={createSortHandler('createdAt')}
                              className="!text-gray-600 hover:!text-gray-900"
                            >
                              Created
                            </TableSortLabel>
                          </TableCell>
                          <TableCell className="!font-semibold !text-gray-600 !text-xs !uppercase !tracking-wider !text-right">
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedStatuses.map((status) => (
                          <TableRow
                            key={status._id}
                            className="!hover:!bg-gray-50 !transition-colors"
                          >
                            {/* Order */}
                            <TableCell className="!py-4">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                {status.order}
                              </span>
                            </TableCell>

                            {/* Status Name + Avatar */}
                            <TableCell className="!py-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="font-medium text-gray-900">{status.name}</div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Key */}
                            <TableCell className="!py-4">
                              <code className="px-2.5 py-1 rounded-md text-xs bg-blue-50 text-blue-800">
                                {status.key}
                              </code>
                            </TableCell>

                            {/* Active Toggle */}
                            <TableCell className="!py-4 !text-center">
                              <IconButton
                                size="small"
                                onClick={() => handleToggleActive(status._id!, status.isActive)}
                                className={status.isActive ? '!text-green-600 !text-sm' : '!text-gray-400 !text-sm !px-2'}
                              >
                                {status.isActive ? "Active" : "Inactive"}
                              </IconButton>
                            </TableCell>

                            {/* Created Date */}
                            <TableCell className="!py-4">
                              <span className="text-sm text-gray-500">
                                {status.createdAt ? new Date(status.createdAt).toLocaleDateString() : '-'}
                              </span>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="!py-4 !text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(status)}
                                    className="!text-blue-600 hover:!bg-blue-50"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(status._id!)}
                                    className="!text-red-600 hover:!bg-red-50"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  <TablePagination
                    component="div"
                    count={filteredStatuses.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    className="!border-t !border-gray-100"
                    labelRowsPerPage="Rows:"
                    sx={{
                      '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                        color: '#6b7280',
                        fontSize: '0.875rem',
                      },
                      '.MuiTablePagination-select': {
                        color: '#374151',
                      },
                      '.MuiIconButton-root': {
                        color: '#6b7280',
                      },
                    }}
                  />
                </>
              )}
            </Paper>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
                    LEADS TAB (Placeholder)
                    ═══════════════════════════════════════════════════ */}
        {activeTab === 'teams' && (
          <TeamManagement />
        )}

        {/* {activeTab === 'whatsapp' && (
          <WhatsAppTemplateEditor />
        )} */}

        {activeTab === 'assets' && (
          <motion.div
            key="assets-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <AssetsManager />
          </motion.div>)}

        {activeTab === 'emailEditor' && (
          <EmailTemplatesList />
        )}
      </AnimatePresence>

      {/* ─── Add/Edit Status Dialog ─── */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: '!rounded-2xl' }}
      >
        <DialogTitle className="!pb-2 !font-semibold">
          {editingId ? 'Edit Status' : 'Add New Status'}
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
            label="Status Name *"
            name="name"
            fullWidth
            variant="standard"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="!mb-4"
            InputLabelProps={{ className: '!text-gray-700' }}
            placeholder="e.g. New Lead"
            disabled={submitting}
          />
          <TextField
            margin="dense"
            label="Unique Key *"
            name="key"
            fullWidth
            variant="standard"
            value={formData.key}
            onChange={handleInputChange}
            required
            className="!mb-4"
            InputLabelProps={{ className: '!text-gray-700' }}
            placeholder="e.g. new_lead"
            helperText="Lowercase, no spaces or special characters"
            disabled={submitting}
          />
          <TextField
            margin="dense"
            label="Display Order"
            name="order"
            type="number"
            fullWidth
            variant="standard"
            value={formData.order}
            onChange={handleInputChange}
            className="!mb-4"
            InputLabelProps={{ className: '!text-gray-700' }}
            disabled={submitting}
          />
          <FormControlLabel
            control={
              <Switch
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                color="primary"
                disabled={submitting}
              />
            }
            label="Status Active"
            className="!mt-2 !ml-1"
            componentsProps={{ typography: { className: '!text-gray-700' } }}
          />
        </DialogContent>
        <DialogActions className="!px-6 !pb-6 !pt-2">
          <Button
            onClick={handleCloseDialog}
            className="!text-gray-700 !capitalize !font-medium"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
            className="!bg-indigo-600 hover:!bg-indigo-700 !capitalize !font-medium !px-6"
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}