import { useState } from "react";
import { toast } from "react-toastify";
import api from "../../axiosInstance";

export const useExcelUpload = (onSuccess) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const openUploadModal = () => {
        setIsUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
    };

    const handleUploadComplete = async (leads) => {
        try {
            setUploading(true);

            // Make actual API call
            const res = await api.post("/leads/bulk", { leads });

            toast.success(
                `✅ Uploaded ${res.data.insertedCount} leads, skipped ${res.data.skippedCount}`
            );

            if (onSuccess) {
                onSuccess();
            }

        } catch (err) {
            toast.error("Upload failed: " + (err?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    return {
        isUploadModalOpen,
        openUploadModal,
        closeUploadModal,
        handleUploadComplete,
        uploading
    };
};