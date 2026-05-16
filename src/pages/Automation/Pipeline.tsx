// components/automation/AutomationList.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
    Paper,
    TextField,
    Button,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Tooltip,
    Skeleton,
    Alert,
    Fade,
    InputAdornment,
    Select,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Box,
    Stack,
    LinearProgress,
    Avatar,
    Badge,
} from "@mui/material";
import {
    Plus,
    Play,
    Pause,
    Copy,
    Trash2,
    Edit,
    MoreVertical,
    Search,
    Workflow,
    Inbox,
    X as Clear,
    FilterList,
    Calendar,
    User,
    TrendingUp,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Eye,
    Activity,
} from "lucide-react";
import { automationAPI } from "../../axiosInstance";
import { toast } from "react-toastify";

const AutomationList = () => {
    const [filters, setFilters] = useState({ status: "", category: "", search: "" });
    const [automations, setAutomations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Sorting state
    const [orderBy, setOrderBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");

    // Selected rows for bulk actions
    const [selectedRows, setSelectedRows] = useState([]);

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedAutomationId, setSelectedAutomationId] = useState(null);

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        draft: 0,
        totalExecutions: 0,
        successRate: 0,
    });

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
        return () => clearTimeout(timer);
    }, [filters.search]);

    // Fetch automations when filters change
    useEffect(() => {
        fetchAutomations();
    }, [filters.status, filters.category, debouncedSearch, page, rowsPerPage, orderBy, order]);

    const fetchAutomations = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await automationAPI.getAll({
                status: filters.status,
                category: filters.category,
                search: debouncedSearch,
                page: page + 1,
                limit: rowsPerPage,
                sortBy: orderBy,
                sortOrder: order,
            });

            const data = response.data?.data || [];
            setAutomations(data);
            setTotalCount(response.data?.pagination?.total || 0);

            // Calculate statistics if this is first page or refresh
            if (page === 0) {
                calculateStats(response.data?.stats || data);
            }
        } catch (err) {
            setError(err.message || "Failed to load automations");
            toast.error("Failed to load automations");
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (data) => {
        const statsData = {
            total: data.length,
            active: data.filter(a => a.status === "ACTIVE").length,
            inactive: data.filter(a => a.status === "INACTIVE").length,
            draft: data.filter(a => a.status === "DRAFT").length,
            totalExecutions: data.reduce((sum, a) => sum + (a.executionStats?.totalExecutions || 0), 0),
            successRate: 0,
        };

        const totalCompleted = data.reduce((sum, a) => sum + (a.executionStats?.successfulExecutions || 0), 0);
        statsData.successRate = statsData.totalExecutions > 0
            ? (totalCompleted / statsData.totalExecutions) * 100
            : 0;

        setStats(statsData);
    };

    const refreshData = useCallback(async () => {
        await fetchAutomations();
    }, [fetchAutomations]);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
            await automationAPI.toggleStatus(id, newStatus);
            toast.success(`Automation ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
            await refreshData();
        } catch (err) {
            toast.error(err.message || "Failed to update status");
        }
        handleCloseMenu();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this automation? This action cannot be undone.")) return;
        try {
            await automationAPI.delete(id);
            toast.success("Automation deleted successfully");
            await refreshData();
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } catch (err) {
            toast.error(err.message || "Failed to delete automation");
        }
        handleCloseMenu();
    };

    const handleDuplicate = async (id) => {
        try {
            await automationAPI.duplicate(id);
            toast.success("Automation duplicated successfully");
            await refreshData();
        } catch (err) {
            toast.error(err.message || "Failed to duplicate automation");
        }
        handleCloseMenu();
    };

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} automation(s)?`)) return;

        try {
            await Promise.all(selectedRows.map(id => automationAPI.delete(id)));
            toast.success(`${selectedRows.length} automation(s) deleted successfully`);
            setSelectedRows([]);
            await refreshData();
        } catch (err) {
            toast.error("Failed to delete some automations");
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedRows.length === 0) return;

        try {
            await Promise.all(selectedRows.map(id => automationAPI.toggleStatus(id, status)));
            toast.success(`${selectedRows.length} automation(s) updated to ${status}`);
            setSelectedRows([]);
            await refreshData();
        } catch (err) {
            toast.error("Failed to update some automations");
        }
    };

    const handleOpenMenu = (event, id) => {
        setMenuAnchor(event.currentTarget);
        setSelectedAutomationId(id);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setSelectedAutomationId(null);
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleSelectAllRows = (event) => {
        if (event.target.checked) {
            setSelectedRows(automations.map(a => a._id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusChip = (status) => {
        const config = {
            ACTIVE: { color: "success", label: "Active", icon: <Play size={12} />, bgColor: "#10b98115", textColor: "#10b981" },
            INACTIVE: { color: "default", label: "Inactive", icon: <Pause size={12} />, bgColor: "#9ca3af15", textColor: "#6b7280" },
            DRAFT: { color: "warning", label: "Draft", icon: <Clock size={12} />, bgColor: "#f59e0b15", textColor: "#f59e0b" },
        };
        const style = config[status] || config.DRAFT;
        return (
            <Chip
                icon={style.icon}
                label={style.label}
                size="small"
                sx={{
                    bgcolor: style.bgColor,
                    color: style.textColor,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    borderRadius: 1.5,
                    "& .MuiChip-icon": { color: style.textColor, fontSize: "0.8rem" },
                }}
            />
        );
    };

    const getCategoryColor = (category) => {
        const colors = {
            LEAD_NURTURING: "#8b5cf6",
            FOLLOW_UP: "#3b82f6",
            ADMISSION: "#10b981",
            PAYMENT: "#f59e0b",
            VISA: "#ef4444",
            CUSTOM: "#6b7280",
        };
        return colors[category] || colors.CUSTOM;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getStepCount = (steps) => {
        const counts = {
            total: steps?.length || 0,
            actions: steps?.filter(s => s.type === "ACTION").length || 0,
            conditions: steps?.filter(s => s.type === "CONDITION").length || 0,
            delays: steps?.filter(s => s.type === "DELAY").length || 0,
        };
        return counts;
    };

    const getExecutionStats = (automation) => {
        const stats = automation.executionStats || {};
        const total = stats.totalExecutions || 0;
        const success = stats.successfulExecutions || 0;
        const rate = total > 0 ? (success / total) * 100 : 0;
        return { total, success, rate };
    };

    if (error && !isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <Inbox size={28} className="text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-md">{error}</p>
                <Button
                    variant="contained"
                    onClick={() => refreshData()}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header with Stats */}
            <div className="">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">
                            Automation Pipelines
                        </h1>
                    </div>
                    <Button
                        component={Link}
                        to="/automations/create"
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            textTransform: "none",
                            fontWeight: 600,
                            bgcolor: "#4f46e5",
                            "&:hover": { bgcolor: "#4338ca" },
                            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
                        }}
                    >
                        Create Automation
                    </Button>
                </div>
            </div>
            <div className="flex flex-col gap-3 mb-3">
                <div className="flex flex-col md:flex-row gap-3">
                    <TextField
                        size="small"
                        placeholder="Search by name or description..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        sx={{ flex: 1, minWidth: 220 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} className="text-gray-400" />
                                </InputAdornment>
                            ),
                            endAdornment: filters.search ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setFilters({ ...filters, search: "" })} edge="end">
                                        <Clear size={16} />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />
                    <div className="flex gap-3 flex-wrap">
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="ACTIVE">Active</MenuItem>
                                <MenuItem value="INACTIVE">Inactive</MenuItem>
                                <MenuItem value="DRAFT">Draft</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                label="Category"
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <MenuItem value="">All Categories</MenuItem>
                                <MenuItem value="LEAD_NURTURING">Lead Nurturing</MenuItem>
                                <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
                                <MenuItem value="ADMISSION">Admission</MenuItem>
                                <MenuItem value="PAYMENT">Payment</MenuItem>
                                <MenuItem value="VISA">Visa</MenuItem>
                                <MenuItem value="CUSTOM">Custom</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedRows.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <span className="text-sm text-gray-600">{selectedRows.length} selected</span>
                        <Button size="small" onClick={handleBulkDelete} color="error" variant="outlined">
                            Delete
                        </Button>
                        <Button size="small" onClick={() => handleBulkStatusUpdate("ACTIVE")} color="success" variant="outlined">
                            Activate
                        </Button>
                        <Button size="small" onClick={() => handleBulkStatusUpdate("INACTIVE")} variant="outlined">
                            Deactivate
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <TableContainer>
                    <Table sx={{ minWidth: 750 }}>
                        <TableHead sx={{ bgcolor: "#f9fafb" }}>
                            <TableRow>

                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "name"}
                                        direction={orderBy === "name" ? order : "asc"}
                                        onClick={() => handleSort("name")}
                                    >
                                        Automation
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "status"}
                                        direction={orderBy === "status" ? order : "asc"}
                                        onClick={() => handleSort("status")}
                                    >
                                        Status
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Steps</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "executionStats.totalExecutions"}
                                        direction={orderBy === "executionStats.totalExecutions" ? order : "asc"}
                                        onClick={() => handleSort("executionStats.totalExecutions")}
                                    >
                                        Executions
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Success Rate</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "createdAt"}
                                        direction={orderBy === "createdAt" ? order : "asc"}
                                        onClick={() => handleSort("createdAt")}
                                    >
                                        Created
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: rowsPerPage }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                                        <TableCell><Skeleton variant="text" width={200} /></TableCell>
                                        <TableCell><Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                        <TableCell><Skeleton variant="text" width={60} /></TableCell>
                                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                        <TableCell><Skeleton variant="text" width={60} /></TableCell>
                                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                        <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
                                    </TableRow>
                                ))
                            ) : automations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                        <div className="text-center">
                                            <Workflow size={48} className="text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No automations found</p>
                                            <Button
                                                component={Link}
                                                to="/automations/create"
                                                variant="outlined"
                                                startIcon={<Plus size={16} />}
                                                sx={{ mt: 2 }}
                                            >
                                                Create your first automation
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                automations.map((automation) => {
                                    const stepCounts = getStepCount(automation.steps);
                                    const execStats = getExecutionStats(automation);
                                    const isSelected = selectedRows.includes(automation._id);

                                    return (
                                        <TableRow
                                            key={automation._id}
                                            hover
                                            selected={isSelected}
                                            sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                                        >
                                            
                                            <TableCell>
                                                <div>
                                                    <Link
                                                        to={`/automations/edit/${automation._id}`}
                                                        className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                                                    >
                                                        {automation.name}
                                                    </Link>
                                                    {automation.description && (
                                                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                                                            {automation.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusChip(automation.status)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={automation.category?.replace("_", " ")}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: `${getCategoryColor(automation.category)}15`,
                                                        color: getCategoryColor(automation.category),
                                                        fontWeight: 500,
                                                        fontSize: "0.7rem",
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={`${stepCounts.actions} actions, ${stepCounts.conditions} conditions, ${stepCounts.delays} delays`}>
                                                    <div className="flex items-center gap-1">
                                                        <Badge badgeContent={stepCounts.total} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", height: 16, minWidth: 16 } }}>
                                                            <Activity size={16} className="text-gray-500" />
                                                        </Badge>
                                                        <span className="text-xs text-gray-600">{stepCounts.actions}A / {stepCounts.conditions}C</span>
                                                    </div>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp size={14} className="text-gray-400" />
                                                    <span className="text-sm font-medium">{execStats.total.toLocaleString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={execStats.rate}
                                                        sx={{ width: 60, height: 4, borderRadius: 2 }}
                                                    />
                                                    <span className={`text-xs font-medium ${execStats.rate >= 80 ? 'text-green-600' : execStats.rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {execStats.rate.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-600">{formatDate(automation.createdAt)}</div>
                                                <div className="text-xs text-gray-400">{new Date(automation.createdAt).toLocaleTimeString()}</div>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Tooltip title="Edit">
                                                        <IconButton
                                                            component={Link}
                                                            to={`/automations/edit/${automation._id}`}
                                                            size="small"
                                                            sx={{ color: "#4f46e5" }}
                                                        >
                                                            <Edit size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={automation.status === "ACTIVE" ? "Deactivate" : "Activate"}>
                                                        <IconButton
                                                            onClick={() => handleToggleStatus(automation._id, automation.status)}
                                                            size="small"
                                                            sx={{ color: automation.status === "ACTIVE" ? "#f59e0b" : "#10b981" }}
                                                        >
                                                            {automation.status === "ACTIVE" ? <Pause size={18} /> : <Play size={18} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Duplicate">
                                                        <IconButton
                                                            onClick={() => handleDuplicate(automation._id)}
                                                            size="small"
                                                            sx={{ color: "#6b7280" }}
                                                        >
                                                            <Copy size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="More">
                                                        <IconButton
                                                            onClick={(e) => handleOpenMenu(e, automation._id)}
                                                            size="small"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Action Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <MenuItem component={Link} to={`/automations/edit/${selectedAutomationId}`} onClick={handleCloseMenu}>
                    <ListItemIcon><Edit size={16} /></ListItemIcon>
                    <ListItemText>Edit Workflow</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDuplicate(selectedAutomationId)}>
                    <ListItemIcon><Copy size={16} /></ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <div className="h-px bg-gray-100 my-1" />
                <MenuItem onClick={() => handleDelete(selectedAutomationId)} sx={{ color: "#ef4444" }}>
                    <ListItemIcon><Trash2 size={16} className="text-red-500" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    );
};

export default AutomationList;