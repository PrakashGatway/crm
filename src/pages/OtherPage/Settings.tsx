import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuth } from "../../context/UserContext";
import api from "../../axiosInstance";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Card from "../../components/common/ComponentCard";

const SettingsPage = () => {
  const { user } = useAuth(); // Get user data from auth context
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  
  // Form hooks
  const { 
    register: passwordRegister, 
    handleSubmit: handlePasswordSubmit, 
    reset: resetPasswordForm, 
    formState: { errors } 
  } = useForm();

  // Handle password change
  const onPasswordChange = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      setLoading(true);
      await api.put("/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success("Password changed successfully");
      resetPasswordForm();
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <PageMeta
        title="Settings | Your App Name"
        description="Manage your account settings"
      />
      <PageBreadcrumb pageTitle="Settings" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-2">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-56 flex-shrink-0">
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Settings</h3>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "profile" 
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("password")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "password" 
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Change Password
                </button>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Section */}
            {activeTab === "profile" && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                    Profile Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1">
                      <Label>Username</Label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-gray-800 dark:text-gray-200">
                          {user?.userName || "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-gray-800 dark:text-gray-200">
                          {user?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Full Name</Label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-gray-800 dark:text-gray-200">
                          {user?.fullName || "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Mobile Number</Label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-gray-800 dark:text-gray-200">
                          {user?.mobileNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Account Role</Label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-gray-800 dark:text-gray-200">
                          {user?.role || "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Account Status</Label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user?.isActive 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {user?.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Account Created</Label>
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-gray-800 dark:text-gray-200">
                        {formatDate(user?.createdAt) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Password Change Section */}
            {activeTab === "password" && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                    Change Password
                  </h2>
                  
                  <form onSubmit={handlePasswordSubmit(onPasswordChange)}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...passwordRegister("currentPassword", { 
                            required: "Current password is required" 
                          })}
                          className="w-full"
                          placeholder="Enter your current password"
                        />
                        {errors.currentPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.currentPassword.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...passwordRegister("newPassword", { 
                            required: "New password is required",
                            minLength: {
                              value: 8,
                              message: "Password must be at least 8 characters"
                            }
                          })}
                          className="w-full"
                          placeholder="Enter your new password"
                        />
                        {errors.newPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.newPassword.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...passwordRegister("confirmPassword", { 
                            required: "Please confirm your new password" 
                          })}
                          className="w-full"
                          placeholder="Re-enter your new password"
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          type="submit" 
                          loading={loading}
                          className="w-full md:w-auto"
                        >
                          Update Password
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;