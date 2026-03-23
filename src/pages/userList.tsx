import { useState, useEffect } from "react";
import moment from "moment";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal/index";
import Button from "../components/ui/button/Button";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import api from "../axiosInstance";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { isOpen, openModal, closeModal } = useModal();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: "-createdAt",
    role: "",
    isActive: "",
    search: ""
  });

  const userRoles = ["admin", "manager", "user", "teacher", "super_admin", "editor", "counselor"];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      role: "user",
      name: "",
      email: "",
      phoneNumber: "",
      course: "",
      isActive: true,
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: ""
      }
    }
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sortBy
      };

      const response = await api.get("/users", { params });
      setUsers(response.data?.users);
      setTotal(response.data?.pagination?.total);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet data when user is selected
  const fetchWalletData = async (userId) => {
    setWalletLoading(true);
    try {
      const response = await api.get(`/users/${userId}`);
      setWalletData(response.data);
      console.log("Wallet Data:", response.data);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet information");
      setWalletData(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${currentStatus ? "deactivated" : "activated"} successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    await fetchWalletData(user._id);
    openModal();
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    reset({
      ...user,
      package: user.package || "",
      payInApi: user.payInApiInfo?._id || "",
      payOutApi: user.payOutApiInfo?._id || "",
      address: user.address || {
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: ""
      }
    });
    setEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    const formData = getValues();
    try {
      await api.put(`/users/${selectedUser._id}`, formData);
      toast.success("User updated successfully");
      fetchUsers();
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error.message || "Failed to save user");
    }
  };



  return (
    <div className="w-full overflow-x-auto">
      <PageMeta
        title="User Management | Your App Name"
        description="Manage system users"
      />
      <PageBreadcrumb pageTitle="User Management" />

      <div className="min-h-screen overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search (Email, Name, Mobile)
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search users..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Roles</option>
              {userRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Search Filter */}

        </div>

        {/* Actions Section */}
        <div className="mb-4 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFilters({
                page: 1,
                limit: 10,
                sortBy: "-createdAt",
                role: "",
                isActive: "",
                search: ""
              })}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Reset Filters
            </button>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rows per page:
              </label>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="rounded-md border border-gray-300 bg-white py-1 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Phone
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    last Active
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {users?.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="whitespace-nowrap px-2 py-2">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm text-gray-500 capitalize dark:text-gray-300">
                              {user.name || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        {user.role}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        <div>{user.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        <div>{user.phoneNumber}</div>

                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        <span
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                          className={`inline-flex cursor-pointer rounded-full px-2 text-xs font-semibold leading-5 ${user.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        {moment(user.createdAt).format("MMM D, YYYY")}
                      </td>

                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        {moment(user.lastActive).format("MMM D, YYYY")}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewUserDetails(user)}
                            className="border-2 p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="border-2 p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                    >
                      No users found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="text-sm text-gray-500 dark:text-gray-300">
              Showing{" "}
              <span className="font-medium">
                {(filters.page - 1) * filters.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(filters.page * filters.limit, total)}
              </span>{" "}
              of <span className="font-medium">{total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${filters.page === 1
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  }`}
              >
                Previous
              </button>
              {Array.from(
                { length: Math.ceil(total / filters.limit) },
                (_, i) => i + 1
              )
                .slice(
                  Math.max(0, filters.page - 3),
                  Math.min(Math.ceil(total / filters.limit), filters.page + 2)
                )
                .map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`rounded-md border px-3 py-1 text-sm ${filters.page === pageNum
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                      }`}
                  >
                    {pageNum}
                  </button>
                ))}
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page * filters.limit >= total}
                className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${filters.page * filters.limit >= total
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
        <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              User Details
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Detailed information about this user
            </p>
          </div>
          <div className="flex flex-col">
            <div className="custom-scrollbar h-[65vh] overflow-y-auto px-2 pb-3">
              {selectedUser && (
                <div className="space-y-6">
                  {/* Wallet Information Section */}
                  <div>
                    <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                      Wallet Information
                    </h6>
                    {walletLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                      </div>
                    ) : walletData ? (
                      <div className=" flex justify-between text-center grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800 sm:grid-cols-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            ₹{walletData.balance || walletData.data?.balance || walletData.wallet?.balance || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            ₹{walletData.totalEarned || walletData.data?.totalEarned || walletData.wallet?.totalEarned || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                          <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                            ₹{walletData.totalSpent || walletData.data?.totalSpent || walletData.wallet?.totalSpent || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Referrals</p>
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {walletData.totalReferrals || walletData.data?.totalReferrals || walletData.wallet?.totalReferrals || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Referrals Earning</p>
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {walletData.referralEarnings || walletData.data?.referralEarnings || walletData.wallet?.referralEarnings || 0}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-600 dark:bg-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No wallet information available
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                        Basic Information
                      </h6>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedUser.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedUser.profile?.gender}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedUser.role}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {new Date(selectedUser?.profile?.dateOfBirth).toLocaleDateString() || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Bio</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedUser.profile?.bio || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                        Contact Information
                      </h6>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedUser.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedUser.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${selectedUser.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                            >
                              {selectedUser.isActive ? "Active" : "Inactive"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                      Address Information
                    </h6>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Full Address</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedUser.fullAddress || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                      Timestamps
                    </h6>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {moment(selectedUser.createdAt).format("MMM D, YYYY h:mm A")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">last Active At</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {moment(selectedUser.lastActive).format("MMM D, YYYY h:mm A")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit User</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update user details
            </p>
          </div>

          <form onSubmit={handleSubmit(handleSaveUser)} className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="space-y-6">

                {/* Username & Role */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="userName" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      id="userName"
                      type="text"
                      {...register("name")}
                      className="w-full rounded-md border border-gray-300 bg-gray-100 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <select
                      id="role"
                      {...register("role", { required: "Role is required" })}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      {userRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register("email", {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      disabled
                      className="w-full rounded-md border border-gray-300 bg-gray-100 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="mobileNumber" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mobile Number
                    </label>
                    <input
                      id="mobileNumber"
                      type="tel"
                      {...register("phoneNumber")}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
                  </div>
                </div>
                {/* Address Fields */}
                <div>
                  <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                    Address Information
                  </h6>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="street" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Street
                      </label>
                      <input
                        id="street"
                        type="text"
                        {...register("address.street")}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        {...register("address.city")}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        {...register("address.state")}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Country
                      </label>
                      <input
                        id="country"
                        type="text"
                        {...register("address.country")}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="postalCode" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Postal Code
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        {...register("address.zipCode")}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default UserListPage;