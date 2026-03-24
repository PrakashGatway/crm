import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../axiosInstance';

const LeadStatusPage = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/status");
      setStatuses(response.data.data);
    } catch (err) {
      setError('Failed to load statuses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' || type === 'switch' ? checked : value
    }));
  };

  const handleOpenDialog = (status = null) => {
    if (status) {
      setEditingId(status._id);
      setFormData({ ...status });
    } else {
      setEditingId(null);
      setFormData({ name: '', key: '', order: 0, isActive: true });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.key) {
      setError('Name and Key are required');
      return;
    }

    const actionType = editingId ? 'update' : 'create';
    setActionLoading(actionType);
    setError(null);

    try {
      if (editingId) {
        await api.put(`/status/${editingId}`, formData);
      } else {
        await api.post("/status", formData);
      }
      setOpenDialog(false);
      loadStatuses();
    } catch (err) {
      setError('Failed to save status. It might already exist!');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this status?')) return;
    
    setActionLoading('delete');
    setError(null);

    try {
      await api.delete(`/status/${id}`);
      loadStatuses();
    } catch (err) {
      setError('Failed to delete status');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Get initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get color based on name (consistent colors)
  const getAvatarColor = (name) => {
    const colors = [
      'bg-yellow-500',
      'bg-pink-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-orange-500',
      'bg-red-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex h-[650px] bg-gray-50 dark:bg-gray-900">
      
      {/* --- Side Tab Navigation --- */}
      <div className="w-[220px] dark:bg-gray-900 bg-white border-r border-gray-200 flex flex-col gap-2 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">Menu</h2>
        
        <button className="w-full text-left bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg">
          Lead Status
        </button>
        
        <button disabled className="w-full text-left text-gray-500 py-2.5 px-4 rounded-lg cursor-not-allowed opacity-60">
          Leads
        </button>
        <button disabled className="w-full text-left text-gray-500 py-2.5 px-4 rounded-lg cursor-not-allowed opacity-60">
          Settings
        </button>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 p-6 overflow-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lead Status</h1>
            <p className="text-sm text-gray-500 mt-1">Manage the pipeline stages for your leads</p>
          </div>
          <button 
            onClick={() => handleOpenDialog()}
            disabled={actionLoading !== null}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all ${
              actionLoading !== null 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            <AddIcon fontSize="small" />
            Add Status
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4">
            <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
              {error}
            </Alert>
          </div>
        )}

        {/* Modern Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm dark:bg-gray-900">
          {loading ? (
            <div className="p-12 text-center">
              <CircularProgress />
            </div>
          ) : (
            <div className="overflow-x-auto dark:bg-gray-900">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statuses && statuses.length > 0 ? (
                    statuses.map((status) => {
                      const isEditingThisRow = actionLoading === 'update' && editingId === status._id;
                      const isDeletingThisRow = actionLoading === 'delete';
                      const isRowLoading = isEditingThisRow || isDeletingThisRow;

                      return (
                        <tr key={status?._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(status?.name)}`}>
                                {getInitials(status?.name)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {status?.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {status?._id?.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="px-2.5 py-1 rounded-md text-xs font-mono bg-blue-50 text-blue-700">
                              {status?.key}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                              {status?.order}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              status?.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                status?.isActive ? 'bg-green-500' : 'bg-gray-400'
                              }`}></span>
                              {status?.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleOpenDialog(status)}
                                disabled={isRowLoading || actionLoading === 'create'}
                                className={`p-2 rounded-lg transition-all ${
                                  isRowLoading || actionLoading === 'create'
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                {isEditingThisRow ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : (
                                  <EditIcon fontSize="small" />
                                )}
                              </button>
                              
                              <button 
                                onClick={() => handleDelete(status._id)}
                                disabled={isRowLoading}
                                className={`p-2 rounded-lg transition-all ${
                                  isRowLoading 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                              >
                                {isDeletingThisRow ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-lg font-medium">No statuses found</p>
                          <p className="text-sm">Click "Add Status" to create your first status</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {!loading && statuses.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
            <p>Showing {statuses.length} status{statuses.length !== 1 ? 'es' : ''}</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}

        {/* --- Add/Edit Dialog --- */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle className="font-bold text-gray-800">
            {editingId ? 'Edit Status' : 'Add New Status'}
          </DialogTitle>
          
          <DialogContent className="pt-4">
            <div className="flex flex-col gap-4">
              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
                  {error}
                </Alert>
              )}
              
              <TextField
                label="Status Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g. New Lead"
                disabled={actionLoading !== null}
              />
              
              <TextField
                label="Unique Key *"
                name="key"
                value={formData.key}
                onChange={handleInputChange}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g. new_lead"
                helperText="Lowercase, no spaces."
                disabled={actionLoading !== null}
              />
              
              <TextField
                label="Display Order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                disabled={actionLoading !== null}
              />
              
              <div className="mt-2">
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      color="primary"
                      disabled={actionLoading !== null}
                    />
                  }
                  label="Is this status active?"
                />
              </div>
            </div>
          </DialogContent>
          
          <DialogActions className="p-4 gap-2">
            <button 
              onClick={() => setOpenDialog(false)} 
              disabled={actionLoading !== null}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={actionLoading === 'create' || actionLoading === 'update'}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-white transition-all ${
                actionLoading === 'create' || actionLoading === 'update'
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {(actionLoading === 'create' || actionLoading === 'update') ? (
                <CircularProgress size={20} color="inherit" />
              ) : null}
              {actionLoading === 'create' || actionLoading === 'update' 
                ? 'Saving...' 
                : editingId ? 'Update' : 'Create'}
            </button>
          </DialogActions>
        </Dialog>

      </div>
    </div>
  );
};

export default LeadStatusPage;