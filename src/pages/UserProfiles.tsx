import { useState, useEffect, useRef } from "react";
import PageMeta from "../components/common/PageMeta";
import { useAuth } from "../context/UserContext";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { toast } from "react-toastify";
import api from "../axiosInstance";

// ======================
// 🖼️ ProfilePicture Component
// ======================
const ProfilePicture = ({
  editable = false,
  formData,
  isUploading,
  triggerFileInput,
  handleProfilePictureUpload,
  fileInputRef,
}: {
  editable?: boolean;
  formData: any;
  isUploading: boolean;
  triggerFileInput: () => void;
  handleProfilePictureUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) => {
  const profilePicUrl =
    formData.profilePic &&
    `https://res.cloudinary.com/dd5s7qpsc/image/upload/${formData.profilePic}` ||
    "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740";

  return (
    <div className="relative group">
      <div className="relative w-24 h-24 overflow-hidden border-4 border-white rounded-full shadow-lg dark:border-gray-800">
        <img
          src={profilePicUrl}
          alt={formData.fullName || "Profile"}
          className="object-cover w-full h-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740";
          }}
        />
        {editable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={triggerFileInput}
              className="p-2 text-white bg-black bg-opacity-50 rounded-full"
              aria-label="Change profile picture"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {editable && (
        <div className="absolute bottom-0 right-0">
          <button
            onClick={triggerFileInput}
            className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full shadow-md hover:bg-blue-700"
            aria-label="Change profile picture"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleProfilePictureUpload}
        accept="image/*"
        className="hidden"
      />
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
          <div className="w-6 h-6 border-2 border-t-white border-r-white border-b-white border-l-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

// ======================
// 🔐 Password Change Modal
// ======================
const PasswordChangeModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,

}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { oldPassword?: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  isLoading: boolean;
 
}) => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
  const newErrors: Record<string, string> = {};
  
  // Always require old password
  if (!formData.oldPassword) {
    newErrors.oldPassword = "Current password is required";
  }
  if (!formData.newPassword) {
    newErrors.newPassword = "New password is required";
  } else if (formData.newPassword.length < 8) {
    newErrors.newPassword = "Password must be at least 8 characters";
  }
  if (formData.newPassword !== formData.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match";
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    await onSubmit(formData);
    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
  {/* Always show Current Password field */}
  <div>
    <Label>Current Password</Label>
    <Input
      type="password"
      name="oldPassword"
      value={formData.oldPassword}
      onChange={handleChange}
      placeholder="Enter current password"
      className={errors.oldPassword ? "border-red-500" : ""}
    />
    {errors.oldPassword && (
      <p className="mt-1 text-xs text-red-500">{errors.oldPassword}</p>
    )}
  </div>

  <div>
    <Label>New Password</Label>
    <Input
      type="password"
      name="newPassword"
      value={formData.newPassword}
      onChange={handleChange}
      placeholder="Enter new password (min 8 characters)"
      className={errors.newPassword ? "border-red-500" : ""}
    />
    {errors.newPassword && (
      <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
    )}
  </div>

  <div>
    <Label>Confirm New Password</Label>
    <Input
      type="password"
      name="confirmPassword"
      value={formData.confirmPassword}
      onChange={handleChange}
      placeholder="Confirm new password"
      className={errors.confirmPassword ? "border-red-500" : ""}
    />
    {errors.confirmPassword && (
      <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
    )}
  </div>

  <div className="flex gap-3 pt-4">
    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
      Cancel
    </Button>
    <Button type="submit" isLoading={isLoading} className="flex-1">
      {isLoading ? "Updating..." : "Update Password"}
    </Button>
  </div>
</form>
        </div>
      </div>
    </div>
  );
};

// ======================
// 👁️ ViewMode Component
// ======================
const ViewMode = ({
  formData,
  user,
  setIsEditing,
  onPasswordChange,
}: {
  formData: any;
  user: any;
  setIsEditing: (editing: boolean) => void;
  onPasswordChange: () => void;
  
}) => (
  <>
  

  <div className="space-y-1">
    
    {/* Profile Header */}
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <ProfilePicture formData={formData} editable={false} isUploading={false} triggerFileInput={() => { }} handleProfilePictureUpload={() => { }} fileInputRef={{ current: null } as any} />
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {formData.fullName || "N/A"}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formData.profile?.bio || "No bio available"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formData.address?.city || "N/A"}
            </p>
            {user.role === "teacher" && formData.education?.[0]?.degree && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {formData.education[0].degree} from {formData.education[0].institution}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 md:justify-end">
          <a
            href={`mailto:${formData.email}`}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Email"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </a>
          {formData.mobileNumber && (
            <a
              href={`tel:${formData.mobileNumber}`}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Phone"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </a>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Edit Profile"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </button>
          <button
            onClick={onPasswordChange}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Change Password"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    {/* Personal Information */}
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Personal Information
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
          <p className="font-medium text-gray-800 dark:text-white/90">{formData.fullName || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
          <p className="font-medium text-gray-800 dark:text-white/90">{formData.email || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
          <p className="font-medium text-gray-800 dark:text-white/90">{formData.mobileNumber || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.profile?.dateOfBirth
              ? new Date(formData.profile.dateOfBirth).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.profile?.gender || "N/A"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Bio</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.profile?.bio || "N/A"}
          </p>
        </div>
      </div>
    </div>

    {/* Address */}
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Address
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">City</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.city || "N/A"}
          </p>
        </div>
      </div>
    </div>

    {/* Teacher-specific sections would go here (same as your original) */}
    {user?.role === "teacher" && formData.skills && (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {formData.skills.split(",").map((skill: string, index: number) => (
            <span key={index} className="px-3 py-1 text-sm bg-blue-100 rounded-full text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {skill.trim()}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
  </>
);

// ======================
// ✏️ EditMode Component
// ======================
const EditMode = ({
  formData,
  handleChange,
  isUploading,
  triggerFileInput,
  handleProfilePictureUpload,
  fileInputRef,
  handleSave,
  setIsEditing,
  isLoading,
  user,
}: any) => (
  <div className="space-y-2">
    {/* Profile Header */}
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col items-center gap-5 md:flex-row">
        <ProfilePicture
          editable={true}
          formData={formData}
          isUploading={isUploading}
          triggerFileInput={triggerFileInput}
          handleProfilePictureUpload={handleProfilePictureUpload}
          fileInputRef={fileInputRef}
        />
        <div className="flex flex-col items-center gap-3 md:items-start">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {formData.fullName || "N/A"}
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={triggerFileInput}
              className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
            >
              Change Photo
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            JPG, GIF or PNG. Max size of 2MB
          </p>
        </div>
      </div>
    </div>

    {/* Personal Information */}
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Personal Information
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Full Name</Label>
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Label>Email</Label>
          <Input type="email" name="email" value={formData.email} disabled />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Label>Phone</Label>
          <Input
            type="tel"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Label>Date of Birth</Label>
          <Input
            type="date"
            name="profile.dateOfBirth"
            value={formData.profile.dateOfBirth}
            onChange={handleChange}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Label>Gender</Label>
          <Select
            name="profile.gender"
            defaultValue={formData.profile.gender}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
            onChange={(value) =>
              handleChange({ target: { name: "profile.gender", value } })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Bio</Label>
          <Input
            type="text"
            name="profile.bio"
            value={formData.profile.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
          />
        </div>
      </div>
    </div>

    {/* Address */}
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Address
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>City</Label>
          <Input
            type="text"
            name="address.city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
          />
        </div>
      </div>
    </div>

    {/* Teacher-specific sections would go here */}

    {/* Action Buttons */}
    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
      <Button
        variant="outline"
        onClick={() => setIsEditing(false)}
        disabled={isLoading || isUploading}
      >
        Cancel
      </Button>
      <Button onClick={handleSave} isLoading={isLoading} disabled={isLoading || isUploading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  </div>
);

// ======================
// 🧑‍💻 Main UserProfile Component
// ======================
export default function UserProfile() {
  const { user, fetchUserProfile } = useAuth() as any;
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
     city: "" ,
    profile: { dateOfBirth: "", bio: "", gender: "" },
    profilePic: "",
  });

  console.log(formData)
  

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || "",
        email: user.email || "",
        mobileNumber: user.phoneNumber || "",
        city: user.city || "" ,
        profilePic: user.profilePic || "",
        profile: {
          dateOfBirth: user.profile?.dateOfBirth
            ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
            : "",
          bio: user.profile?.bio || "",
          gender: user.profile?.gender || "",
        },
     
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = "target" in e ? e.target : e;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else if (name.startsWith("profile.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
    } else if (name.startsWith("socialLinks.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match("image.*")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size should be less than 2MB");
      return;
    }
    try {
      setIsUploading(true);
      const uploadData = new FormData();
      uploadData.append("file", file);
      
      const response = await api.put("/upload/cloud", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Update profilePic with the returned path/URL
      const profilePicPath = response.data?.data?.path || response.data?.data?.secure_url;
      
      // Update user profile with new profilePic
      await api.put("/auth/profile", { profilePic: profilePicPath });
      await fetchUserProfile();
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Map frontend fields to backend expected fields
      const updateData = {
        name: formData.fullName,
        phoneNumber: formData.mobileNumber,
        city: formData.address.city,
        profilePic: formData.profilePic,
        profile: formData.profile,
      };

      await api.put("/auth/profile", updateData);
      await fetchUserProfile();
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

const handleChangePassword = async (data: { oldPassword: string; newPassword: string }) => {
  try {
    setIsChangingPassword(true);
    
    await api.patch(`/auth/change-password`, {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
    
    toast.success("Password updated successfully");
  } catch (error: any) {
    console.error("Password change error:", error);
    toast.error(error.response?.data?.message || error.message || "Failed to change password");
    throw error;
  } finally {
    setIsChangingPassword(false);
  }
};

  const isAdmin = ["admin", "super_admin"].includes(user?.role);

  return (
    <>
      <PageMeta
        title="Profile Dashboard"
        description="User profile dashboard with personal information, address, and settings."
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {isEditing ? (
          <EditMode
            formData={formData}
            handleChange={handleChange}
            isUploading={isUploading}
            triggerFileInput={triggerFileInput}
            handleProfilePictureUpload={handleProfilePictureUpload}
            fileInputRef={fileInputRef}
            handleSave={handleSave}
            setIsEditing={setIsEditing}
            isLoading={isLoading}
            user={user}
          />
        ) : (
          <ViewMode
            formData={formData}
            user={user}
            setIsEditing={setIsEditing}
            onPasswordChange={() => setShowPasswordModal(true)}
          />
        )}
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
        isLoading={isChangingPassword}
   
      />
    </>
  );
}