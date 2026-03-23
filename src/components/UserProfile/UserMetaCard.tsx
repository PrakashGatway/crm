import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/UserContext";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import Select from "../form/Select";

export default function UserMetaCard({ user }: any) {
  const { isOpen, openModal, closeModal } = useModal();
  const { fetchUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    mobileNumber: user?.phoneNumber || "",
    address: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      country: user?.address?.country || "",
      zipCode: user?.address?.zipCode || "",
    },
    profile: {
      dateOfBirth: user?.profile?.dateOfBirth 
        ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0] 
        : "",
      bio: user?.profile?.bio || "",
      gender: user?.profile?.gender || ""
    },
    // Teacher-specific fields
    education: user?.education?.map((edu: any) => ({ ...edu })) || [{ degree: "", institution: "", year: "", grade: "" }],
    experience: user?.experience?.map((exp: any) => ({ ...exp })) || [{ title: "", company: "", duration: "", description: "" }],
    skills: user?.skills?.join(", ") || "",
    socialLinks: {
      linkedin: user?.socialLinks?.linkedin || "",
      twitter: user?.socialLinks?.twitter || "",
      facebook: user?.socialLinks?.facebook || "",
      instagram: user?.socialLinks?.instagram || ""
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    let name, value;

    if ((e as React.ChangeEvent<HTMLInputElement>).target) {
      const event = e as React.ChangeEvent<HTMLInputElement>;
      ({ name, value } = event.target);
    } else {
      name = e.target.name;
      value = e.target.value;
    }

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
      setFormData(prev => ({ ...prev, education }));
    } else if (name.startsWith("experience.")) {
      const [_, index, field] = name.split(".");
      const experience = [...formData.experience];
      experience[parseInt(index)][field] = value;
      setFormData(prev => ({ ...prev, experience }));
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

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Process skills array
      const skillsArray = formData.skills
        .split(",")
        .map(skill => skill.trim())
        .filter(skill => skill);

      const updateData = {
        name: formData.fullName,
        phoneNumber: formData.mobileNumber,
        address: formData.address,
        profile: formData.profile,
        ...(user.role === "teacher" && {
          education: formData.education,
          experience: formData.experience,
          skills: skillsArray,
          socialLinks: formData.socialLinks
        })
      };

      await api.post("/auth/profile", updateData);
      fetchUserProfile();
      toast.success("Profile updated successfully");
      closeModal();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Add new education entry
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "", grade: "" }]
    }));
  };

  // Add new experience entry
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { title: "", company: "", duration: "", description: "" }]
    }));
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={user?.profile?.profilePicture || "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740"}
                alt={user?.name || "User"}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 style={{ textTransform: "capitalize" }} className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user?.name || "User"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.profile?.bio || ""}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.address?.city}, {user?.address?.country}
                </p>
              </div>
              {user.role === "teacher" && user.education && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {user.education[0]?.degree} from {user.education[0]?.institution}
                </div>
              )}
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <a
                href={`mailto:${user?.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                    fill="currentColor"
                  />
                  <path
                    d="M22 6L12 13L2 6V6C2 5.4 2.4 5 3 5H21C21.6 5 22 5.4 22 6V6Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              {user?.phoneNumber && (
                <a
                  href={`tel:${user?.phoneNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.487 17.14L16.422 13.917C15.675 13.351 14.475 13.373 13.668 13.98L11.289 15.831C8.682 13.845 10.054 12.023 10.307 11.759C10.844 11.208 10.929 10.471 10.523 9.92L7.633 6.252C7.193 5.654 6.421 5.49 5.803 5.857L3.498 7.15C2.95 7.471 2.648 8.081 2.689 8.695C2.795 10.306 3.53 14.111 7.584 18.165C11.638 22.219 15.444 22.953 17.054 23.06C17.669 23.101 18.279 22.8 18.6 22.252L19.893 19.947C20.262 19.327 20.096 18.553 19.497 18.113L20.487 17.14Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400 lg:mb-5">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[500px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2">
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Mobile Number</Label>
                    <Input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      name="profile.dateOfBirth"
                      value={formData.profile.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Gender</Label>
                    <Select
                      name="profile.gender"
                      defaultValue={formData.profile.gender}
                      options={[
                        { value: "male", label: "Male" }, 
                        { value: "female", label: "Female" }, 
                        { value: "other", label: "Other" }
                      ]}
                      onChange={(value: string) =>
                        handleChange({
                          target: { name: "profile.gender", value },
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-2">
                    <Label>Bio</Label>
                    <Input
                      type="text"
                      name="profile.bio"
                      value={formData.profile.bio}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2">
                    <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                      Address
                    </h6>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Street</Label>
                        <Input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          type="text"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label>Postal Code</Label>
                        <Input
                          type="text"
                          name="address.zipCode"
                          value={formData.address.zipCode}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Country</Label>
                        <Input
                          type="text"
                          name="address.country"
                          value={formData.address.country}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  {user.role === "teacher" && (
                    <>
                      <div className="col-span-2 mt-6">
                        <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90">
                          Professional Information
                        </h5>
                        
                        <div className="mb-6">
                          <Label>Skills (comma separated)</Label>
                          <Input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="mb-6">
                          <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                            Education
                          </h6>
                          {formData.education.map((edu, index) => (
                            <div key={index} className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
                              <div>
                                <Label>Degree</Label>
                                <Input
                                  type="text"
                                  name={`education.${index}.degree`}
                                  value={edu.degree}
                                  onChange={handleChange}
                                />
                              </div>
                              <div>
                                <Label>Institution</Label>
                                <Input
                                  type="text"
                                  name={`education.${index}.institution`}
                                  value={edu.institution}
                                  onChange={handleChange}
                                />
                              </div>
                              <div>
                                <Label>Year</Label>
                                <Input
                                  type="text"
                                  name={`education.${index}.year`}
                                  value={edu.year}
                                  onChange={handleChange}
                                />
                              </div>
                              <div>
                                <Label>Grade</Label>
                                <Input
                                  type="text"
                                  name={`education.${index}.grade`}
                                  value={edu.grade}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addEducation}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            + Add Education
                          </button>
                        </div>

                        <div className="mb-6">
                          <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                            Experience
                          </h6>
                          {formData.experience.map((exp, index) => (
                            <div key={index} className="grid grid-cols-1 gap-4 mb-4">
                              <div>
                                <Label>Title</Label>
                                <Input
                                  type="text"
                                  name={`experience.${index}.title`}
                                  value={exp.title}
                                  onChange={handleChange}
                                />
                              </div>
                              <div>
                                <Label>Company</Label>
                                <Input
                                  type="text"
                                  name={`experience.${index}.company`}
                                  value={exp.company}
                                  onChange={handleChange}
                                />
                              </div>
                              <div>
                                <Label>Duration</Label>
                                <Input
                                  type="text"
                                  name={`experience.${index}.duration`}
                                  value={exp.duration}
                                  onChange={handleChange}
                                />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Input
                                  type="text"
                                  name={`experience.${index}.description`}
                                  value={exp.description}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addExperience}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            + Add Experience
                          </button>
                        </div>

                        <div>
                          <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                            Social Links
                          </h6>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <Label>LinkedIn</Label>
                              <Input
                                type="text"
                                name="socialLinks.linkedin"
                                value={formData.socialLinks.linkedin}
                                onChange={handleChange}
                              />
                            </div>
                            <div>
                              <Label>Twitter</Label>
                              <Input
                                type="text"
                                name="socialLinks.twitter"
                                value={formData.socialLinks.twitter}
                                onChange={handleChange}
                              />
                            </div>
                            <div>
                              <Label>Facebook</Label>
                              <Input
                                type="text"
                                name="socialLinks.facebook"
                                value={formData.socialLinks.facebook}
                                onChange={handleChange}
                              />
                            </div>
                            <div>
                              <Label>Instagram</Label>
                              <Input
                                type="text"
                                name="socialLinks.instagram"
                                value={formData.socialLinks.instagram}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={closeModal}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Saving.." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}