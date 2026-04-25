// components/ActivityLogs.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import api from "../axiosInstance";
import {
    PhoneCall,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    PhoneOff,
    Clock,
    Search,
    RefreshCw,
    Ban,
    XCircle,
    AlertTriangle,
    NotebookPenIcon,
    Save,
    X,
    Calendar,
    Filter,
    ChevronDown,
    ChevronUp,
    Download,
    User,
    Phone,
    Type,
    MessageCircle,
    FileText,
    CheckSquare,
    Globe,
    Upload,
    UserPlus,
    PhoneOutgoingIcon,
    PhoneMissedIcon,
    MessageSquare,
    CheckCircle,
    Briefcase,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/UserContext";

const CALL_STATUS_MAP = {
    "Answer": "Answered",
    "Missed": "Missed",
    3: "Both Answered",
    4: "Student Ans. - Counselor Unans.",
    5: "Student. Ans",
    6: "Student. Unans - Counselor Ans.",
    7: "Counselor Unanswered",
    8: "Student. Unans.",
    9: "Both Unanswered",
    10: "Counselor Ans.",
    11: "Rejected Call",
    12: "Skipped",
    13: "Counselor Failed",
    14: "Student. Failed - Counselor Ans.",
    15: "Student. Failed",
    16: "Student. Ans - Counselor Failed",
    17: "Counselor Busy",
    18: "Student. Ans - Counselor Not Found",
    19: "Student. Unans - Counselor Busy",
    21: "Student. Hangup",
};

const CALL_STATUS_ICON = {
    "Answer": { icon: PhoneCall, color: "text-green-600" },
    "Missed": { icon: PhoneMissed, color: "text-red-600" },
    3: { icon: PhoneCall, color: "text-green-600" },
    4: { icon: PhoneIncoming, color: "text-yellow-500" },
    5: { icon: PhoneIncoming, color: "text-green-600" },
    6: { icon: PhoneOutgoing, color: "text-yellow-500" },
    7: { icon: PhoneMissed, color: "text-red-500" },
    8: { icon: PhoneMissed, color: "text-red-500" },
    9: { icon: PhoneOff, color: "text-red-600" },
    10: { icon: PhoneOutgoing, color: "text-green-600" },
    11: { icon: Ban, color: "text-red-600" },
    12: { icon: PhoneCall, color: "text-gray-500" },
    13: { icon: XCircle, color: "text-red-600" },
    14: { icon: AlertTriangle, color: "text-orange-500" },
    15: { icon: XCircle, color: "text-red-600" },
    16: { icon: AlertTriangle, color: "text-orange-500" },
    17: { icon: PhoneOff, color: "text-yellow-600" },
    18: { icon: PhoneOff, color: "text-orange-600" },
    19: { icon: PhoneMissed, color: "text-yellow-600" },
    21: { icon: PhoneOff, color: "text-gray-600" },
};

const noteCallTypes = [
    { value: "inquiry", label: "Inquiry" },
    { value: "follow_up", label: "Follow-up" },
    { value: "consultation", label: "Consultation" },
    { value: "sales", label: "Sales" },
    { value: "support", label: "Support" },
    { value: "complaint", label: "Complaint" }
];

const callPurposes = [
    { value: "information", label: "Information Gathering" },
    { value: "clarification", label: "Clarification" },
    { value: "quotation", label: "Quotation" },
    { value: "demo", label: "Demo/Meeting" },
    { value: "closure", label: "Closure" },
    { value: "feedback", label: "Feedback" }
];

const ActivityLogs = ({ leadId, leadName, isOpen, onClose, showHeader = true, className = "", handleEdit }: any) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const { user } = useAuth();
    const [filters, setFilters] = useState({
        callType: "",
        status: "",
        dateRange: "",
        duration: "",
        search: ""
    });
    const [dateRangeStart, setDateRangeStart] = useState("");
    const [dateRangeEnd, setDateRangeEnd] = useState("");
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showNotesForm, setShowNotesForm] = useState(false);
    const [notesForm, setNotesForm] = useState({
        notes: "",
        callType: "",
        callPurpose: "",
        followUpDate: "",
        rating: "",
        tags: []
    });
    const [submittingNotes, setSubmittingNotes] = useState(false);
    const [stats, setStats] = useState({
        totalCalls: 0,
        answered: 0,
        missed: 0,
        abandoned: 0,
        averageDuration: 0
    });
    const observerRef = useRef();
    const lastActivityRef = useRef();

    const fetchActivities = useCallback(async (reset = false) => {
        if (loading) return;

        try {
            setLoading(true);
            const currentPage = reset ? 1 : page;

            const params = {
                page: currentPage,
                limit: 40,
                phone: leadId,
                ...filters
            };

            Object.keys(params).forEach(key => {
                if (!params[key] && params[key] !== 0) delete params[key];
            });

            const response = await api.get("/leads/activity", { params });
            const newActivities = response.data?.data || [];
            const total = response.data?.pagination?.total || 0;

            setTotalCount(total);

            if (reset) {
                setActivities(newActivities);
            } else {
                setActivities(prev => [...prev, ...newActivities]);
            }

            // Fix: Check if we have more data based on total count
            const loadedCount = reset ? newActivities.length : activities.length + newActivities.length;
            setHasMore(loadedCount < total);

            if (!reset) setPage(prev => prev + 1);

            if (reset) {
                updateStats(newActivities);
            }
        } catch (error) {
            toast.error("Failed to fetch activities");
        } finally {
            setLoading(false);
        }
    }, [page, filters, leadId, loading, activities.length]);

    const updateStats = (activities) => {
        const total = activities.length;
        const answered = activities.filter(a => a.status === "2" || a.status === "3").length;
        const missed = activities.filter(a => a.status === "6").length;
        const abandoned = activities.filter(a => a.extraDetails?.hungupby === 1).length;
        const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
        const averageDuration = total > 0 ? Math.round(totalDuration / total) : 0;

        setStats({
            totalCalls: total,
            answered,
            missed,
            abandoned,
            averageDuration
        });
    };

    const handleAddNotesClick = (activity) => {
        setSelectedActivity(activity);
        setShowNotesForm(true);
        setNotesForm({
            notes: activity?.extraDetails?.notes || "",
            callType: activity?.extraDetails?.callType || "",
            callPurpose: activity?.extraDetails?.callPurpose || "",
            followUpDate: activity?.extraDetails?.followUpDate || "",
            rating: "",
            tags: activity.tags || []
        });
    };

    const handleNotesFormChange = (e) => {
        const { name, value } = e.target;
        setNotesForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitNotes = async () => {
        if (!selectedActivity) return;

        try {
            setSubmittingNotes(true);

            const notesData = {
                activityId: selectedActivity._id,
                leadId: leadId,
                leadName: leadName,
                ...notesForm,
                submittedAt: new Date().toISOString()
            };

            await api.post("/leads/activity/update", notesData);
            toast.success("Notes saved successfully!");

            setShowNotesForm(false);
            setNotesForm({
                notes: "",
                callType: "",
                callPurpose: "",
                followUpDate: "",
                rating: "",
                tags: []
            });
            setSelectedActivity(null);
            fetchActivities(true);
        } catch (error) {
            toast.error("Failed to save notes");
            console.error("Error saving notes:", error);
        } finally {
            setSubmittingNotes(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            callType: "",
            status: "",
            dateRange: "",
            duration: "",
            search: ""
        });
        setDateRangeStart("");
        setDateRangeEnd("");
        setPage(1);
        fetchActivities(true);
    };

    const handleDateChange = (type, value) => {
        if (type === "start") {
            setDateRangeStart(value);
            if (value && dateRangeEnd) {
                setFilters(prev => ({ ...prev, dateRange: `${value}_${dateRangeEnd}` }));
            }
        } else {
            setDateRangeEnd(value);
            if (dateRangeStart && value) {
                setFilters(prev => ({ ...prev, dateRange: `${dateRangeStart}_${value}` }));
            }
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            "1": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            "2": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            "3": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            "4": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            "5": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            "6": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            "7": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        };
        return colors[status] || colors["1"];
    };

    // Infinite scroll observer
    useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    fetchActivities();
                }
            },
            { threshold: 0.5 }
        );

        if (lastActivityRef.current) {
            observer.observe(lastActivityRef.current);
        }

        return () => {
            if (lastActivityRef.current) {
                observer.unobserve(lastActivityRef.current);
            }
        };
    }, [loading, hasMore, fetchActivities]);

    // Initial fetch
    useEffect(() => {
        if (isOpen) {
            setPage(1);
            fetchActivities(true);
        }
    }, [isOpen, filters]);

    // Group activities by date
    const groupedActivities = activities.reduce((acc, activity) => {
        const date = moment(activity.createdAt).format("DD MMM YY");
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedActivities).sort((a, b) =>
        moment(b, "DD MMM YY").diff(moment(a, "DD MMM YY"))
    );

    // If this is used as an inline component
    return (
        <ActivityLogsContent
            handleEdit={handleEdit}
            leadId={leadId}
            leadName={leadName}
            onClose={onClose}
            showHeader={showHeader}
            className={className}
            activities={activities}
            loading={loading}
            hasMore={hasMore}
            totalCount={totalCount}
            filters={filters}
            setFilters={setFilters}
            dateRangeStart={dateRangeStart}
            dateRangeEnd={dateRangeEnd}
            handleDateChange={handleDateChange}
            fetchActivities={fetchActivities}
            resetFilters={resetFilters}
            selectedActivity={selectedActivity}
            showNotesForm={showNotesForm}
            notesForm={notesForm}
            handleNotesFormChange={handleNotesFormChange}
            handleSubmitNotes={handleSubmitNotes}
            submittingNotes={submittingNotes}
            setShowNotesForm={setShowNotesForm}
            groupedActivities={groupedActivities}
            sortedDates={sortedDates}
            handleAddNotesClick={handleAddNotesClick}
            getStatusColor={getStatusColor}
            lastActivityRef={lastActivityRef}
            user={user}
        />
    );
};

// Separate content component with drawer for notes
const ActivityLogsContent = ({
    leadId,
    leadName,
    onClose,
    showHeader,
    className,
    activities,
    loading,
    hasMore,
    totalCount,
    fetchActivities,
    selectedActivity,
    showNotesForm,
    notesForm,
    handleNotesFormChange,
    handleSubmitNotes,
    submittingNotes,
    setShowNotesForm,
    groupedActivities,
    sortedDates,
    handleAddNotesClick,
    lastActivityRef,
    handleEdit
}: any) => {
    return (
        <div className={`relative w-full rounded-3xl dark:bg-gray-900 max-h-[95vh] overflow-hidden no-scrollbar ${className}`}>
            {showHeader && (
                <div className="sticky z-99 -top-0 left-0 duration-300 ease-in-out right-0 bg-white shadow p-3 px-6 border-gray-400 dark:border-gray-700 dark:bg-gray-800 flex items-center justify-between">
                    <div className="flex justify-center items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Student :</h3>
                        {leadName && <p className="text-lg font-medium uppercase text-gray-600 dark:text-gray-400 mt-1">{leadName}</p>}
                    </div>
                    <button
                        onClick={() => { onClose?.(); setShowNotesForm(false); }}
                        className="z-9 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
            )}
            <div className="flex max-h-full overflow-y-auto relative">
                {/* Main Content */}
                <div className="w-full dark:border-gray-700 flex flex-col h-full transition-all duration-300">
                    <div className="overflow-y-auto flex-1 p-3">
                        <div className="relative">
                            <div className="absolute left-4 top-5 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-gray-100 dark:from-blue-600 dark:to-gray-600"></div>
                            <div className="space-y-1">
                                {sortedDates.map((date) => (
                                    <div key={date}>
                                        <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-12">{date}</p>
                                        {groupedActivities[date].map((activity, idx) => {
                                            // Get icon based on activity type and call status
                                            const getActivityIcon = () => {
                                                // For call activities
                                                if (activity?.type === "call") {
                                                    const callStatus = activity?.callDetails?.status;
                                                    if (callStatus === "connected") return PhoneOutgoingIcon;
                                                    if (callStatus === "missed") return PhoneMissedIcon;
                                                    return PhoneCall;
                                                }

                                                // For other activity types
                                                const typeIcons = {
                                                    meeting: Calendar,
                                                    message: MessageSquare,
                                                    note: NotebookPenIcon,
                                                    status_change: RefreshCw,
                                                    task: CheckCircle,
                                                    website_visit: Globe,
                                                    document_upload: Upload,
                                                    assignment: Briefcase
                                                };
                                                return typeIcons[activity?.type] || Activity;
                                            };

                                            const ActivityIcon = getActivityIcon();

                                            // Get icon color based on activity type and status
                                            const getIconColor = () => {
                                                if (activity?.type === "call") {
                                                    const callStatus = activity?.callDetails?.status;
                                                    if (callStatus === "connected") return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
                                                    if (callStatus === "missed") return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
                                                    return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
                                                }

                                                const typeColors = {
                                                    meeting: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                                                    message: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
                                                    note: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                                                    status_change: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
                                                    task: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
                                                    website_visit: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                                                    document_upload: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
                                                    assignment: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                                };
                                                return typeColors[activity?.type] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
                                            };

                                            const iconColorClass = getIconColor();
                                            const isLast = idx === groupedActivities[date].length - 1 && date === sortedDates[sortedDates.length - 1];

                                            // Get activity title
                                            const getActivityTitle = () => {
                                                if (activity?.title) return activity.title;

                                                switch (activity?.type) {
                                                    case "call":
                                                        const callStatus = activity?.callDetails?.status;
                                                        return callStatus === "connected" ? "Call Connected" :
                                                            callStatus === "missed" ? "Missed Call" : "Call Attempt";
                                                    case "meeting":
                                                        return `Meeting ${activity?.meetingDetails?.status || "Scheduled"}`;
                                                    case "message":
                                                        return `${activity?.messageDetails?.direction === "sent" ? "Sent" : "Received"} ${activity?.messageDetails?.channel || "Message"}`;
                                                    case "note":
                                                        return "Note Added";
                                                    case "status_change":
                                                        return "Status Changed";
                                                    case "task":
                                                        return "Task Update";
                                                    case "website_visit":
                                                        return "Website Visit";
                                                    case "document_upload":
                                                        return "Document Uploaded";
                                                    case "assignment":
                                                        return "Assignment";
                                                    default:
                                                        return "Activity";
                                                }
                                            };

                                            // Get status badge color
                                            const getActivityStatusColor = () => {
                                                if (activity?.type === "call") {
                                                    const callStatus = activity?.callDetails?.status;
                                                    if (callStatus === "connected") return "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";
                                                    if (callStatus === "missed") return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
                                                    return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20";
                                                }

                                                if (activity?.type === "meeting") {
                                                    const meetingStatus = activity?.meetingDetails?.status;
                                                    if (meetingStatus === "completed") return "bg-green-50 text-green-700 border-green-200";
                                                    if (meetingStatus === "cancelled") return "bg-red-50 text-red-700 border-red-200";
                                                    return "bg-blue-50 text-blue-700 border-blue-200";
                                                }

                                                return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20";
                                            };

                                            // Get direction badge (Incoming/Outgoing for calls)
                                            const getDirection = () => {
                                                if (activity?.type === "call") {
                                                    const callType = activity?.callDetails?.callType || activity?.extraDetails?.cType;
                                                    if (callType === "IBD") return "Incoming";
                                                    if (callType === "CTC") return "Outgoing";
                                                    return activity?.extraDetails?.HangupBySourceDetected === 1 ? "Outgoing" : "Incoming";
                                                }
                                                return null;
                                            };

                                            const direction = getDirection();

                                            return (
                                                <motion.div
                                                    key={activity?._id}
                                                    ref={isLast ? lastActivityRef : null}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="relative pl-10 mb-4"
                                                >
                                                    {/* Icon circle */}
                                                    <div className="absolute -left-1 top-0 p-0.5 flex items-center justify-center">
                                                        <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 shadow rounded-full border-4 border-gray-400 dark:border-gray-800"></div>
                                                        <div className={`relative z-10 p-2 rounded-full ${iconColorClass} flex items-center justify-center`}>
                                                            <ActivityIcon className="w-5 h-5" />
                                                        </div>
                                                    </div>

                                                    {/* Activity card */}
                                                    <div className="bg-blue-50 border-gray-300 dark:bg-gray-800/50 rounded-xl cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
                                                        <div className="p-3.5 space-y-2">
                                                            {/* Header */}
                                                            <div className="flex items-start justify-between flex-wrap gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-semibold text-gray-800 dark:text-white text-sm">
                                                                            {getActivityTitle()}
                                                                        </span>

                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getActivityStatusColor()}`}>
                                                                            {activity?.type === "call"
                                                                                ? (activity?.callDetails?.status === "Answer" ? "Connected" :
                                                                                    activity?.callDetails?.status === "Missed" ? "Missed" : "Attempted")
                                                                                : activity?.type === "meeting"
                                                                                    ? (activity?.meetingDetails?.status || "Scheduled")
                                                                                    : activity?.type === "message"
                                                                                        ? (activity?.messageDetails?.direction || "Message")
                                                                                        : "Activity"}
                                                                        </span>

                                                                        {direction && (
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${direction === "Incoming"
                                                                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400"
                                                                                : "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400"
                                                                                }`}>
                                                                                {direction}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                        {moment(activity?.createdAt).format("MMM DD, YYYY hh:mm A")}
                                                                    </span>
                                                                    {activity?.type === "call" && (
                                                                        <button
                                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAddNotesClick(activity);
                                                                            }}
                                                                        >
                                                                            <NotebookPenIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                                                        </button>)}
                                                                    {activity?.type === "meeting" && (
                                                                        <button
                                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEdit(activity);
                                                                            }}
                                                                        >
                                                                            <NotebookPenIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                                                        </button>)}
                                                                </div>
                                                            </div>

                                                            {/* Description if exists */}
                                                            {activity?.description && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                    {activity.description}
                                                                </p>
                                                            )}

                                                            {/* Call Details */}
                                                            {activity?.type === "call" && (
                                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                                                    {activity?.callDetails?.duration !== undefined && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white">
                                                                                {Math.floor(activity.callDetails.duration / 60)}m {activity.callDetails.duration % 60}s
                                                                            </span>
                                                                        </>
                                                                    )}

                                                                    {activity?.callDetails?.callType && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400 ml-0 md:ml-4">Call Type:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white capitalize">
                                                                                {activity.callDetails.callType}
                                                                            </span>
                                                                        </>
                                                                    )}

                                                                    {activity?.callDetails?.callPurpose && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400 ml-0 md:ml-4">Purpose:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white">
                                                                                {activity.callDetails.callPurpose}
                                                                            </span>
                                                                        </>
                                                                    )}

                                                                    {activity?.extraDetails?.HangupBySourceDetected !== undefined && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400 ml-0 md:ml-4">Hangup by:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white">
                                                                                {activity.extraDetails.HangupBySourceDetected == 1 ? "Counselor" : "Student"}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Meeting Details */}
                                                            {activity?.type === "meeting" && (
                                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                                                    {activity?.meetingDetails?.link && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400">Link:</span>
                                                                            <a
                                                                                href={activity.meetingDetails.link}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                                            >
                                                                                Join Meeting
                                                                            </a>
                                                                        </>
                                                                    )}
                                                                    {activity?.meetingDetails?.scheduledAt && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400 ml-0 md:ml-4">Scheduled:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white">
                                                                                {moment(activity.meetingDetails.scheduledAt).format("MMM DD, hh:mm A")}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Message Details */}
                                                            {activity?.type === "message" && (
                                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                                                    {activity?.messageDetails?.channel && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400">Channel:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white capitalize">
                                                                                {activity.messageDetails.channel}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    {activity?.messageDetails?.content && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400 ml-0 md:ml-4">Content:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white">
                                                                                {activity.messageDetails.content}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Status Change Details */}
                                                            {activity?.type === "status_change" && (
                                                                null
                                                            )}

                                                            {/* Website Visit Details */}
                                                            {activity?.type === "website_visit" && (
                                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                                                    {activity?.websiteDetails?.url && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400">URL:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white truncate max-w-md">
                                                                                {activity.websiteDetails.url}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    {activity?.websiteDetails?.timeSpent !== undefined && (
                                                                        <>
                                                                            <span className="text-gray-500 dark:text-gray-400 ml-0 md:ml-4">Time spent:</span>
                                                                            <span className="font-medium text-gray-800 dark:text-white">
                                                                                {Math.floor(activity.websiteDetails.timeSpent / 60)}m {activity.websiteDetails.timeSpent % 60}s
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Notes from extraDetails */}
                                                            {activity?.extraDetails?.notes && (
                                                                <div className="flex gap-2 text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                                    <span className="text-gray-500 dark:text-gray-400">Notes:</span>
                                                                    <span className="font-medium text-gray-800 dark:text-white flex-1">
                                                                        {activity.extraDetails.notes}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Audio Recording */}
                                                            {activity?.type === "call" && (activity?.callDetails?.status === "Answer") && (() => {
                                                                let recordingData = null;
                                                                try {
                                                                    const recording = activity?.callDetails?.recordingUrl || activity?.recordingData;
                                                                    if (typeof recording === "string") {
                                                                        if (recording.startsWith("http")) {
                                                                            recordingData = recording;
                                                                        } else if (recording && recording !== "") {
                                                                            recordingData = JSON.parse(recording);
                                                                        }
                                                                    } else {
                                                                        recordingData = recording;
                                                                    }
                                                                } catch (err) {
                                                                    console.error("Invalid recordingData JSON", err);
                                                                    recordingData = null;
                                                                }

                                                                return recordingData && (
                                                                    <div className="mt-3 pt-2">
                                                                        <audio
                                                                            controls
                                                                            className="w-full h-8"
                                                                            preload="none"
                                                                            controlsList="nodownload noplaybackrate"
                                                                        >
                                                                            <source
                                                                                src={
                                                                                    typeof recordingData === "string"
                                                                                        ? recordingData
                                                                                        : `https://w.digiskyweb.com/v2/recording/direct/28882897${recordingData[0]?.file}`
                                                                                }
                                                                                type="audio/mpeg"
                                                                            />
                                                                            Your browser does not support the audio element.
                                                                        </audio>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ))}

                                {/* Load More Button - Only show if hasMore is true */}
                                {hasMore && activities.length > 0 && (
                                    <div className="flex justify-center py-6">
                                        {loading ? (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Loading more...</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => fetchActivities()}
                                                className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                                            >
                                                Load More ({activities.length} / {totalCount})
                                            </button>
                                        )}
                                    </div>
                                )}

                                {loading && activities.length === 0 && (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {!loading && activities?.length === 0 && (
                                    <div className="text-center py-12">
                                        <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activity found</h3>
                                        <p className="text-gray-500 dark:text-gray-400">No calls or activities match your current filters.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Drawer - Slides from right */}
                <AnimatePresence>
                    {showNotesForm && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowNotesForm(false)}
                                className="fixed inset-0 bg-black/10 z-100"
                            />

                            {/* Drawer */}
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed right-0 top-0 h-full w-full rounded-3xl max-w-xl bg-gray-50 dark:bg-gray-800 shadow-2xl z-100 overflow-hidden"
                            >
                                <div className="h-full flex flex-col">
                                    <div className="flex items-center justify-between p-3 px-5 border-b border-gray-200 dark:border-gray-700">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedActivity?.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {selectedActivity && moment(selectedActivity.createdAt).format("MMMM DD, YYYY hh:mm A")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowNotesForm(false)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {/* Drawer Content */}
                                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                        {selectedActivity && (
                                            <>
                                                {/* Call Summary Card */}
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4">
                                                    <h4 className="font-semibold text-gray-800 dark:text-white text-sm mb-3 flex items-center gap-2">
                                                        <PhoneCall className="w-4 h-4" />
                                                        Call Summary
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <p className="font-semibold text-gray-900 dark:text-white mt-1">
                                                            {selectedActivity?.title || "Call Activity"}
                                                        </p>
                                                        <div>
                                                            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                                            <p className="font-semibold text-gray-900 dark:text-white mt-1">
                                                                {selectedActivity?.callDetails?.duration || 0}s
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                            <p className="font-semibold text-gray-900 dark:text-white mt-1">
                                                                {CALL_STATUS_MAP[selectedActivity?.callDetails?.status] || "Unknown"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                                            <p className="font-semibold text-gray-900 dark:text-white mt-1">
                                                                {selectedActivity.extraDetails?.cType === "IBD" ? "Incoming" : "Outgoing"}
                                                            </p>
                                                        </div>
                                                        {selectedActivity.extraDetails?.HangupBySourceDetected !== undefined && (
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Hangup By:</span>
                                                                <p className="font-semibold text-gray-900 dark:text-white mt-1">
                                                                    {selectedActivity.extraDetails.HangupBySourceDetected == 1 ? "Counselor" : "Student"}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Form Fields */}
                                                <div className="space-y-4 grid grid-cols-2 gap-2">

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                            Call Type
                                                        </label>
                                                        <select
                                                            name="callType"
                                                            value={notesForm.callType}
                                                            onChange={handleNotesFormChange}
                                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        >
                                                            <option value="">Select call type</option>
                                                            {noteCallTypes.map(type => (
                                                                <option key={type.value} value={type.value}>{type.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                            Call Purpose
                                                        </label>
                                                        <select
                                                            name="callPurpose"
                                                            value={notesForm.callPurpose}
                                                            onChange={handleNotesFormChange}
                                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        >
                                                            <option value="">Select purpose</option>
                                                            {callPurposes.map(purpose => (
                                                                <option key={purpose.value} value={purpose.value}>{purpose.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                            Notes
                                                        </label>
                                                        <textarea
                                                            name="notes"
                                                            value={notesForm.notes}
                                                            onChange={handleNotesFormChange}
                                                            rows="5"
                                                            placeholder="Add detailed notes about the call..."
                                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Drawer Footer */}
                                    <div className="p-2 px-5 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleSubmitNotes}
                                                disabled={submittingNotes}
                                                className=" flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                                            >
                                                {submittingNotes ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Save Notes
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setShowNotesForm(false)}
                                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActivityLogs;