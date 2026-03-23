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
// 🖼️ ProfilePicture Component (Extracted)
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
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
// 👁️ ViewMode Component (Extracted)
// ======================
const ViewMode = ({
  formData,
  user,
  setIsEditing,
}: {
  formData: any;
  user: any;
  setIsEditing: (editing: boolean) => void;
}) => (
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
              {formData.address?.city}, {formData.address?.country}
            </p>
            {user.role === "teacher" && formData.education[0]?.degree && (
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
            aria-label="Edit"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
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
          <p className="text-xs text-gray-500 dark:text-gray-400">Street</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.address?.street || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">City</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.address?.city || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">State</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.address?.state || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Postal Code</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.address?.zipCode || "N/A"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formData.address?.country || "N/A"}
          </p>
        </div>
      </div>
    </div>

    {user?.role === "teacher" && (
      <>
        {/* Skills */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {formData.skills
              .split(",")
              .map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-blue-100 rounded-full text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {skill.trim() || "N/A"}
                </span>
              ))}
          </div>
        </div>

        {/* Education */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Education
          </h4>
          <div className="space-y-4">
            {formData.education.map((edu: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <h5 className="font-medium text-gray-800 dark:text-white/90">{edu.degree || "N/A"}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">{edu.institution || "N/A"}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  {edu.year && <span>Year: {edu.year}</span>}
                  {edu.grade && <span>Grade: {edu.grade}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Experience
          </h4>
          <div className="space-y-4">
            {formData.experience.map((exp: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <h5 className="font-medium text-gray-800 dark:text-white/90">{exp.title || "N/A"}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">{exp.company || "N/A"}</p>
                {exp.duration && <p className="text-sm text-gray-500 dark:text-gray-400">{exp.duration}</p>}
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{exp.description || "N/A"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Social Links
          </h4>
          <div className="flex flex-wrap gap-3">
            {formData.socialLinks?.linkedin && (
              <a
                href={formData.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-blue-100 rounded-full text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              >
                LinkedIn
              </a>
            )}
            {formData.socialLinks?.twitter && (
              <a
                href={formData.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-blue-100 rounded-full text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              >
                Twitter
              </a>
            )}
            {formData.socialLinks?.facebook && (
              <a
                href={formData.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-blue-100 rounded-full text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              >
                Facebook
              </a>
            )}
            {formData.socialLinks?.instagram && (
              <a
                href={formData.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-blue-100 rounded-full text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </>
    )}
  </div>
);

// ======================
// ✏️ EditMode Component (Extracted)
// ======================
const EditMode = ({
  formData,
  handleChange,
  isUploading,
  triggerFileInput,
  addEducation,
  removeEducation,
  handleProfilePictureUpload,
  fileInputRef,
  addExperience,
  removeExperience,
  handleSave,
  setIsEditing,
  isLoading,
  user,
}:any) => (
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
            {/* Uncomment if you implement remove */}
            {/* {formData.profilePic && (
              <button
                onClick={removeProfilePicture}
                className="px-3 py-1 text-sm text-red-600 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
              >
                Remove
              </button>
            )} */}
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
          <Input
            type="email"
            name="email"
            value={formData.email}
            disabled
          />
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
              handleChange({
                target: { name: "profile.gender", value },
              })
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
        <div className="sm:col-span-2">
          <Label>Street</Label>
          <Input
            type="text"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            placeholder="Street address"
          />
        </div>
        <div>
          <Label>City</Label>
          <Input
            type="text"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            placeholder="City"
          />
        </div>
        <div>
          <Label>State</Label>
          <Input
            type="text"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
            placeholder="State"
          />
        </div>
        <div>
          <Label>Postal Code</Label>
          <Input
            type="text"
            name="address.zipCode"
            value={formData.address.zipCode}
            onChange={handleChange}
            placeholder="ZIP / Postal code"
          />
        </div>
        <div>
          <Label>Country</Label>
          <Input
            type="text"
            name="address.country"
            value={formData.address.country}
            onChange={handleChange}
            placeholder="Country"
          />
        </div>
      </div>
    </div>

    {/* Teacher-specific sections */}
    {user.role === "teacher" && (
      <>
        {/* Skills */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Skills
          </h4>
          <Label>Skills (comma separated)</Label>
          <Input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="e.g., Mathematics, Physics, Chemistry"
          />
        </div>

        {/* Education */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Education
            </h4>
            <button
              type="button"
              onClick={addEducation}
              className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
            >
              Add Education
            </button>
          </div>
          <div className="space-y-4">
            {formData.education.map((edu: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Degree</Label>
                    <Input
                      type="text"
                      name={`education.${index}.degree`}
                      value={edu.degree}
                      onChange={handleChange}
                      placeholder="e.g., B.Sc. Computer Science"
                    />
                  </div>
                  <div>
                    <Label>Institution</Label>
                    <Input
                      type="text"
                      name={`education.${index}.institution`}
                      value={edu.institution}
                      onChange={handleChange}
                      placeholder="e.g., Harvard University"
                    />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="text"
                      name={`education.${index}.year`}
                      value={edu.year}
                      onChange={handleChange}
                      placeholder="e.g., 2020"
                    />
                  </div>
                  <div>
                    <Label>Grade</Label>
                    <Input
                      type="text"
                      name={`education.${index}.grade`}
                      value={edu.grade}
                      onChange={handleChange}
                      placeholder="e.g., A+"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="px-3 py-1 text-sm text-red-600 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Experience
            </h4>
            <button
              type="button"
              onClick={addExperience}
              className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
            >
              Add Experience
            </button>
          </div>
          <div className="space-y-4">
            {formData.experience.map((exp: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      type="text"
                      name={`experience.${index}.title`}
                      value={exp.title}
                      onChange={handleChange}
                      placeholder="e.g., Senior Developer"
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      type="text"
                      name={`experience.${index}.company`}
                      value={exp.company}
                      onChange={handleChange}
                      placeholder="e.g., Google Inc."
                    />
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Input
                      type="text"
                      name={`experience.${index}.duration`}
                      value={exp.duration}
                      onChange={handleChange}
                      placeholder="e.g., 2018 - 2022"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      type="text"
                      name={`experience.${index}.description`}
                      value={exp.description}
                      onChange={handleChange}
                      placeholder="Brief description of your role"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="px-3 py-1 text-sm text-red-600 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Social Links
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>LinkedIn</Label>
              <Input
                type="text"
                name="socialLinks.linkedin"
                value={formData.socialLinks.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <Label>Twitter</Label>
              <Input
                type="text"
                name="socialLinks.twitter"
                value={formData.socialLinks.twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/username"
              />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input
                type="text"
                name="socialLinks.facebook"
                value={formData.socialLinks.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/username"
              />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input
                type="text"
                name="socialLinks.instagram"
                value={formData.socialLinks.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/username"
              />
            </div>
          </div>
        </div>
      </>
    )}

    {/* Action Buttons */}
    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
      <Button
        variant="outline"
        onClick={() => {
          setIsEditing(false);
          // Optionally: reset form here if needed
        }}
        disabled={isLoading || isUploading}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        isLoading={isLoading}
        disabled={isLoading || isUploading}
      >
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
    profile: {
      dateOfBirth: "",
      bio: "",
      gender: "",
    },
    profilePic: "",
    education: [{ degree: "", institution: "", year: "", grade: "" }],
    experience: [{ title: "", company: "", duration: "", description: "" }],
    skills: "",
    socialLinks: {
      linkedin: "",
      twitter: "",
      facebook: "",
      instagram: "",
    },
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || "",
        email: user.email || "",
        mobileNumber: user.phoneNumber || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          country: user.address?.country || "",
          zipCode: user.address?.zipCode || "",
        },
        profilePic: user.profilePic || "",
        profile: {
          dateOfBirth: user.profile?.dateOfBirth
            ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
            : "",
          bio: user.profile?.bio || "",
          gender: user.profile?.gender || "",
        },
        education: user.education?.length
          ? user.education.map((edu: any) => ({ ...edu }))
          : [{ degree: "", institution: "", year: "", grade: "" }],
        experience: user.experience?.length
          ? user.experience.map((exp: any) => ({ ...exp }))
          : [{ title: "", company: "", duration: "", description: "" }],
        skills: user.skills?.join(", ") || "",
        socialLinks: {
          linkedin: user.socialLinks?.linkedin || "",
          twitter: user.socialLinks?.twitter || "",
          facebook: user.socialLinks?.facebook || "",
          instagram: user.socialLinks?.instagram || "",
        },
      });
    }
  }, [user]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = "target" in e ? e.target : e;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else if (name.startsWith("profile.")) {
      const profileField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
    } else if (name.startsWith("education.")) {
      const [_, index, field] = name.split(".");
      const education = [...formData.education];
      education[parseInt(index)][field] = value;
      setFormData((prev) => ({ ...prev, education }));
    } else if (name.startsWith("experience.")) {
      const [_, index, field] = name.split(".");
      const experience = [...formData.experience];
      experience[parseInt(index)][field] = value;
      setFormData((prev) => ({ ...prev, experience }));
    } else if (name.startsWith("socialLinks.")) {
      const socialField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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
      await api.post("/upload/cloud", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchUserProfile();
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeProfilePicture = async () => {
    try {
      setIsUploading(true);
      await api.delete("/auth/profile-picture");
      setFormData((prev) => ({
        ...prev,
        profilePic: "",
      }));

      await fetchUserProfile();
      toast.success("Profile picture removed");
    } catch (error: any) {
      console.error("Remove error:", error);
      toast.error(error.message || "Failed to remove profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill);

      const updateData = {
        name: formData.fullName,
        phoneNumber: formData.mobileNumber,
        address: formData.address,
        profile: formData.profile,
        ...(user.role === "teacher" && {
          education: formData.education,
          experience: formData.experience,
          skills: skillsArray,
          socialLinks: formData.socialLinks,
        }),
      };

      await api.post("/auth/profile", updateData);
      await fetchUserProfile();
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "", grade: "" }],
    }));
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => {
      const education = [...prev.education];
      education.splice(index, 1);
      return { ...prev, education };
    });
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { title: "", company: "", duration: "", description: "" }],
    }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => {
      const experience = [...prev.experience];
      experience.splice(index, 1);
      return { ...prev, experience };
    });
  };

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
            addEducation={addEducation}
            removeEducation={removeEducation}
            addExperience={addExperience}
            removeExperience={removeExperience}
            handleSave={handleSave}
            setIsEditing={setIsEditing}
            isLoading={isLoading}
            user={user}
            handleProfilePictureUpload={handleProfilePictureUpload}
            fileInputRef={fileInputRef}
          />
        ) : (
          <ViewMode
            formData={formData}
            user={user}
            setIsEditing={setIsEditing}
          />
        )}
      </div>
    </>
  );
}