import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    User,
    CheckSquare,
    FileText,
    Users,
    Phone,
    Mail,
    MapPin,
    Calendar,
    MessageSquare,
    Video,
    Clock,
    Plus,
    Filter,
    ChevronLeft,
    Edit2,
    AlertCircle,
    Rotate3DIcon,
    PhoneCall,
    PhoneIncoming,
    PhoneOutgoing,
    Mic,
    MicOff,
    Play,
    Pause,
    Download,
    Tag,
    User2,
    Pen,
    PenIcon,
    MessageCircleCode
} from "lucide-react";
import {
    IconButton,
    Chip,
    Avatar,
    Badge,
    Tooltip,
    Fab,
    Box,
    Typography,
    Paper,
    Divider,
    CircularProgress,
    Button,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress
} from "@mui/material";
import api from "../axiosInstance";
import { toast } from "react-toastify";
import moment from "moment";
import ActivityLogs from "./ActivityLogs";
import { useAuth } from "../context/UserContext";
import WhatsAppChat from "./Whatsapp/WsChating";


const tabs = [
    { id: "activity", label: "Activity History", icon: Activity },
    { id: "tasks", label: "Chats", icon: MessageCircleCode },
    { id: "documents", label: "Documents", icon: FileText }
];


const LeadDetailPage = ({ selectedLead, closeModal, isOpen, clickToCall, setEditModalOpen }: any) => {
    const { id } = useParams() || { id: selectedLead?._id };
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("activity");
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
    // const [activityFilter, setActivityFilter] = useState("all");
    const [playingAudio, setPlayingAudio] = useState(null);
    const [callDialogOpen, setCallDialogOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);
    const { user } = useAuth();
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [meetingDrawerOpen, setMeetingDrawerOpen] = useState(false);


    useEffect(() => {
        fetchLeadData();
    }, [id]);

    const handleEdit = (activity) => {
        setSelectedActivity(activity);

        if (activity.type == "meeting") {
            setMeetingDrawerOpen(true);
            console.log("Editing meeting activity:", activity);
        }
    }

    const fetchLeadData = async () => {
        setLoading(true);
        try {
            const [leadRes] = await Promise.all([
                api.get(`/leads/${id || selectedLead?._id}`).catch(() => toast.error("Failed to fetch lead details")),
            ]);
            setLead(leadRes.data?.data);
        } catch (error) {
            console.error("Error fetching data:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tabId, index) => {
        const tabElement = document.getElementById(`tab-${index}`);
        if (tabElement) {
            setTabIndicator({
                left: tabElement.offsetLeft,
                width: tabElement.offsetWidth
            });
        }
        setActiveTab(tabId);
    };


    const handlePlayAudio = (activityId, audioUrl) => {
        if (playingAudio === activityId) {
            // Stop playing
            setPlayingAudio(null);
        } else {
            setPlayingAudio(activityId);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <CircularProgress size={60} />
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <AlertCircle className="h-32 w-32 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lead Not Found</h2>
                <button
                    onClick={() => navigate("/leads")}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Back to Leads
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky -top-5 z-30 px-6 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <IconButton onClick={() => closeModal()} className="hover:bg-gray-100">
                            <ChevronLeft className="h-5 w-5" />
                        </IconButton>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{lead.fullName}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Chip
                            label={lead.status}
                            color={lead.status === "interested" ? "success" : "default"}
                            icon={<Tag className="h-3 w-3" />}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[52px] pt-2 z-20">
                <div className="relative flex gap-1 px-6 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab, index) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <motion.button
                                key={tab.id}
                                id={`tab-${index}`}
                                onClick={() => handleTabChange(tab.id, index)}
                                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${isActive
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </motion.button>
                        );
                    })}
                    <motion.div
                        className="absolute bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                        animate={{
                            left: tabIndicator.left,
                            width: tabIndicator.width
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

            <div className="flex">
                {/* Left Sidebar */}
                <div className="min-w-80 w-82 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 sticky top-[100px] h-[calc(100vh-127px)] overflow-y-auto scrollbar-hide no-scrollbar">
                    <div className="space-y-1 relative">
                        {/* Contact Info */}
                        <div className="absolute -top-2 right-0">
                            <button onClick={() => setEditModalOpen(selectedLead)}>
                                <Tooltip title="Edit Lead Details">
                                    <IconButton className="hover:bg-gray-200 bg-gray-100 dark:hover:bg-gray-700">
                                        <Edit2 className="h-5 w-5 text-gray-700" />
                                    </IconButton>
                                </Tooltip>
                            </button>
                        </div>

                        <div className="mb-2">

                            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Basic Information</h3>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 text-sm p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <User2 className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300">{lead.fullName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300">{lead.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{lead.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300">{lead.city}, {lead.countryOfResidence}</span>
                                </div>
                            </div>
                        </div>

                        {/* Lead Details */}
                        <div className="pt-2">
                            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Lead Details</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Enquiry Type</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{lead.inquiryType}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Status</span>
                                    <span className="font-medium text-sm text-gray-900 dark:text-white uppercase border px-2 rounded bg-gray-100 dark:bg-gray-700">{lead.status}</span>
                                </div>
                                {/* <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Source</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{lead.source}</span>
                                </div> */}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Lead Date</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{moment(lead.createdAt).format("MMM D, YYYY h:mm A")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Lead Owner */}
                        {lead?.assignedCounselor && (
                            <div className="pt-3">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Lead Owner</h3>
                                <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
                                    <Avatar sx={{ bgcolor: "indigo.600", width: 32, height: 32 }}>
                                        {lead.assignedCounselor.name?.charAt(0)}
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.assignedCounselor.name}</p>
                                        <p className="text-xs text-gray-500">{lead.assignedCounselor.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="pt-1">
                            <div className="grid grid-cols-3 gap-1">
                                <Button
                                    onClick={() => clickToCall(selectedLead)}
                                    variant="outlined"
                                    sx={{ borderRadius: 2, textTransform: "none" }}
                                >
                                    Call
                                </Button>
                                <Button
                                    variant="outlined"
                                    sx={{ borderRadius: 2, textTransform: "none" }}
                                >
                                    Email
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setMeetingDrawerOpen(true)}
                                    sx={{ borderRadius: 2, textTransform: "none" }}
                                >
                                    Meeting
                                </Button>
                            </div>
                        </div>
                        <div className="pt-2">
                            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Lead Extra Details</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Course Preference</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{lead?.coursePreference}</span>
                                </div>

                                {lead?.extraDetails && Object.entries(lead?.extraDetails)?.map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm gap-3">
                                        <span className="text-gray-500  break-words max-w-[70%]">{key}</span>

                                        <span className="font-medium text-gray-900 dark:text-white text-right break-words max-w-28%]">
                                            {value || "-"}
                                        </span>
                                    </div>
                                ))}

                            </div>
                        </div>
                        {user.role === "admin" && (
                            <div className="pt-2">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Campaign Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Source</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{lead.source}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Website</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{lead.website}</span>
                                    </div>
                                    {lead?.adsDetails && Object.entries(lead?.adsDetails)?.map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm gap-3">
                                            <span className="text-gray-500  break-words max-w-[40%]">{key}</span>

                                            <span className="font-medium text-gray-900 dark:text-white text-right break-words max-w-50%]">
                                                {value || "-"}
                                            </span>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {/* Activity History Tab */}
                        {activeTab === "activity" && (
                            <motion.div
                                key="activity"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6 w-full overflow-y-auto p-4"
                            >
                                <ActivityLogs
                                    leadId={lead._id}
                                    leadName={lead.fullName}
                                    handleEdit={handleEdit}
                                    isOpen={true}
                                    showHeader={false}
                                    className="h-[75vh] max-h-[75vh]"
                                />
                            </motion.div>
                        )}
                        {activeTab === "tasks" && (
                            <motion.div
                                key="tasks"
                                style={{ height: "calc(100vh - 130px)" }}
                                className=""
                            >
                                <WhatsAppChat
                                    lead={lead}
                                    onClose={() => setActiveTab("activity")}
                                    onNewMessage={(message) => {
                                    }}
                                />
                            </motion.div>
                        )}
                        {activeTab === "documents" && (
                            <motion.div
                                key="documents"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center justify-center py-20 text-gray-500"
                            >
                                <FileText className="h-16 w-16 mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">Documents</h3>
                                <p className="text-sm">No documents available for this lead yet.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {meetingDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMeetingDrawerOpen(false)}
                            className="fixed inset-0 bg-black/20 z-[120]"
                        />

                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            className="fixed right-0 top-0 h-full w-full-lg rounded-3xl bg-white dark:bg-gray-900 z-[130] shadow-xl"
                        >
                            <MeetingForm
                                lead={lead}
                                editData={selectedActivity}
                                onClose={() => setMeetingDrawerOpen(false)}
                                refreshLead={fetchLeadData}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Dialog open={callDialogOpen} onClose={() => setCallDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Call Details</DialogTitle>
                <DialogContent>
                    {selectedCall && (
                        <div className="space-y-4 py-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {selectedCall.callDetails?.callType === "inbound" ? (
                                        <PhoneIncoming className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <PhoneOutgoing className="h-5 w-5 text-blue-500" />
                                    )}
                                    <span className="font-semibold">
                                        {selectedCall.callDetails?.callType === "inbound" ? "Inbound Call" : "Outbound Call"}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500">{selectedCall.duration}</span>
                            </div>

                            <Divider />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Caller ID</span>
                                    <span className="font-medium">{selectedCall.callDetails?.callerId}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Status</span>
                                    <Chip
                                        label={selectedCall.callDetails?.status}
                                        size="small"
                                        color={selectedCall.callDetails?.status === "connected" ? "success" : "error"}
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Purpose</span>
                                    <span className="font-medium">{selectedCall.callDetails?.callPurpose || "General consultation"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Time</span>
                                    <span>{moment(selectedCall.timestamp).format("MMM D, YYYY h:mm A")}</span>
                                </div>
                            </div>

                            {selectedCall.callDetails?.recordingUrl && (
                                <>
                                    <Divider />
                                    <div>
                                        <p className="text-sm font-medium mb-2">Call Recording</p>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <IconButton
                                                onClick={() => handlePlayAudio(selectedCall._id, selectedCall.callDetails.recordingUrl)}
                                                className="bg-indigo-100 dark:bg-indigo-900"
                                            >
                                                {playingAudio === selectedCall._id ? (
                                                    <Pause className="h-4 w-4" />
                                                ) : (
                                                    <Play className="h-4 w-4" />
                                                )}
                                            </IconButton>
                                            <div className="flex-1">
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={45}
                                                    sx={{ height: 4, borderRadius: 2 }}
                                                />
                                            </div>
                                            <IconButton size="small">
                                                <Download className="h-4 w-4" />
                                            </IconButton>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCallDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default LeadDetailPage;



function MeetingForm({ lead, onClose, refreshLead, editData }: any) {
    const [form, setForm] = useState({
        title: "",
        description: "",
        link: "",
        scheduledAt: "",
        status: "scheduled"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = "Title is required";
        if (!form.link.trim()) newErrors.link = "Meeting link is required";
        if (!form.scheduledAt) newErrors.scheduledAt = "Date and time are required";

        // Validate URL format
        if (form.link && !form.link.match(/^(https?:\/\/)/i)) {
            newErrors.link = "Please enter a valid URL starting with http:// or https://";
        }

        // Validate future date
        if (form.scheduledAt && new Date(form.scheduledAt) < new Date()) {
            newErrors.scheduledAt = "Meeting time cannot be in the past";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (editData) {
            setForm({
                title: editData.title || "",
                description: editData.description || "",
                notes: editData.extraDetails?.notes || "", // ✅ notes from backend
                link: editData.meetingDetails?.link || "",
                scheduledAt: editData.meetingDetails?.scheduledAt
                    ? formatDateTimeLocal(editData.meetingDetails.scheduledAt)
                    : "",
                status: editData.meetingDetails?.status || "scheduled"
            });
        }
    }, [editData]);

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                _id: editData?._id, // ✅ for update
                type: "meeting",
                title: form.title,
                description: form.description,
                meetingDetails: {
                    link: form.link,
                    scheduledAt: form.scheduledAt,
                    status: form.status
                },
                phone: lead?.phone10,
                extraDetails: {
                    notes: form.notes // ✅ NEW FIELD
                }
            };

            await api.post(`/leads/activity/create`, payload);

            toast.success("Meeting scheduled successfully!");
            refreshLead();
            onClose();
        } catch (err) {
            toast.error(err?.message || "Failed to create meeting");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDateTimeLocal = (date) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
    };

    return (
        <div className="w-full max-h-[100vh] overflow-y-auto rounded-3xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Schedule Meeting</h2>
                        <p className="text-sm text-gray-500">
                            {lead?.fullName || "Lead"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Form Body */}
            <div className="px-6 py-6 space-y-5">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., Initial Consultation, Follow-up Discussion"
                        className={`w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                </div>

                {/* Meeting Link */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="https://meet.google.com/..."
                            className={`w-full border ${errors.link ? 'border-red-500' : 'border-gray-300'} rounded-lg pl-10 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                            value={form.link}
                            onChange={(e) => setForm({ ...form, link: e.target.value })}
                        />
                    </div>
                    {errors.link && <p className="mt-1 text-xs text-red-500">{errors.link}</p>}
                    <p className="mt-1 text-xs text-gray-500">Zoom, Google Meet, Microsoft Teams, or any video conferencing link</p>
                </div>

                {/* Date & Time */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        className={`w-full border ${errors.scheduledAt ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                        value={form.scheduledAt}
                        onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                        min={formatDateTimeLocal(new Date())}
                    />
                    {errors.scheduledAt && <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>}
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="scheduled">📅 Scheduled</option>
                        <option value="completed">✅ Completed</option>
                        <option value="cancelled">❌ Cancelled</option>
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        rows="3"
                        placeholder="Add agenda, notes, or any additional information..."
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                </div>
                {form.status != "scheduled" && <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        rows="3"
                        placeholder="Add notes for this meeting..."
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                        value={form.notes}
                        onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                        }
                    />
                </div>}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-xl">
                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Scheduling...
                            </>
                        ) : (
                            editData ? "Update Meeting" : "Schedule Meeting"
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}