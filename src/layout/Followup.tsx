// components/FollowUpBot.jsx
import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import api from "../axiosInstance";
import { useAuth } from "../context/UserContext";
import {
    MessageCircle,
    X,
    Bell,
    Calendar,
    Phone,
    User,
    Clock,
    CheckCircle,
    ChevronRight,
    AlertCircle,
    Loader2,
    Volume2
} from "lucide-react";
import { useNavigate } from "react-router";

export default function FollowUpBot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastAlertTime, setLastAlertTime] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [processingIds, setProcessingIds] = useState(new Set());
    const navigate = useNavigate();

    // Fetch today's follow-ups
    const fetchTodayFollowUps = useCallback(async () => {
        if (!user?._id) return;

        setLoading(true);
        try {
            const today = moment().startOf('day').toISOString();
            const tomorrow = moment().endOf('day').toISOString();

            const response = await api.get("/leads/followups", {
                params: {
                    counselorId: user.role === "counselor" ? user._id : undefined,
                    startDate: today,
                    endDate: tomorrow
                }
            });

            if (response.data?.success) {
                const newFollowUps = response.data.data || [];
                setFollowUps(newFollowUps);

                // Update unread count
                const storedReadIds = localStorage.getItem('readFollowUpIds');
                const readIds = storedReadIds ? JSON.parse(storedReadIds) : [];
                const newUnreadCount = newFollowUps.filter(f => !readIds.includes(f._id)).length;
                setUnreadCount(newUnreadCount);

                // Show alert for new follow-ups
                if (newFollowUps.length > 0) {
                    const lastAlert = localStorage.getItem('lastFollowUpAlert');
                    const lastAlertTime = lastAlert ? new Date(lastAlert) : null;
                    const now = new Date();

                    // Show alert every 5 minutes if there are unread follow-ups
                    if (!lastAlertTime || (now - lastAlertTime) > 5 * 60 * 1000) {
                        showFollowUpAlert(newFollowUps.length);
                        localStorage.setItem('lastFollowUpAlert', now.toISOString());
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch follow-ups:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Show browser notification and toast alert
    const showFollowUpAlert = (count) => {
        const message = `You have ${count} follow-up${count > 1 ? 's' : ''} scheduled for today`;

        // Show toast notification
        toast.info(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            icon: <Bell className="h-5 w-5" />
        });

        // Show browser notification if permitted
        if (Notification.permission === "granted") {
            new Notification("Follow-Up Reminder", {
                body: message,
                icon: "/favicon.ico",
                badge: "/favicon.ico"
            });
        }

        // Show custom alert banner
        setAlertMessage(message);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 8000);
    };

    // Request notification permission
    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        if (user?._id) {
            fetchTodayFollowUps();

            // Poll every 5 minutes for new follow-ups
            const interval = setInterval(fetchTodayFollowUps, 5 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [user, fetchTodayFollowUps]);

    // Mark as read when opening bot
    const handleOpenBot = () => {
        setIsOpen(!isOpen);
        if (unreadCount > 0) {
            // Mark all as read
            const readIds = followUps.map(f => f._id);
            localStorage.setItem('readFollowUpIds', JSON.stringify(readIds));
            setUnreadCount(0);
        }
    };

    // Get priority color
    const getPriorityColor = (date) => {
        const now = moment();
        const followUpDate = moment(date);
        const hoursRemaining = followUpDate.diff(now, 'hours');

        if (hoursRemaining < 0) return "border-red-500 bg-red-50 dark:bg-red-900/20";
        if (hoursRemaining < 2) return "border-orange-500 bg-orange-50 dark:bg-orange-900/20";
        if (hoursRemaining < 24) return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
        return "border-green-500 bg-green-50 dark:bg-green-900/20";
    };

    return (
        <>
            {/* Floating Alert Banner */}
            {showAlert && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-999 animate-slide-down">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <Bell className="h-5 w-5 animate-bounce" />
                        <span className="font-medium">{alertMessage}</span>
                        <button
                            onClick={() => setShowAlert(false)}
                            className="ml-1 hover:bg-white/20 rounded-lg p-1 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Follow-Up Bot Button */}
            <div className="fixed bottom-6  right-6 z-50">

                <button
                    onClick={handleOpenBot}
                    className="relative group "
                >
                    <div className="absolute  -top-1 -right-1 animate-pulse">
                        {unreadCount > 0 && (
                            <span className="shadow-xl inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                </button>


                {/* Chat Window */}
                {isOpen && (
                    <div className="absolute bottom-16 right-0 w-90 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:border-gray-700 overflow-hidden animate-slide-up">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="h-6 w-6 text-white" />
                                <div>
                                    <h3 className="text-white font-semibold">Follow-Up Reminders</h3>
                                    <p className="text-indigo-100 text-xs">
                                        {followUps.length} follow-up{followUps.length !== 1 ? 's' : ''} today
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                </div>
                            ) : followUps.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 space-y-2">
                                    {followUps.map((followUp) => (
                                        <div
                                            key={followUp._id}
                                            className={`p-4 py-2 flex justify-between rounded-2xl m-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors  ${getPriorityColor(followUp.nextFollowupDate)}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                                            {followUp.fullName || followUp.name || "Unknown Lead"}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{followUp.phone || followUp.phone10 || "No phone"}</span>
                                                        <span className="mx-1">•</span>
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{moment(followUp.nextFollowupDate).format("MM/DD/YYYY")}</span>
                                                    </div>
                                                    {followUp.status && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                            Status: {followUp.status}
                                                        </span>
                                                    )}
                                                    {/* <div className="mt-2 flex items-center gap-2 text-xs">
                                                        <Clock className="h-3 w-3 text-orange-500" />
                                                        <span className={`font-medium ${moment(followUp.nextFollowupDate).isBefore(moment())
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-orange-600 dark:text-orange-400'
                                                            }`}>
                                                            {getTimeRemaining(followUp.nextFollowupDate)}
                                                        </span>
                                                    </div> */}
                                                </div>
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <button
                                                    onClick={() => navigate(`/leads?q=${followUp.phone10 || followUp.fullName || ""}&lead=${followUp._id}`)}
                                                    disabled={processingIds.has(followUp._id)}
                                                    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                                >
                                                    {processingIds.has(followUp._id) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            View
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                                        No follow-ups for today
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                        You're all caught up! 🎉
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                Auto-refreshes every 5 minutes • {moment().format("hh:mm A")}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
        </>
    );
}