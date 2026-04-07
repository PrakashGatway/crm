import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal/index";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  FormHelperText,
  SelectChangeEvent,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import api from "../axiosInstance";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import Swal from "sweetalert2";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  city?: string;
  website?: string;
  isActive: boolean;
  isVerified: boolean;
  leader?: { _id: string; name: string; email: string } | string;
  profile?: {
    dateOfBirth?: string;
    bio?: string;
    gender?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
}

interface Filters {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  role: string;
  isActive: string;
  search: string;
  isVerified: string;
}

type TabType = "list" | "add";
type Order = "asc" | "desc";
type OrderBy = "name" | "role" | "createdAt" | "lastActive";

const UserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { isOpen, openModal, closeModal } = useModal();

  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user");

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("createdAt");

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    role: "",
    isActive: "",
    search: "",
    isVerified: "",
  });

  const userRoles = ["user", "admin", "super_admin", "editor", "manager", "counselor", "leader"];

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm({
    defaultValues: {
      name: "",
      role: "user",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      city: "",
      website: "",
      isActive: true,
      isVerified: false,
      leader: "",
      profile: {
        dateOfBirth: "",
        bio: "",
        gender: "",
      },
    },
  });

  const watchedRole = watch("role");
  const watchedPassword = watch("password");

  // ─────────────────────────────────────────────────────────
  // API Calls
  // ─────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.role && { role: filters.role }),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(filters.isVerified && { isVerified: filters.isVerified }),
        ...(filters.search && { search: filters.search }),
      };
      const response = await api.get("/users", { params });
      setUsers(response.data?.users || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaders = async () => {
    setLoadingLeaders(true);
    try {
      const response = await api.get("/users", {
        params: { role: "leader", limit: 100 },
      });
      setLeaders(response.data?.users || []);
    } catch (error: any) {
      console.error("Error fetching leaders:", error);
      toast.error("Failed to load leaders list");
    } finally {
      setLoadingLeaders(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setDetailsLoading(true);
    try {
      const response = await api.get(`/users/${userId}`);
      setUserDetails(response.data?.data);
    } catch (error: any) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user information");
      setUserDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  useEffect(() => {
    if (watchedRole === "counselor" && activeTab === "add") {
      fetchLeaders();
    }
  }, [watchedRole, activeTab]);


  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === "asc";
    const newOrder = isAsc ? "desc" : "asc";
    setOrder(newOrder);
    setOrderBy(property);
    setFilters((prev) => ({
      ...prev,
      sortBy: property,
      sortOrder: newOrder,
      page: 1,
    }));
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setFilters((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setFilters((prev) => ({ ...prev, limit: newRowsPerPage, page: 1 }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    setPage(0);
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
      role: "",
      isActive: "",
      search: "",
      isVerified: "",
    });
    setSearchTerm("");
    setPage(0);
    setRowsPerPage(10);
    setOrder("desc");
    setOrderBy("createdAt");
  };

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (orderBy === "name") {
        const aVal = a.name?.toLowerCase() || "";
        const bVal = b.name?.toLowerCase() || "";
        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
        return 0;
      }
      if (orderBy === "role") {
        const aVal = a.role?.toLowerCase() || "";
        const bVal = b.role?.toLowerCase() || "";
        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
        return 0;
      }
      if (orderBy === "createdAt" || orderBy === "lastActive") {
        const aDate = new Date(a[orderBy] || 0).getTime();
        const bDate = new Date(b[orderBy] || 0).getTime();
        return order === "asc" ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ─────────────────────────────────────────────────────────
  // Form Handlers
  // ─────────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    reset({
      name: "",
      role: "user",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      city: "",
      website: "",
      isActive: true,
      isVerified: false,
      leader: "",
      profile: { dateOfBirth: "", bio: "", gender: "" },
    });
    setSelectedRole("user");
    setActiveTab("add");
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    reset({
      name: user.name || "",
      role: user.role || "user",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      city: user.city || "",
      website: user.website || "",
      isActive: user.isActive,
      isVerified: user.isVerified || false,
      leader: typeof user.leader === "object" ? user.leader?._id : user.leader || "",
      profile: {
        dateOfBirth: user.profile?.dateOfBirth
          ? moment(user.profile.dateOfBirth).format("YYYY-MM-DD")
          : "",
        bio: user.profile?.bio || "",
        gender: user.profile?.gender || "",
      },
    });
    setSelectedRole(user.role);
    if (user.role === "counselor") {
      fetchLeaders();
    }
    setActiveTab("add");
  };

  const handleCloseForm = () => {
    setActiveTab("list");
    setSelectedUser(null);
    reset();
  };

  const validateForm = (data: any, isEdit: boolean) => {
    if (!data.name?.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!isEdit) {
      if (!data.email?.trim()) {
        toast.error("Email is required");
        return false;
      }
      if (!data.password) {
        toast.error("Password is required");
        return false;
      }
      if (data.password !== data.confirmPassword) {
        toast.error("Passwords do not match");
        return false;
      }
      if (data.password && data.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return false;
      }
    }
    return true;
  };

  const handleSaveUser = async (formData: any) => {
    if (!validateForm(formData, true)) return;

    try {
      const updateData: Record<string, any> = {
        name: formData.name,
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        website: formData.website,
        isActive: formData.isActive,
        isVerified: formData.isVerified,
        ...(formData.role === "counselor" && formData.leader && {
          leader: formData.leader,
        }),
        profile: {
          dateOfBirth: formData.profile?.dateOfBirth || null,
          bio: formData.profile?.bio,
          gender: formData.profile?.gender,
        },
      };

      await api.put(`/users/${selectedUser?._id}`, updateData);
      toast.success("User updated successfully");
      fetchUsers();
      handleCloseForm();
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast.error(error.response?.data?.message || "Failed to save user");
    }
  };

  const handleAddUser = async (formData: any) => {
    if (!validateForm(formData, false)) return;

    try {
      const userData: Record<string, any> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        website: formData.website,
        isActive: formData.isActive,
        isVerified: formData.isVerified,
        ...(formData.role === "counselor" && formData.leader && {
          leader: formData.leader,
        }),
        profile: {
          dateOfBirth: formData.profile?.dateOfBirth || null,
          bio: formData.profile?.bio,
          gender: formData.profile?.gender,
        },
      };

      await api.post("/auth/create", userData);
      toast.success("User created successfully");
      fetchUsers();
      handleCloseForm();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error?.message || "Failed to create user");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${currentStatus ? "deactivated" : "activated"} successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast.error(error?.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete user");
      }
    }
  };

  const viewUserDetails = async (user: User) => {
    setSelectedUser(user);
    await fetchUserDetails(user._id);
    openModal();
  };

  // ─────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      super_admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      counselor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      leader: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      editor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      user: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return colors[role] || colors.user;
  };

  const getTabIcon = (tab: TabType) => {
    return tab === "list" ? <PersonIcon fontSize="small" /> : <AddIcon fontSize="small" />;
  };

  const getTabLabel = (tab: TabType) => {
    return tab === "list" ? "User List" : selectedUser ? "Edit User" : "Add New User";
  };

  const createSortHandler = (property: OrderBy) => () => {
    handleRequestSort(property);
  };

  const getSortIcon = (field: OrderBy) => {
    if (orderBy !== field) return null;
    return order === "asc" ? (
      <ArrowUpwardIcon fontSize="small" className="ml-1" />
    ) : (
      <ArrowDownwardIcon fontSize="small" className="ml-1" />
    );
  };

  // ─────────────────────────────────────────────────────────
  // Render: User Form (Full Screen)
  // ─────────────────────────────────────────────────────────
  const renderUserForm = () => (
    <motion.div
      key="user-form"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      className=" inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto"
    >
      {/* Form Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <IconButton
              onClick={handleCloseForm}
              className="!text-gray-600 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-800"
            >
              <CloseIcon />
            </IconButton>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedUser ? "Edit User" : "Add New User"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedUser ? "Update user details" : "Create a new user account"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="standard"
              onClick={handleCloseForm}
              className="!text-gray-700 dark:!text-gray-300 !border-gray-300 dark:!border-gray-600 hover:!bg-gray-50 dark:hover:!bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit(selectedUser ? handleSaveUser : handleAddUser)}
              startIcon={<SaveIcon />}
              className="!bg-indigo-600 hover:!bg-indigo-700 !text-white"
            >
              {selectedUser ? "Update User" : "Create User"}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-2">
        {/* Basic Information */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TextField
              label="Full Name *"
              name="name"
              fullWidth

              variant="standard"
              value={watch("name")}
              onChange={(e) => setValue("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name?.message as string}
              disabled={false}
            />
            <Controller
              name="role"
              control={control}
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel variant="standard">Role *</InputLabel>
                  <Select {...field} variant="standard" label="Role *">

                    {userRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role.replace("_", " ").toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.role && (
                    <FormHelperText>{errors.role.message as string}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
            <TextField
              label="Email Address"
              name="email"
              fullWidth
              variant="standard"
              value={watch("email")}
              onChange={(e) => setValue("email", e.target.value)}
              disabled={!!selectedUser}
              helperText={selectedUser ? "Email cannot be changed" : ""}
            />
            <TextField
              label="Mobile Number"
              name="phoneNumber"
              fullWidth
              variant="standard"
              value={watch("phoneNumber")}
              onChange={(e) => setValue("phoneNumber", e.target.value)}
            />
            <TextField
              label="City"
              name="city"
              fullWidth
              variant="standard"
              value={watch("city")}
              onChange={(e) => setValue("city", e.target.value)}
            />

            <Controller
              name="website"
              rules={{ required: "Website is required" }}
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel variant="standard">Website</InputLabel>
                  <Select {...field} label="website" variant="standard">
                    <MenuItem value="">Select Website</MenuItem>
                    <MenuItem value="gatewayAbroad">Gateway abroad</MenuItem>
                    <MenuItem value="ooshasGlobal">Ooshas Global</MenuItem>
                    <MenuItem value="ooshasPrep">Ooshas Prep</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </div>

          {/* Leader Selection for Counselor */}
          {watchedRole === "counselor" && (
            <div className="mt-6">
              <Controller
                name="leader"
                control={control}
                // rules={{ required: "Leader is required for counselor role" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.leader}>
                    <InputLabel>Assign Leader *</InputLabel>
                    <Select {...field} label="Assign Leader *" variant="standard" disabled={loadingLeaders}>
                      <MenuItem value="">
                        {loadingLeaders ? "Loading leaders..." : "Select a leader"}
                      </MenuItem>
                      {leaders.map((leader) => (
                        <MenuItem key={leader._id} value={leader._id}>
                          {leader.name} ({leader.email})
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.leader && (
                      <FormHelperText>{errors.leader.message as string}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Assign a leader to manage this counselor
              </p>
            </div>
          )}
        </div>

        {/* Password Fields (Add Only) */}
        {!selectedUser && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Set Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField
                label="Password *"
                name="password"
                type="password"
                fullWidth
                variant="standard"
                value={watch("password")}
                onChange={(e) => setValue("password", e.target.value)}
                error={!!errors.password}
                helperText={errors.password?.message as string}
              />
              <TextField
                label="Confirm Password *"
                name="confirmPassword"
                type="password"
                fullWidth
                variant="standard"
                value={watch("confirmPassword")}
                onChange={(e) => setValue("confirmPassword", e.target.value)}
                error={!!errors.confirmPassword}
                helperText={
                  errors.confirmPassword?.message ||
                  (watchedPassword && watch("confirmPassword") && watchedPassword !== watch("confirmPassword")
                    ? "Passwords do not match"
                    : "")
                }
              />
            </div>
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profile Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="profile.gender"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel variant="standard">Gender</InputLabel>
                  <Select {...field} label="Gender" variant="standard">
                    <MenuItem value="">Select Gender</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <TextField
              label="Date of Birth"
              name="profile.dateOfBirth"
              type="date"
              fullWidth
              variant="standard"
              value={watch("profile.dateOfBirth")}
              onChange={(e) => setValue("profile.dateOfBirth", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <div className="md:col-span-2">
              <TextField
                label="Bio"
                name="profile.bio"
                fullWidth
                variant="standard"
                multiline
                rows={3}
                value={watch("profile.bio")}
                onChange={(e) => setValue("profile.bio", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Status Options */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Account Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Account Active</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User can log in and access the system
                </p>
              </div>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    color="primary"
                  />
                )}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Verified</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User's email has been confirmed
                </p>
              </div>
              <Controller
                name="isVerified"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    color="primary"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ─────────────────────────────────────────────────────────
  // Render: Main Component
  // ─────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageMeta
        title="User Management | Your App Name"
        description="Manage system users"
      />

      <div className="p-4 mx-auto max-w-8xl">
        {/* ─── Animated Tabs with Framer Motion ─── */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-2 mb-6">
          <div className="relative flex gap-1">
            {(["list", "add"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "add") handleOpenAddModal();
                  else setActiveTab("list");
                }}
                className={`relative flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? "text-white" : "text-white/70 hover:text-white"
                  }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/30 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
          {activeTab === "list" && (
            <motion.div
              key="list-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Filters Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <TextField
                    size="small"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <SearchIcon className="text-gray-400 mr-2" fontSize="small" />
                      ),
                    }}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={filters.role}
                      label="Role"
                      onChange={(e: SelectChangeEvent) =>
                        handleFilterChange("role", e.target.value)
                      }
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      {userRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role.replace("_", " ")}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.isActive}
                      label="Status"
                      onChange={(e: SelectChangeEvent) =>
                        handleFilterChange("isActive", e.target.value)
                      }
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Verified</InputLabel>
                    <Select
                      value={filters.isVerified}
                      label="Verified"
                      onChange={(e: SelectChangeEvent) =>
                        handleFilterChange("isVerified", e.target.value)
                      }
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="true">Verified</MenuItem>
                      <MenuItem value="false">Unverified</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    size="small"
                    variant="standard"
                    startIcon={<RefreshIcon />}
                    onClick={resetFilters}
                    className="!text-gray-600 dark:!text-gray-300"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              {/* Users Table (Tailwind) */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <CircularProgress />
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center">
                    <PersonIcon sx={{ fontSize: 60, color: "#9ca3af", marginBottom: 2 }} />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">
                      {searchTerm ? "No matches found" : "No users yet"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {searchTerm
                        ? "Try adjusting your search"
                        : 'Click "Add New User" to create your first user'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">

                              <span className="flex items-center">
                                User {getSortIcon("name")}
                              </span>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                              <span className="flex items-center">
                                Role {getSortIcon("role")}
                              </span>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                              Contact
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                              Leader
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                              Verified
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                              <span className="flex items-center">
                                Last Active
                              </span>
                            </th>
                            <th
                              onClick={createSortHandler("createdAt")}
                              className="cursor-pointer px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                            >
                              <span className="flex items-center">
                                Created {getSortIcon("createdAt")}
                              </span>
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {users.map((user) => (
                            <tr
                              key={user._id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              {/* User */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    className="!bg-indigo-100 !text-indigo-700 dark:!bg-indigo-900 dark:!text-indigo-200 !w-10 !h-10 !text-sm font-medium"
                                  >
                                    {getInitials(user.name)}
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {user.name || "N/A"}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                    user.role
                                  )}`}
                                >
                                  {user.role.replace("_", " ")}
                                </span>
                              </td>

                              {/* Contact */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <div>{user.phoneNumber || "N/A"}</div>
                                {user.city && (
                                  <div className="text-xs text-gray-400">{user.city}</div>
                                )}
                              </td>

                              {/* Leader */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {user.role === "counselor"
                                  ? typeof user.leader === "object"
                                    ? user.leader?.name || "No leader"
                                    : "No leader"
                                  : "-"}
                              </td>

                              {/* Status Toggle */}
                              <td className="px-6 py-3 whitespace-nowrap">
                                <Tooltip
                                  title={user.isActive ? "Deactivate" : "Activate"}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      toggleUserStatus(user._id, user.isActive)
                                    }
                                    className={
                                      user.isActive
                                        ? "!text-green-600 hover:!bg-green-50 dark:hover:!bg-green-900/20"
                                        : "!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700"
                                    }
                                  >
                                    {user.isActive ? (
                                      <ToggleOnIcon fontSize="large" />
                                    ) : (
                                      <ToggleOffIcon fontSize="large" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              </td>

                              {/* Verified */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isVerified
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    }`}
                                >
                                  {user.isVerified ? "Verified" : "Unverified"}
                                </span>
                              </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {moment(user.lastActive).format("MMM D, YYYY h:mm A")}
                              </td>

                              {/* Created */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {moment(user.createdAt).format("MMM D, YYYY")}
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => viewUserDetails(user)}
                                      className="!text-indigo-600 hover:!bg-indigo-50 dark:hover:!bg-indigo-900/20"
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenEditModal(user)}
                                      className="!text-blue-600 hover:!bg-blue-50 dark:hover:!bg-blue-900/20"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteUser(user._id)}
                                      className="!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {/* Pagination - FIXED */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing{" "}
                        <span className="font-medium">
                          {filters.page === 1 ? 1 : (filters.page - 1) * filters.limit + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(filters.page * filters.limit, total)}
                        </span>{" "}
                        of <span className="font-medium">{total}</span>{" "}
                        results
                      </p>
                      <div className="flex items-center gap-2">
                        <FormControl size="small">
                          <InputLabel>Rows</InputLabel>
                          <Select
                            value={rowsPerPage}
                            label="Rows"
                            onChange={handleChangeRowsPerPage}
                            className="!w-20"
                          >
                            <MenuItem value={5}>5</MenuItem>
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                          </Select>
                        </FormControl>
                        <div className="flex gap-1">
                          <Button
                            size="small"
                            variant="standard"
                            disabled={filters.page === 1}
                            onClick={() => handleChangePage({}, filters.page - 2)}
                            className="!min-w-0 !px-3"
                          >
                            Prev
                          </Button>
                          <Button
                            size="small"
                            variant="standard"
                            disabled={filters.page * filters.limit >= total}
                            onClick={() => handleChangePage({}, filters.page)}
                            className="!min-w-0 !px-3"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "add" && renderUserForm()}
        </AnimatePresence>
      </div>

      {/* View User Details Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl m-4">
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 dark:text-white">
                User Details
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detailed information about this user
              </p>
            </div>
            <IconButton onClick={closeModal} className="!text-gray-500 hover:!text-gray-700">
              <CloseIcon />
            </IconButton>
          </div>

          {detailsLoading ? (
            <div className="flex justify-center py-12">
              <CircularProgress />
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userDetails.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getRoleColor(
                      userDetails.role
                    )}`}
                  >
                    {userDetails.role}
                  </span>
                </div>
                {userDetails.role === "counselor" && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Leader</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {typeof userDetails.leader === "object"
                        ? userDetails.leader?.name || "No leader assigned"
                        : "No leader assigned"}
                    </p>
                  </div>
                )}
              </div>

              {/* Contact */}
              <Divider className="dark:border-gray-700" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userDetails.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userDetails.phoneNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">City</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userDetails.city || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userDetails.website || "N/A"}
                  </p>
                </div>
              </div>

              {/* Profile */}
              <Divider className="dark:border-gray-700" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userDetails.profile?.gender || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userDetails.profile?.dateOfBirth
                      ? moment(userDetails.profile.dateOfBirth).format("MMM D, YYYY")
                      : "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bio</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {userDetails.profile?.bio || "N/A"}
                  </p>
                </div>
              </div>

              {/* Status */}
              <Divider className="dark:border-gray-700" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${userDetails.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                  >
                    {userDetails.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verified</p>
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${userDetails.isVerified
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                  >
                    {userDetails.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>

              {/* Timestamps */}
              <Divider className="dark:border-gray-700" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Created</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {moment(userDetails.createdAt).format("MMM D, YYYY h:mm A")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Last Active</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {moment(userDetails.lastActive).format("MMM D, YYYY h:mm A")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Updated</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {moment(userDetails.updatedAt).format("MMM D, YYYY h:mm A")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No user information available
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="contained" onClick={closeModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserListPage;