import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TextField,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
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
    Card,
    CardMedia,
    Typography,
    Box,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Grid,
    Tooltip,
    Breadcrumbs,
    LinearProgress,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    SelectChangeEvent,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Search as SearchIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    CloudUpload as CloudUploadIcon,
    InsertDriveFile as FileIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    Audiotrack as AudioIcon,
    PictureAsPdf as PdfIcon,
    Folder as FolderIcon,
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon,
    GridView as GridViewIcon,
    TableChart as TableChartIcon,
    FolderOpen as FolderOpenIcon,
    AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import api from '../../axiosInstance';

interface Asset {
    _id: string;
    originalName: string;
    fileName: string;
    filePath: string;
    fileUrl: string;
    mimeType: string;
    extension: string;
    size: number;
    type: 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'document' | 'other';
    folder: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

type Order = 'asc' | 'desc';
type OrderBy = 'originalName' | 'type' | 'folder' | 'size' | 'createdAt';
type ViewMode = 'grid' | 'table';

interface AssetsManagerProps {
    onAssetSelect?: (asset: Asset) => void;
    selectable?: boolean;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
    switch (type) {
        case 'image':
            return <ImageIcon sx={{ fontSize: 40, color: '#10b981' }} />;
        case 'video':
            return <VideoIcon sx={{ fontSize: 40, color: '#3b82f6' }} />;
        case 'audio':
            return <AudioIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />;
        case 'pdf':
            return <PdfIcon sx={{ fontSize: 40, color: '#ef4444' }} />;
        default:
            return <FileIcon sx={{ fontSize: 40, color: '#6b7280' }} />;
    }
};

const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        image: 'bg-green-100 text-green-800',
        video: 'bg-blue-100 text-blue-800',
        audio: 'bg-purple-100 text-purple-800',
        pdf: 'bg-red-100 text-red-800',
        document: 'bg-amber-100 text-amber-800',
        archive: 'bg-gray-100 text-gray-800',
        other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
};

export default function AssetsManager({ onAssetSelect, selectable = false }: AssetsManagerProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [folders, setFolders] = useState<string[]>([]);

    // Table/Grid state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(12);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('all');
    const [order, setOrder] = useState<Order>('desc');
    const [orderBy, setOrderBy] = useState<OrderBy>('createdAt');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        folder: 'general',
        tags: [] as string[],
        tagInput: '',
    });

    // Load assets
    const loadAssets = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/assets');
            setAssets(response.data.data || []);

            // Extract unique folders
            const uniqueFolders = [...new Set(response.data.data?.map((asset: Asset) => asset.folder) || [])];
            setFolders(['all', ...uniqueFolders]);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load assets');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else if (file.type.startsWith('video/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    // Upload asset
    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);
        const formDataToSend = new FormData();
        formDataToSend.append('file', selectedFile);
        formDataToSend.append('folder', formData.folder);
        formDataToSend.append('tags', formData.tags.join(','));

        try {
            const response = await api.post('/assets/upload', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('File uploaded successfully');
            handleCloseDialog();
            loadAssets();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    // Update asset metadata
    const handleUpdate = async () => {
        if (!editingAsset) return;

        try {
            await api.put(`/assets/${editingAsset._id}`, {
                folder: formData.folder,
                tags: formData.tags,
            });
            toast.success('Asset updated successfully');
            handleCloseDialog();
            loadAssets();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update asset');
        }
    };

    // Delete asset
    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Delete Asset?',
            text: 'This action cannot be undone. The file will be permanently deleted.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/assets/${id}`);
                toast.success('Asset deleted successfully');
                loadAssets();
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to delete asset');
            }
        }
    };

    // Open edit dialog
    const handleEdit = (asset: Asset) => {
        setEditingAsset(asset);
        setFormData({
            folder: asset.folder,
            tags: asset.tags,
            tagInput: '',
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setOpenDialog(true);
    };

    // Open upload dialog
    const handleOpenUploadDialog = () => {
        setEditingAsset(null);
        setFormData({
            folder: 'general',
            tags: [],
            tagInput: '',
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingAsset(null);
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    // Handle tag input
    const handleAddTag = () => {
        if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, prev.tagInput.trim()],
                tagInput: '',
            }));
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove),
        }));
    };

    // Sort handlers
    const handleRequestSort = (property: OrderBy) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Filter and sort assets
    const filteredAssets = assets
        .filter(asset => {
            const matchesSearch = asset.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesFolder = selectedFolder === 'all' || asset.folder === selectedFolder;
            return matchesSearch && matchesFolder;
        })
        .sort((a, b) => {
            if (orderBy === 'size') {
                return order === 'asc' ? a.size - b.size : b.size - a.size;
            }
            if (orderBy === 'createdAt') {
                return order === 'asc'
                    ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            const aVal = a[orderBy].toLowerCase();
            const bVal = b[orderBy].toLowerCase();
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });

    const paginatedAssets = filteredAssets.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Context menu handlers
    const handleContextMenu = (event: React.MouseEvent, asset: Asset) => {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
        setSelectedAsset(asset);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedAsset(null);
    };

    const handleDownload = (asset: Asset) => {
        window.open(`https://server.gatewayabroadeducations.com` + asset.fileUrl, '_blank');
        handleCloseMenu();
    };

    const handleCopyLink = (asset: Asset) => {
        const url = `${'https://server.gatewayabroadeducations.com'}${asset.fileUrl}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
        handleCloseMenu();
    };

    // Render grid view
    const renderGridView = () => (
        <Grid container spacing={2}>
            {paginatedAssets.map((asset) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={asset._id}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card
                            className="!rounded-xl !shadow-sm hover:!shadow-lg !transition-all !cursor-pointer !relative"
                            onContextMenu={(e) => handleContextMenu(e, asset)}
                            onClick={() => selectable && onAssetSelect?.(asset)}
                        >
                            {/* Preview Area */}
                            <div className="relative h-40 min-w-40 max-w-70 bg-gray-100 flex items-center justify-center rounded-t-xl overflow-hidden">
                                {asset.type === 'image' ? (
                                    <img
                                        src={`https://server.gatewayabroadeducations.com${asset.fileUrl}`}
                                        alt={asset.originalName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : asset.type === 'video' ? (
                                    <video className="w-full h-full object-cover" src={`https://server.gatewayabroadeducations.com${asset.fileUrl}`} />
                                ) : (
                                    <div className="flex flex-col items-center">
                                        {getFileIcon(asset.type)}
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <IconButton
                                        size="small"
                                        className="!bg-white/80 hover:!bg-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(asset);
                                        }}
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </div>
                                <div className="absolute bottom-2 left-2">
                                    <Chip
                                        label={asset.type}
                                        size="small"
                                        className={`!text-xs ${getTypeColor(asset.type)}`}
                                    />
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-3">
                                <Tooltip title={asset.originalName}>
                                    <Typography variant="body2" className="!font-medium !truncate">
                                        {asset.originalName}
                                    </Typography>
                                </Tooltip>
                                <Typography variant="caption" className="!text-gray-500">
                                    {formatFileSize(asset.size)}
                                </Typography>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {asset.tags.slice(0, 2).map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            size="small"
                                            className="!text-xs !bg-gray-100"
                                        />
                                    ))}
                                    {asset.tags.length > 2 && (
                                        <Chip
                                            label={`+${asset.tags.length - 2}`}
                                            size="small"
                                            className="!text-xs !bg-gray-100"
                                        />
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </Grid>
            ))}
        </Grid>
    );

    // Render table view
    const renderTableView = () => (
        <TableContainer component={Paper} className="!rounded-xl !shadow-sm">
            <Table>
                <TableHead className="!bg-gray-50">
                    <TableRow>
                        <TableCell>Preview</TableCell>
                        <TableCell
                            sortDirection={orderBy === 'originalName' ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === 'originalName'}
                                direction={orderBy === 'originalName' ? order : 'asc'}
                                onClick={() => handleRequestSort('originalName')}
                            >
                                Name
                            </TableSortLabel>
                        </TableCell>
                        <TableCell
                            sortDirection={orderBy === 'type' ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === 'type'}
                                direction={orderBy === 'type' ? order : 'asc'}
                                onClick={() => handleRequestSort('type')}
                            >
                                Type
                            </TableSortLabel>
                        </TableCell>
                        <TableCell
                            sortDirection={orderBy === 'folder' ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === 'folder'}
                                direction={orderBy === 'folder' ? order : 'asc'}
                                onClick={() => handleRequestSort('folder')}
                            >
                                Folder
                            </TableSortLabel>
                        </TableCell>
                        <TableCell
                            sortDirection={orderBy === 'size' ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === 'size'}
                                direction={orderBy === 'size' ? order : 'asc'}
                                onClick={() => handleRequestSort('size')}
                            >
                                Size
                            </TableSortLabel>
                        </TableCell>
                        <TableCell
                            sortDirection={orderBy === 'createdAt' ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === 'createdAt'}
                                direction={orderBy === 'createdAt' ? order : 'asc'}
                                onClick={() => handleRequestSort('createdAt')}
                            >
                                Uploaded
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Tags</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedAssets.map((asset) => (
                        <TableRow key={asset._id} hover>
                            <TableCell>
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {asset.type === 'image' ? (
                                        <img
                                            src={`https://server.gatewayabroadeducations.com${asset.fileUrl}`}
                                            alt="preview"
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    ) : (
                                        getFileIcon(asset.type)
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Tooltip title={asset.originalName}>
                                    <span className="line-clamp-1">{asset.originalName}</span>
                                </Tooltip>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={asset.type}
                                    size="small"
                                    className={getTypeColor(asset.type)}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <FolderIcon fontSize="small" className="!text-gray-400" />
                                    <span>{asset.folder}</span>
                                </div>
                            </TableCell>
                            <TableCell>{formatFileSize(asset.size)}</TableCell>
                            <TableCell>
                                {new Date(asset.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {asset.tags.slice(0, 2).map((tag) => (
                                        <Chip key={tag} label={tag} size="small" className="!text-xs" />
                                    ))}
                                    {asset.tags.length > 2 && (
                                        <Chip label={`+${asset.tags.length - 2}`} size="small" />
                                    )}
                                </div>
                            </TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => handleEdit(asset)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDelete(asset._id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Asset Management</h2>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        variant="outlined"
                        startIcon={viewMode === 'grid' ? <TableChartIcon /> : <GridViewIcon />}
                        onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                        className="!capitalize"
                    >
                        {viewMode === 'grid' ? 'Table View' : 'Grid View'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={handleOpenUploadDialog}
                        className="!bg-indigo-600 hover:!bg-indigo-700 !capitalize"
                    >
                        Upload Asset
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <TextField
                    size="small"
                    placeholder="Search by name or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!flex-1"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon className="!text-gray-400" />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl size="small" className="!min-w-[200px]">
                    <InputLabel>Folder</InputLabel>
                    <Select
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        label="Folder"
                    >
                        {folders.map((folder) => (
                            <MenuItem key={folder} value={folder}>
                                <div className="flex items-center gap-2">
                                    <FolderIcon fontSize="small" />
                                    {folder === 'all' ? 'All Folders' : folder}
                                </div>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    onClick={loadAssets}
                    className="!capitalize"
                >
                    Refresh
                </Button>
            </div>

            {/* Content */}
            {filteredAssets.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <AttachFileIcon sx={{ fontSize: 60, color: '#9ca3af' }} />
                    <Typography variant="h6" className="!text-gray-600 mt-2">
                        No assets found
                    </Typography>
                    <Typography variant="body2" className="!text-gray-500">
                        {searchTerm
                            ? 'Try adjusting your search'
                            : 'Click "Upload Asset" to add your first file'}
                    </Typography>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? renderGridView() : renderTableView()}

                    {/* Pagination */}
                    <div className="mt-4 flex justify-end">
                        <TablePagination
                            component="div"
                            count={filteredAssets.length}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[12, 24, 48]}
                        />
                    </div>
                </>
            )}

            {/* Upload/Edit Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ className: '!rounded-2xl' }}
            >
                <DialogTitle className="!pb-2">
                    {editingAsset ? 'Edit Asset' : 'Upload Asset'}
                    <IconButton
                        onClick={handleCloseDialog}
                        className="!absolute !right-3 !top-3"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {!editingAsset && (
                        <div className="mb-4">
                            <input
                                type="file"
                                id="file-upload"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                            <label htmlFor="file-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<CloudUploadIcon />}
                                    fullWidth
                                    className="!py-3"
                                >
                                    {selectedFile ? selectedFile.name : 'Select File'}
                                </Button>
                            </label>
                            {selectedFile && (
                                <Typography variant="caption" className="!text-gray-500 block mt-1">
                                    Size: {formatFileSize(selectedFile.size)}
                                </Typography>
                            )}
                        </div>
                    )}

                    {(previewUrl || (editingAsset && editingAsset.type === 'image')) && (
                        <div className="mb-4">
                            <img
                                src={previewUrl || `https://server.gatewayabroadeducations.com${editingAsset?.fileUrl}`}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg"
                            />
                        </div>
                    )}

                    <TextField
                        fullWidth
                        label="Folder"
                        value={formData.folder}
                        onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value }))}
                        margin="dense"
                        size="small"
                    />

                    <div className="mt-3">
                        <div className="flex gap-2 mb-2">
                            <TextField
                                fullWidth
                                label="Add Tag"
                                value={formData.tagInput}
                                onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                size="small"
                            />
                            <Button variant="outlined" onClick={handleAddTag}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {formData.tags.map((tag) => (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    onDelete={() => handleRemoveTag(tag)}
                                    size="small"
                                />
                            ))}
                        </div>
                    </div>
                </DialogContent>
                <DialogActions className="!p-4">
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={editingAsset ? handleUpdate : handleUpload}
                        disabled={(!editingAsset && !selectedFile) || uploading}
                        className="!bg-indigo-600 hover:!bg-indigo-700"
                    >
                        {uploading ? <CircularProgress size={24} /> : (editingAsset ? 'Update' : 'Upload')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={() => selectedAsset && handleDownload(selectedAsset)}>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Download</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => selectedAsset && handleCopyLink(selectedAsset)}>
                    <ListItemIcon>
                        <ShareIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy Link</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    if (selectedAsset) handleEdit(selectedAsset);
                    handleCloseMenu();
                }}>
                    <ListItemIcon>
                        <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Details</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => {
                    if (selectedAsset) handleDelete(selectedAsset._id);
                    handleCloseMenu();
                }} className="!text-red-600">
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" className="!text-red-600" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    );
}