import { useState, useEffect, useRef, useCallback } from "react";
import moment from "moment";
import { Modal } from "../../components/ui/modal";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import {
    X,
    Filter,
    Calendar,
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    PhoneOff,
    Clock,
    User,
    ChevronDown,
    ChevronUp,
    Search,
    Download,
    RefreshCw,
    PhoneCall,
    PhoneForwarded,
    Ban,
    XCircle,
    AlertTriangle,
    NotebookPenIcon,
    Save,
    Type,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/UserContext";

const ActivityLogsModal = ({ leadId, leadName, isOpen, onClose }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
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
    const [expandedActivities, setExpandedActivities] = useState(new Set());
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

    const callTypes = [
        { value: "incoming", label: "Incoming Call", icon: PhoneIncoming, color: "text-green-600" },
        { value: "outgoing", label: "Outgoing Call", icon: PhoneOutgoing, color: "text-blue-600" },
        { value: "missed", label: "Missed Call", icon: PhoneMissed, color: "text-red-600" },
        { value: "abandoned", label: "Abandoned", icon: PhoneOff, color: "text-orange-600" }
    ];

    const statusOptions = [
        { value: "1", label: "Ringing" },
        { value: "2", label: "Answered" },
        { value: "3", label: "Completed" },
        { value: "4", label: "Busy" },
        { value: "5", label: "Failed" },
        { value: "6", label: "No Answer" },
        { value: "7", label: "Canceled" }
    ];

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
        12: { icon: PhoneForwarded, color: "text-gray-500" },
        13: { icon: XCircle, color: "text-red-600" },
        14: { icon: AlertTriangle, color: "text-orange-500" },
        15: { icon: XCircle, color: "text-red-600" },
        16: { icon: AlertTriangle, color: "text-orange-500" },
        17: { icon: PhoneOff, color: "text-yellow-600" },
        18: { icon: PhoneOff, color: "text-orange-600" },
        19: { icon: PhoneMissed, color: "text-yellow-600" },
        21: { icon: PhoneOff, color: "text-gray-600" },
    };

    const durationOptions = [
        { value: "0-30", label: "0-30 seconds" },
        { value: "30-60", label: "30-60 seconds" },
        { value: "60-300", label: "1-5 minutes" },
        { value: "300+", label: "5+ minutes" }
    ];

    // Note Form Options
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


    const fetchActivities = useCallback(async (reset = false) => {
        if (loading) return;

        try {
            setLoading(true);
            const currentPage = reset ? 1 : page;

            const params = {
                page: currentPage,
                limit: 20,
                phone: leadId,
                ...filters
            };

            Object.keys(params).forEach(key => {
                if (!params[key] && params[key] !== 0) delete params[key];
            });

            const response = await api.get("/leads/activity", { params });
            const newActivities = response.data?.data || [];

            if (reset) {
                setActivities(newActivities);
            } else {
                setActivities(prev => [...prev, ...newActivities]);
            }

            setHasMore(newActivities.length === 20);
            if (!reset) setPage(prev => prev + 1);

            if (reset) {
                updateStats(newActivities);
            }
        } catch (error) {
            toast.error("Failed to fetch activities");
        } finally {
            setLoading(false);
        }
    }, [page, filters, leadId, loading]);

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

        // Pre-fill form with activity data
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

            // Replace this with your actual API endpoint
            await api.post("/leads/activity/update", notesData);

            toast.success("Notes saved successfully!");

            // Reset form and close
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

            // Optionally refresh activities to show the new notes
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

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
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

    const toggleExpand = (id) => {
        setExpandedActivities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getStatusText = (status) => {
        const statusMap = {
            "1": "Ringing",
            "2": "Answered",
            "3": "Completed",
            "4": "Busy",
            "5": "Failed",
            "6": "No Answer",
            "7": "Canceled"
        };
        return statusMap[status] || "Unknown";
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
                if (entries[0].isIntersecting && hasMore) {
                    fetchActivities();
                }
            },
            { threshold: 1.0 }
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-[95vw] w-full">
            <div className="relative w-full h-full min-h-[95vh] rounded-3xl dark:bg-gray-900 max-h-[95vh] overflow-hidden no-scrollbar">
                <div className="sticky z-99 -top-0 left-0 duration-300 ease-in-out right-0 bg-white shadow p-3 px-6 border-gray-400 dark:border-gray-700 dark:bg-gray-800 flex items-center justify-between">
                    <div className="flex justify-center items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Student :</h3>
                        {leadName && <p className="text-lg font-medium uppercase text-gray-600 dark:text-gray-400 mt-1">{leadName}</p>}
                    </div>
                    <button
                        onClick={() => { onClose(); setShowNotesForm(false); }}
                        className="z-9 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
                <div className="flex h-full ">
                    <div className="w-[50%] border-r-2 border-gray-300 dark:border-gray-700 flex flex-col h-full">
                        <div className=" sticky z-99 p-3 top-0 left-0 right-0 px-6 flex items-center gap-2 justify-start">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <input
                                    type="date"
                                    value={dateRangeStart}
                                    onChange={(e) => handleDateChange("start", e.target.value)}
                                    className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">to</span>
                                <input
                                    type="date"
                                    value={dateRangeEnd}
                                    onChange={(e) => handleDateChange("end", e.target.value)}
                                    className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div className="ml-3">
                                <button
                                    onClick={() => fetchActivities(true)}
                                    className="w-full flex items-center justify-center gap-2 p-1.5 text-sm bg-white dark:bg-gray-700  dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                >
                                    <RefreshCw className="text-orange-600 w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(93vh-150px)] p-3">
                            {sortedDates.map((date) => (
                                <div key={date} className="p-3 border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{date}</p>
                                    <div className="space-y-2 ">
                                        {groupedActivities[date].map((activity, index) => {
                                            const CallIcon = CALL_STATUS_ICON[activity.status]?.icon || PhoneCall;
                                            const iconColor = CALL_STATUS_ICON[activity.status]?.color || "text-gray-600";
                                            const isLast = index === groupedActivities[date].length - 1;

                                            return (
                                                <div
                                                    key={activity._id}
                                                    className="relative flex items-center  pl-3"
                                                    onClick={() => toggleExpand(activity._id)}
                                                >
                                                    {/* Icon */}
                                                    <div className="relative z-10 flex items-center justify-center border-2 shadow-lg p-2 bg-white dark:bg-gray-800 rounded-full">
                                                        <CallIcon className={`w-5 h-5 ${iconColor}`} />
                                                    </div>
                                                    <div className="flex items-start gap-2 justify-start min-w-0 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                                        <div><p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                                            {moment(activity.ivrSTime).format("hh:mm A")} - {moment(activity.ivrETime).format("hh:mm A")}
                                                        </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                {!isNaN(activity.status)
                                                                    ? CALL_STATUS_MAP[Number(activity.status)] || "Unknown Status"
                                                                    : activity.status}
                                                            </p>
                                                        </div>
                                                        <div className="-mt-1.5">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                                                {activity.extraDetails?.cType == "IBD" ? "Incoming" : "Outgoing"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <button
                                                            className="p-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddNotesClick(activity);
                                                            }}
                                                        >
                                                            <NotebookPenIcon className="w-6 h-6 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300" />
                                                        </button>
                                                    </div>

                                                    {!isLast && (
                                                        <span className="absolute z-9 left-[30px] h-10 top-10 bottom-0  w-[3px] bg-gray-400 dark:bg-gray-600" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel - Activity Details & Notes Form */}
                    <div className="flex-1 flex flex-col">
                        {/* Quick Filters Section */}
                        {!showNotesForm && (user?.role != "counselor") && (
                            <>
                                <div className="p-3 px-6">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        {filters.callType && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                Call Type: {callTypes.find(t => t.value === filters.callType)?.label}
                                                <button onClick={() => setFilters(prev => ({ ...prev, callType: "" }))} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
                                            </span>
                                        )}
                                        {filters.status && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                                                <button onClick={() => setFilters(prev => ({ ...prev, status: "" }))} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
                                            </span>
                                        )}
                                        {filters.duration && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                Duration: {durationOptions.find(d => d.value === filters.duration)?.label}
                                                <button onClick={() => setFilters(prev => ({ ...prev, duration: "" }))} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
                                            </span>
                                        )}
                                        {Object.values(filters).some(f => f) && (
                                            <button
                                                onClick={resetFilters}
                                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>

                                    {/* Quick Filters */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, callType: prev.callType === "incoming" ? "" : "incoming" }))}
                                            className={`px-2 py-1 text-sm rounded ${filters.callType === "incoming" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                                        >
                                            Incoming
                                        </button>
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, callType: prev.callType === "outgoing" ? "" : "outgoing" }))}
                                            className={`px-2 py-1 text-sm rounded ${filters.callType === "outgoing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                                        >
                                            Outgoing
                                        </button>
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, callType: prev.callType === "missed" ? "" : "missed" }))}
                                            className={`px-2 py-1 text-sm rounded ${filters.callType === "missed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                                        >
                                            Missed
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Activity Feed OR Notes Form */}
                        <div className={`overflow-y-auto ${showNotesForm ? "max-h-[calc(93vh-50px)]" : "max-h-[calc(93vh-150px)]"} p-3`}>
                            {showNotesForm && selectedActivity ? (
                                <div className="space-y-3">
                                    {/* Header */}
                                    <div className="flex items-center justify-between pb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-700 dark:text-white">Call Notes</h3>
                                        </div>
                                        <button
                                            onClick={() => setShowNotesForm(false)}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Call Summary */}
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Call Summary</h4>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                    {selectedActivity.duration || 0}s
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                    {CALL_STATUS_MAP[selectedActivity.status] || "Unknown"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                    {selectedActivity.extraDetails?.cType === "IBD" ? "Incoming" : "Outgoing"}
                                                </span>
                                            </div>

                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Call Type */}
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="w-full">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Call Type
                                                </label>
                                                <select
                                                    name="callType"
                                                    value={notesForm.callType}
                                                    onChange={handleNotesFormChange}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                >
                                                    <option value="">Select call type</option>
                                                    {noteCallTypes.map(type => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-full">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Call Purpose
                                                </label>
                                                <select
                                                    name="callPurpose"
                                                    value={notesForm.callPurpose}
                                                    onChange={handleNotesFormChange}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                >
                                                    <option value="">Select purpose</option>
                                                    {callPurposes.map(purpose => (
                                                        <option key={purpose.value} value={purpose.value}>
                                                            {purpose.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Notes
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={notesForm.notes}
                                                onChange={handleNotesFormChange}
                                                rows="4"
                                                placeholder="Add detailed notes about the call..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                            />
                                        </div>

                                        {/* Rating */}
                                        {/* <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Call Rating
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {ratings.map(rating => (
                                                    <button
                                                        key={rating.value}
                                                        type="button"
                                                        onClick={() => setNotesForm(prev => ({ ...prev, rating: rating.value }))}
                                                        className={`px-3 py-2 border rounded-lg ${notesForm.rating === rating.value
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{rating.label}</span>
                                                            <span className="text-xs">{rating.text}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div> */}

                                        {/* Tags */}
                                        {/* <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Tags
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {tagOptions.map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => handleTagToggle(tag)}
                                                        className={`px-3 py-1 text-sm rounded-full ${notesForm.tags.includes(tag)
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div> */}

                                        {/* Follow-up Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Follow-up Date
                                            </label>
                                            <input
                                                type="date"
                                                name="followUpDate"
                                                value={notesForm.followUpDate}
                                                onChange={handleNotesFormChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                onClick={handleSubmitNotes}
                                                disabled={submittingNotes}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (user?.role != "counselor") ?
                                <div className="relative">
                                    <div className="absolute left-4 top-5 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-gray-100 dark:from-blue-600 dark:to-gray-600"></div>

                                    <div className="space-y-1">
                                        {activities.map((activity, index) => {
                                            const CallIcon = CALL_STATUS_ICON[activity.status].icon || PhoneCall;
                                            const iconColor = CALL_STATUS_ICON[activity.status].color || "text-gray-600";
                                            const isLast = index === activities.length - 1;
                                            let activityTitle = !isNaN(activity.status)
                                                ? CALL_STATUS_MAP[Number(activity.status)] || "Unknown Status"
                                                : activity.status || "Unknown Status";

                                            return (
                                                <motion.div
                                                    key={activity._id}
                                                    ref={isLast ? lastActivityRef : null}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="relative pl-10"
                                                >
                                                    <div className="absolute left-0 top-0.5 p-0.5 flex items-center justify-center">
                                                        <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
                                                        <div className={`relative z-10 p-2 rounded-full ${iconColor} bg-opacity-20 flex items-center justify-center`}>
                                                            <CallIcon className="w-4 h-4" />
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-100 rounded-lg">
                                                        <div className="p-2.5 space-y-1">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-gray-700 text-sm dark:text-white">
                                                                            {activityTitle}
                                                                        </span>
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                                                            {!isNaN(activity.status)
                                                                                ? CALL_STATUS_MAP[Number(activity.status)] || "Unknown Status"
                                                                                : activity.status}
                                                                        </span>
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                                                            {activity?.extraDetails?.cType == "IBD" ? "Incoming" : "Outgoing"}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 ml-4">
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {moment(activity?.ivrSTime).format("MMM DD, YYYY hh:mm A")}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-sm">
                                                                <span className="text-gray-600 dark:text-gray-400">Call Duration:</span>
                                                                <span className="font-medium text-gray-900 dark:text-white">{activity?.duration || 0}s</span>
                                                                <span className="text-gray-600 dark:text-gray-400 ml-6">Call Hangup by :</span>
                                                                <span className="font-medium text-gray-900 dark:text-white">{activity?.extraDetails?.HangupBySourceDetected == 1 ? "Counselor" : "Student"}</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-sm">
                                                                {activity?.extraDetails?.callType && <>
                                                                    <span className="text-gray-600 dark:text-gray-400">Call Type :</span>
                                                                    <span className="font-medium text-gray-900 dark:text-white">{activity?.extraDetails?.callType}</span>
                                                                </>}
                                                                {activity?.extraDetails?.callPurpose && <>
                                                                    <span className="text-gray-600 dark:text-gray-400 ml-6">Call Purpose :</span>
                                                                    <span className="font-medium text-gray-900 dark:text-white">{activity?.extraDetails?.callPurpose}</span>
                                                                </>}
                                                            </div>
                                                            {activity?.extraDetails?.notes && <div className="flex gap-2 text-sm">
                                                                <span className="text-gray-600 dark:text-gray-400">Notes :</span>
                                                                <span className="font-medium text-gray-900 dark:text-white">{activity?.extraDetails?.notes}</span>
                                                            </div>}
                                                            {(() => {
                                                                let recordingData = null;

                                                                try {
                                                                    if (typeof activity?.recordingData === "string") {
                                                                        if (activity.recordingData.startsWith("http")) {
                                                                            recordingData = activity.recordingData;
                                                                        } else {
                                                                            recordingData = JSON.parse(activity.recordingData);
                                                                        }
                                                                    } else {
                                                                        recordingData = activity?.recordingData || null;
                                                                    }
                                                                } catch (err) {
                                                                    console.error("Invalid recordingData JSON", err);
                                                                    recordingData = null;
                                                                }

                                                                return (
                                                                    recordingData && (
                                                                        <div>
                                                                            <audio
                                                                                controls
                                                                                className="w-full"
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
                                                                    )
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {loading && (
                                            <div className="flex justify-center py-8">
                                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}

                                        {!loading && activities.length === 0 && (
                                            <div className="text-center py-12">
                                                <Phone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                    No activity found
                                                </h3>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    No calls or activities match your current filters.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div> : <div className="h-[60vh] w-full flex justify-center items-center">
                                    <img className="h-70 w-70 object-cover rounded-full" src="https://cdn.svgator.com/images/2022/11/Chart-run-cycle.gif" alt="" />
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ActivityLogsModal;