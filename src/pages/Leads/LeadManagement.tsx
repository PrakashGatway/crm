import { useState, useEffect, use } from "react";
import moment from "moment";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Activity, Eye, Filter, MessageCircleCode, MessageSquare, Pencil, Phone, PhoneCall, PhoneCallIcon, PhoneIncomingIcon, PhoneMissed, PhoneMissedIcon, PhoneOutgoingIcon, Target, Trash2, Upload, User, X } from "lucide-react";
import TextArea from "../../components/form/input/TextArea";
import { useAuth } from "../../context/UserContext";
import ExcelUpload from "./ExcelUpload";
import Tabs from "./tabs";
import Swal from 'sweetalert2'
import ActivityLogsModal from "./ActivityLogs";
import IncomingCallsModal from "./IncomingCall";
import { useSearchParams } from "react-router";

// const LeadStatuses = [
//     'new',
//     'notReachable',
//     'followup',
//     'viewed',
//     'contacted',
//     'interested',
//     'notInterested',
//     'enrolled',
//     'rejected',
//     'junk',
//     'visitDone',
//     'visitSchedule',
//     'inactive'
// ];

export const LeadStatus = {
    'new': "Untouched",
    'notReachable': "Not Reachable",
    'followup': "Followup",
    'viewed': "Viewed",
    'futureLeads': "Future Leads",
    'interested': "Interested",
    'notInterested': "Not Interested",
    'vcBooked': "VC Booked",
    'vcConducted': "VC Conducted",
    'enrolled': "Enrolled",
    'rejected': "Canceled",
    'junk': "Junk",
    'closed': "Closed",
    'visitDone': 'Visit Done',
    'visitSchedule': "Visit Schedule",
    'reenquired': "Re-enquired",
    'inactive': "Inactive",
    'langBarrier': "Language Barrier",
};


const LeadSources = [
    'googleAds',
    'website',
    'education_fair',
    'referral',
    'metaAds',
    'social_media',
    'partner',
    'facebook',
    "excel",
    "other"
];

export default function LeadManagement() {
    const [searchParams] = useSearchParams();

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allCounselors, setAllCounselors] = useState([]);
    const { user } = useAuth();
    const [bulkCounselor, setBulkCounselor] = useState("");
    const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [selectedLeadForActivity, setSelectedLeadForActivity] = useState(null);
    const [isCallModalOpen, setCallModalOpen] = useState(false);
    const [customNumber, setCustomNumber] = useState("")

    const [selectedLeads, setSelectedLeads] = useState(new Set()); // Track selected lead IDs
    const [showAppliedFilters, setShowAppliedFilters] = useState(false);

    const [stats, setStats] = useState([]) as any;
    const [selectAll, setSelectAll] = useState(false); // Track "select all" checkbox state
    const [showIncomingCalls, setShowIncomingCalls] = useState(false);
    const [showExcelUpload, setShowExcelUpload] = useState(false);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sortBy: "-createdAt",
        status: "",
        source: "",
        assignedCounselor: "",
        coursePreference: "",
        countryOfResidence: "",
        dateRange: "",
        search: "",
    });
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.search.length === 0 || filters.search.length >= 3) {
                setDebouncedSearch(filters.search);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const getCounselorName = (counselorId) => {
        if (!counselorId) return "—";
        const counselor = allCounselors.find(c => c._id === counselorId);
        return counselor ? (counselor.name || counselor.email) : "Unknown";
    };

    useEffect(() => {
        const status = searchParams.get("status");
        const counselor = searchParams.get("user");

        setFilters((prev) => ({
            ...prev,
            status: status || "",
            assignedCounselor: counselor || ""
        }));
    }, [searchParams]);

    const formatDateRangeDisplay = () => {
        if (!filters.dateRange) return "—";
        const [start, end] = filters.dateRange.split('_');
        const startDate = moment(start).format("MMM D, YYYY");
        const endDate = moment(end).format("MMM D, YYYY");
        return `${startDate} to ${endDate}`;
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            limit: 10,
            sortBy: "-createdAt",
            status: "",
            source: "",
            assignedCounselor: "",
            coursePreference: "",
            countryOfResidence: "",
            dateRange: "",
            search: "",
        });
        setDateRangeStart("");
        setDateRangeEnd(today);
        setShowAppliedFilters(false);
    };
    const toggleLeadSelection = (leadId) => {
        const newSelectedLeads = new Set(selectedLeads);
        if (newSelectedLeads.has(leadId)) {
            newSelectedLeads.delete(leadId);
        } else {
            newSelectedLeads.add(leadId);
        }
        setSelectedLeads(newSelectedLeads);

        // Update "select all" checkbox state based on individual selections
        if (newSelectedLeads.size === 0) {
            setSelectAll(false);
        } else if (newSelectedLeads.size === leads.length && leads.every(l => newSelectedLeads.has(l._id))) {
            // Check if all visible leads on the current page are selected
            const visibleLeadIds = leads.map(l => l._id);
            const allVisibleSelected = visibleLeadIds.every(id => newSelectedLeads.has(id));
            setSelectAll(allVisibleSelected);
        }
        // If some are selected but not all, keep selectAll false
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            // Deselect all
            setSelectedLeads(new Set());
        } else {
            // Select all leads currently displayed
            const allVisibleLeadIds = leads.map(l => l._id);
            setSelectedLeads(new Set(allVisibleLeadIds));
        }
        setSelectAll(!selectAll);
    };

    const handleBulkDelete = async () => {
        if (selectedLeads.size === 0) {
            toast.warn("Please select at least one lead to delete.");
            return;
        }

        const confirmMessage = `Are you sure you want to delete ${selectedLeads.size} selected lead(s)? This action cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setLoading(true); // Show loading indicator for the whole table
            const response = await api.delete("/leads/bulk/delete", {
                data: { ids: Array.from(selectedLeads) } // Send selected IDs in request body
            });
            toast.success(`Successfully deleted ${response.data.deletedCount} lead(s).`);
            fetchLeads(); // Refresh the list
            setSelectedLeads(new Set()); // Clear selections
            setSelectAll(false); // Reset "select all" checkbox
        } catch (error) {
            console.error("Bulk delete error:", error);
            toast.error(error.response?.data?.message || "Failed to delete leads.");
        } finally {
            setLoading(false); // Hide loading indicator
        }
    };

    const handleExcelUploadComplete = (leads) => {
        fetchLeads();
        setShowExcelUpload(false);
    };




    const today = moment().format("YYYY-MM-DD");
    // local date inputs for the picker UI
    const [dateRangeStart, setDateRangeStart] = useState("");
    const [dateRangeEnd, setDateRangeEnd] = useState(today);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        countryOfResidence: "",
        intendedIntake: null,
        coursePreference: "",
        status: "new",
        source: "website",
        assignedCounselor: "",
    });
    const [errors, setErrors] = useState({});
    const [newNote, setNewNote] = useState("");

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            await api.post(`/leads/${selectedLead._id}/notes`, { text: newNote });
            toast.success("Note added");
            fetchLeads();
            setNewNote("");
        } catch (error) {
            toast.error("Failed to add note");
        }
    };

    // useEffect(() => {
    //     fetchLeads();
    // }, [
    //     filters.page,
    //     filters.limit,
    //     filters.sortBy,
    //     filters.status,
    //     filters.source,
    //     filters.assignedCounselor,
    //     filters.coursePreference,
    //     filters.countryOfResidence,
    //     filters.dateRange,
    //     filters.search,
    // ]);

    useEffect(() => {
        if (user?.role != "counselor") {
            fetchCounselors();
        }
    }, [user?.role]);

    useEffect(() => {
        if (filters.dateRange) {
            const parts = filters.dateRange.split("_");
            if (parts.length === 2) {
                setDateRangeStart(parts[0]);
                setDateRangeEnd(parts[1]);
            } else {
                setDateRangeStart("");
                setDateRangeEnd(today);
            }
        } else {
            setDateRangeStart("");
            setDateRangeEnd(today);
        }
    }, [filters.dateRange]);


    // Inside your component
    const fetchLeads = async (status) => {
        if (status) {
            setLoading(true);
        }
        try {
            const params = {
                ...filters,
                page: filters.page,
                limit: filters.limit,
                sort: filters.sortBy,
            };

            Object.keys(params).forEach((k) => {
                if (params[k] === "" || params[k] === null || params[k] === undefined) {
                    delete params[k];
                }
            });

            const response = await api.get("/leads", { params });
            setLeads(response.data?.data || []);
            setTotal(response.data?.pagination?.totalLeads || 0);
        } catch (error) {
            toast.error(error?.message || "Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get(`/leads/stats?source=${filters.source}&assignedCounselor=${filters.assignedCounselor}&dateRange=${filters.dateRange}&search=${filters.search}`);
            setStats(response.data?.stats || []);
        } catch (error) {
            toast.error(error?.message || "Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [filters.source, filters.assignedCounselor, filters.dateRange, debouncedSearch]);

    useEffect(() => {
        let pollInterval = null;
        const twoMinutes = 2 * 60 * 1000; // 120,000 ms

        const startPolling = () => {
            if (pollInterval) return;

            pollInterval = setInterval(() => {
                if (document.visibilityState === 'visible' && navigator.onLine) {
                    fetchLeads();
                }
            }, twoMinutes);
        };

        const stopPolling = () => {
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && navigator.onLine) {
                fetchLeads(); // Refetch when returning
                startPolling();
            } else {
                stopPolling();
            }
        };

        const handleOnline = () => {
            if (document.visibilityState === 'visible') {
                fetchLeads();
                startPolling();
            }
        };

        const handleOffline = () => {
            stopPolling();
        };

        if (document.visibilityState === 'visible' && navigator.onLine) {
            fetchLeads(true); // 👈 THIS IS THE KEY ADDITION
            startPolling();
        } else {
        }

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup
        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [
        filters.page,
        filters.limit,
        filters.sortBy,
        filters.status,
        filters.source,
        filters.assignedCounselor,
        filters.coursePreference,
        filters.countryOfResidence,
        filters.dateRange,
        debouncedSearch
    ]); // Re-run if filters change


    const fetchCounselors = async () => {
        try {
            const res = await api.get("/users?role=counselor");
            setAllCounselors(res.data?.users || []);
        } catch (error) {
            console.error("Failed to fetch counselors:", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: 1,
        }));
    };

    // Robust date-range handler using functional updates so values are always current
    const handleDateRangeChange = (which, value) => {
        if (which === "start") {
            setDateRangeStart(value);
            setFilters((prev) => {
                const end = dateRangeEnd;
                const computedEnd = end || prev.dateRange?.split("_")?.[1] || "";
                if (!value) {
                    return { ...prev, dateRange: "", page: 1 };
                }
                if (!computedEnd) {
                    return { ...prev, dateRange: `${value}_${today}`, page: 1 };
                }
                if (new Date(value) > new Date(computedEnd)) {
                    toast.warn("Start date cannot be after End date. Please correct.");
                    return { ...prev, dateRange: "", page: 1 };
                }
                return { ...prev, dateRange: `${value}_${computedEnd}`, page: 1 };
            });
        } else {
            setDateRangeEnd(value);
            setFilters((prev) => {
                const start = dateRangeStart;
                const computedStart = start || prev.dateRange?.split("_")?.[0] || "";
                if (!value) {
                    return { ...prev, dateRange: "", page: 1 };
                }
                if (!computedStart) {
                    return { ...prev, dateRange: "", page: 1 };
                }
                if (new Date(computedStart) > new Date(value)) {
                    toast.warn("End date cannot be before Start date. Please correct.");
                    return { ...prev, dateRange: "", page: 1 };
                }
                return { ...prev, dateRange: `${computedStart}_${value}`, page: 1 };
            });
        }
    };
    const handlePageChange = (newPage) => {
        setFilters((prev) => ({
            ...prev,
            page: newPage,
        }));
    };

    const viewLeadDetails = async (lead) => {
        setSelectedLead(lead);
        openModal();
        if (lead.status === "new") {
            try {
                await api.put(`/leads/${lead._id}`, { status: "viewed" });
                fetchLeads();
            } catch (err) {
                // ignore silently
            }
        }
    };

    const clickToCall = async (lead) => {
        setSelectedLead(lead);
        setCallModalOpen(true);
    }
    // Ask number first
    const callNow = async (customNumber) => {
        let inputNumber = "";
        if (customNumber) {
            inputNumber = customNumber;
        } else {
            if (!user.phoneNumber) {
                Swal.fire("Error", "Your phone number is not set in profile.", "error");
                return;
            }
            inputNumber = user?.phoneNumber || inputNumber;
        }
        const phoneRegex = /^\d{10,13}$/;
        const masterNumber =
            inputNumber && phoneRegex.test(inputNumber)
                ? inputNumber
                : user?.phoneNumber;

        if (!masterNumber) {
            Swal.fire("Error", "No valid phone number available.", "error");
            return;
        }
        if (!selectedLead) {
            Swal.fire("Error", "No lead selected for calling.", "error");
            return;
        }

        try {
            Swal.fire({
                title: "Calling...",
                text: "Please wait while we initiate the call",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const res = await api.get(
                `/leads/call/${selectedLead._id}?masterNumber=${encodeURIComponent(masterNumber)}`
            );

            Swal.close();

            Swal.fire({
                title: res.data?.status === "success" ? "Success" : "Error",
                text: res.data?.message || "Call response received",
                icon: res.data?.status === "success" ? "success" : "error",
            });
        } catch (err) {
            Swal.close();
            Swal.fire(
                "Error",
                err.message || "Failed to initiate call",
                "error"
            );
        }
    };




    const openEditModal = (lead) => {
        setSelectedLead(lead);
        setFormData({
            fullName: lead.fullName || "",
            email: lead.email || "",
            phone: lead.phone || "",
            countryOfResidence: lead.countryOfResidence || "",
            intendedIntake: lead.intendedIntake
                ? lead.intendedIntake
                : null,
            coursePreference: lead.coursePreference || "",
            status: lead.status || "new",
            source: lead.source || "website",
            assignedCounselor: lead.assignedCounselor?._id || "",
        });
        setEditModalOpen(true);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName?.trim()) newErrors.fullName = "Full name is required";
        // if (!formData.email?.trim()) {
        //     newErrors.email = "Email is required";
        // } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        //     newErrors.email = "Invalid email";
        // }
        // if (!formData.coursePreference?.trim()) {
        //     newErrors.coursePreference = "Course preference is required";
        // }
        // if (!formData.source) newErrors.source = "Source is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveLead = async () => {
        if (!validateForm()) return;
        try {

            const payload = { ...formData };
            if (user.role != "admin") {
                delete payload.email;
                delete payload.phone;
            }
            if (!payload.assignedCounselor) delete payload.assignedCounselor;

            await api.put(`/leads/${selectedLead._id}`, payload);
            toast.success("Lead updated successfully");
            fetchLeads();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.error || "Failed to update lead");
        }
    };

    const handleBulkAssign = async (withNew) => {
        if (!bulkCounselor) {
            toast.warn("Please select a counselor");
            return;
        }

        if (selectedLeads.size === 0) {
            toast.warn("No leads selected");
            return;
        }

        try {
            setBulkAssignLoading(true);
            const confirmed = window.confirm("Are you sure you want to assign this counselor to the selected leads?");

            if (!confirmed) {
                setBulkAssignLoading(false);
                return;
            }

            await api.put("/leads/bulk/assign", {
                counselorId: bulkCounselor,
                leadIds: Array.from(selectedLeads),
                withNew,
            });

            toast.success("Counselor assigned successfully");
            setSelectedLeads(new Set());
            setSelectAll(false);
            setBulkCounselor("");
            fetchLeads();
        } catch (error) {
            toast.error(error.message || "Failed to assign counselor");
        } finally {
            setBulkAssignLoading(false);
        }
    };


    const handleCreateLead = async () => {
        if (!validateForm()) return;
        try {
            const payload = { ...formData };
            if (!payload.assignedCounselor) delete payload.assignedCounselor;

            await api.post("/leads", payload);
            toast.success("Lead created successfully");
            fetchLeads();
            setEditModalOpen(false);
        } catch (error) {
            if (
                error.response?.status === 400 &&
                error.response?.data?.error?.includes("email")
            ) {
                setErrors({ email: "A lead with this email already exists." });
            } else {
                toast.error(error.message || "Failed to create lead");
            }
        }
    };

    const deleteLead = async () => {
        if (!selectedLead) return;
        try {
            await api.delete(`/leads/${selectedLead._id}`);
            toast.success("Lead deleted successfully");
            fetchLeads();
            setDeleteModalOpen(false);
            setSelectedLead(null);
        } catch (error) {
            toast.error("Failed to delete lead");
        }
    };

    const openCreateModal = () => {
        setSelectedLead(null);
        setFormData({
            fullName: "",
            email: "",
            phone: "",
            countryOfResidence: "",
            intendedIntake: null,
            coursePreference: "",
            status: "new",
            source: "website",
            assignedCounselor: "",
        });
        setErrors({});
        setEditModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };


    const getAppliedFiltersCount = () => {
        let count = 0;
        if (filters.search) count++;
        if (filters.status) count++;
        if (filters.source) count++;
        if (filters.assignedCounselor) count++;
        if (filters.coursePreference) count++;
        if (filters.countryOfResidence) count++;
        if (filters.dateRange) count++;
        return count;
    };
    const appliedFiltersCount = getAppliedFiltersCount();

    const getStatusColor = (status) => {
        const colors = {
            new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            contacted:
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            interested:
                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            notInterested:
                "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
            enrolled:
                "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            rejected:
                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            inactive:
                "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        };
        return colors[status] || colors.new;
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="p-2 px-3 border border-gray-200 rounded-2xl dark:border-gray-800 mb-2 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col items-center w-full gap-4 md:flex-row">
                        <div className="w-10 h-10 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-indigo-50">
                            <User className="text-indigo-600 h-5 w-5" />
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="text-lg font-semibold text-center text-gray-800 dark:text-white/90 md:text-left">
                                Leads
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center md:flex-row md:gap-3 md:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage prospective students
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 md:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{total && total} leads</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <button
                            onClick={() => setShowIncomingCalls(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-indigo-600 bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-indigo-700 hover:text-white lg:inline-flex lg:w-auto"
                        >
                            <PhoneIncomingIcon className="h-4 w-4" />
                            Incoming Calls
                        </button>
                        {user.role == "admin" && <>
                            <button
                                onClick={openCreateModal}
                                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                            >
                                <svg
                                    className="fill-current"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 18 18"
                                >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                                        fill="currentColor"
                                    />
                                </svg>
                                Add New Lead
                            </button>
                            <button
                                onClick={() => setShowExcelUpload(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-full border border-indigo-600 bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-indigo-700 hover:text-white lg:inline-flex lg:w-auto"
                            >
                                <Upload className="h-4 w-4" />
                                Upload Excel
                            </button>
                        </>}

                    </div>
                </div>
            </div>
            <IncomingCallsModal
                isOpen={showIncomingCalls}
                onClose={() => setShowIncomingCalls(false)}
                setSelectedLeadForActivity={setSelectedLeadForActivity}
                setActivityModalOpen={setActivityModalOpen}
            />
            <Modal
                isOpen={showExcelUpload}
                onClose={() => setShowExcelUpload(false)}
                className="max-w-4xl m-4"
            >
                <ExcelUpload
                    onUploadComplete={handleExcelUploadComplete}
                    onClose={() => setShowExcelUpload(false)}
                />
            </Modal>

            <Tabs
                tabs={stats}
                activeTab={filters.status}
                onChange={(tabId) => handleFilterChange({ target: { name: "status", value: tabId } })}
            />

            {/* Filters */}
            <div className="flex justify-center duration-300 ease-in-out w-full gap-1">
                <div className="min-h-[70vh] overflow-x-auto duration-500 ease-in-out rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Search Leads
                            </label>
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search leads..."
                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        {/* <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            {LeadStatuses.map((s) => (
                                <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div> */}

                        {user.role && user.role !== "counselor" && (
                            <>
                                {(user.role === "admin" || user.role === "manager") && <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Source
                                    </label>
                                    <select
                                        name="source"
                                        value={filters.source}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="">All Sources</option>
                                        {LeadSources.map((s) => (
                                            <option key={s} value={s}>
                                                {s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </option>
                                        ))}
                                    </select>
                                </div>}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Counselor
                                    </label>
                                    <select
                                        name="assignedCounselor"
                                        value={filters.assignedCounselor}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="">All Counselors</option>
                                        {allCounselors.map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.name || c.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {/* <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Course Preference
                        </label>
                        <input
                            type="text"
                            name="coursePreference"
                            value={filters.coursePreference}
                            onChange={handleFilterChange}
                            placeholder="e.g. MBA, Computer Science"
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div> */}

                        {/* <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country of Residence
                        </label>
                        <input
                            type="text"
                            name="countryOfResidence"
                            value={filters.countryOfResidence}
                            onChange={handleFilterChange}
                            placeholder="e.g. India, Nigeria"
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div> */}

                        {/* Date Range */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date Range (Start)
                            </label>
                            <div className="">
                                <input
                                    type="date"
                                    name="dateRangeStart"
                                    value={dateRangeStart}
                                    onChange={(e) => handleDateRangeChange("start", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                />

                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date Range (End)
                            </label>
                            <input
                                type="date"
                                name="dateRangeEnd"
                                value={dateRangeEnd}
                                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                    </div>
                    {total > 0 && (
                        <div className="">
                            <div className="flex items-center justify-between space-x-4 mb-2">
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Limit:
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
                                <div className="flex gap-2 ">

                                    <button
                                        onClick={() =>
                                            setFilters({
                                                page: 1,
                                                limit: 10,
                                                sortBy: "-createdAt",
                                                status: "",
                                                source: "",
                                                assignedCounselor: "",
                                                coursePreference: "",
                                                countryOfResidence: "",
                                                dateRange: "",
                                                search: "",
                                            })
                                        }
                                        className=" rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    >
                                        Reset Filters
                                    </button>
                                    {selectedLeads.size > 0 && (
                                        <div className="flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 ps-2 sticky top-0 z-10">
                                            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                                                {selectedLeads.size} lead{selectedLeads.size > 1 ? "s" : ""}
                                            </span>

                                            {/* Counselor Select */}
                                            <select
                                                value={bulkCounselor}
                                                onChange={(e) => setBulkCounselor(e.target.value)}
                                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600"
                                            >
                                                <option value="">Assign Counselor</option>
                                                {allCounselors.map((c) => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.name || c.email}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                onClick={() => handleBulkAssign(false)}
                                                disabled={!bulkCounselor || bulkAssignLoading}
                                                className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                Assign
                                            </button>
                                            <button
                                                onClick={() => handleBulkAssign(true)}
                                                disabled={!bulkCounselor || bulkAssignLoading}
                                                className="rounded bg-violet-900 px-3 h-[85%] text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                Assign<span className="block text-[8px] m-0 p-0">
                                                    (With New Tag)</span>
                                            </button>

                                            <button
                                                onClick={handleBulkDelete}
                                                className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setShowAppliedFilters(!showAppliedFilters)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filters {appliedFiltersCount > 0 && `(${appliedFiltersCount})`}
                                    </button>
                                </div>


                            </div>
                        </div>
                    )}
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={toggleSelectAll}
                                                className="rounded h-[14px] w-[14px] border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                                            />
                                        </th>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Name
                                        </th>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Contact
                                        </th>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Call Actions
                                        </th>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Counselor
                                        </th>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Status
                                        </th>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                                            S.Status
                                        </th>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            {user?.role == "counselor" ? "Date" : "Source"}
                                        </th>
                                        <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {leads.length > 0 ? (
                                        leads.map((lead) => (
                                            <tr
                                                key={lead._id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="whitespace-nowrap px-2 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLeads.has(lead._id)}
                                                        onChange={() => toggleLeadSelection(lead._id)}
                                                        className="rounded h-[14px] w-[14px] border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-sm font-medium capitalize text-gray-900 dark:text-white">
                                                    {lead?.fullName || "—"}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                    Email:{lead?.email || "—"} <br />
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLeadForActivity(lead);
                                                                setActivityModalOpen(true);
                                                            }}
                                                            className="p-1 rounded-lg text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                                        >
                                                            <Activity className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => clickToCall(lead)}
                                                            className="px-2 py-1 rounded-full flex gap-2 items-center justify-center border text-orange-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            <PhoneCall className="h-4 w-4" />
                                                        </button>
                                                        <div
                                                            className="px-2 py-1 rounded-full flex gap-2 items-center justify-center border text-orange-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            <PhoneOutgoingIcon className="h-4 w-4" />
                                                            <p className="text-base font-medium">{lead?.callStats?.[0]?.answeredCalls || 0}</p>
                                                        </div>
                                                        <div
                                                            className="px-2 py-1 rounded-full flex gap-2 items-center justify-center border text-orange-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            <PhoneMissedIcon className="h-4 w-4" />
                                                            <p className="text-base font-medium">{lead?.callStats?.[0]?.notConnectedCalls || 0}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* <td className="whitespace-nowrap px-2 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                    {lead.intendedIntake
                                                        ? moment(lead.intendedIntake).format("MMM YYYY")
                                                        : "—"}
                                                </td> */}
                                                <td className="whitespace-nowrap px-2 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                    {lead?.assignedCounselor?.name ||
                                                        lead?.assignedCounselor?.email ||
                                                        "Unassigned"}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 border-2 border-gray-600 text-xs font-semibold ${getStatusColor(
                                                            lead?.status
                                                        )}`}
                                                    >
                                                        {/* {lead?.status.charAt(0).toUpperCase() +
                                                            lead?.status.slice(1)} */}
                                                        {LeadStatus[lead?.status] ? LeadStatus[lead?.status] : lead?.status}
                                                    </span>

                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3">
                                                    {lead.secondaryStatus ? <span
                                                        className={`inline-flex rounded-full px-2 border-2 border-amber-500 text-xs font-semibold ${getStatusColor(
                                                            lead?.secondaryStatus
                                                        )}`}
                                                    >
                                                        {/* {lead?.secondaryStatus.charAt(0).toUpperCase() +
                                                            lead?.secondaryStatus.slice(1)} */}
                                                        {LeadStatus[lead?.secondaryStatus] ? LeadStatus[lead?.secondaryStatus] : lead?.secondaryStatus}

                                                    </span> : "__"}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300 capitalize">
                                                    {lead?.createdAt &&
                                                        moment(lead?.createdAt).format("MMM D, YYYY h:mm A")}
                                                    <br />
                                                    {(user?.role == "admin" || user?.role == "manager" ) &&
                                                        lead?.source.replace(/_/g, " ")}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => viewLeadDetails(lead)}
                                                            className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(lead)}
                                                            className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            <Pencil className="h-5 w-5" />
                                                        </button>
                                                        {user.role == "admin" && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedLead(lead);
                                                                    setDeleteModalOpen(true);
                                                                }}
                                                                className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                                            >
                                                No leads found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {total > 0 && (
                        <div className="mt-4 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                                Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to{" "}
                                <span className="font-medium">{Math.min(filters.page * filters.limit, total)}</span> of{" "}
                                <span className="font-medium">{total}</span> results
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(filters.page - 1)}
                                    disabled={filters.page === 1}
                                    className={`rounded-md border px-3 py-1 text-sm ${filters.page === 1
                                        ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                        }`}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.ceil(total / filters.limit) }, (_, i) => i + 1)
                                    .slice(Math.max(0, filters.page - 3), Math.min(Math.ceil(total / filters.limit), filters.page + 2))
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
                                    className={`rounded-md border px-3 py-1 text-sm ${filters.page * filters.limit >= total
                                        ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {showAppliedFilters ? (
                    <div className={`duration-300 ease-in-out h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${showAppliedFilters ? "w-100" : "w-0"}`}>
                        <div className="p-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Applied Filters</h3>
                                <button
                                    onClick={() => setShowAppliedFilters(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Activity Stats Section */}
                            {/* <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Lead Activity</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Calls</span>
                                        </div>
                                        <span className="font-medium text-gray-800 dark:text-white">{leadStats.calls}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Messages</span>
                                        </div>
                                        <span className="font-medium text-gray-800 dark:text-white">{leadStats.messages}</span>
                                    </div>
                                </div>
                            </div> */}

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Lead Details ({appliedFiltersCount})
                                    </h4>

                                    {filters.search && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">SEARCH</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white">{filters.search}</p>
                                        </div>
                                    )}

                                    {filters.status && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">STATUS</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">{filters.status}</p>
                                        </div>
                                    )}

                                    {filters.source && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">SOURCE</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                                                {filters.source.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                    )}

                                    {filters.assignedCounselor && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">COUNSELOR REFERRED TO</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                {getCounselorName(filters.assignedCounselor)}
                                            </p>
                                        </div>
                                    )}

                                    {filters.coursePreference && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">COURSE PREFERENCE</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white">{filters.coursePreference}</p>
                                        </div>
                                    )}

                                    {filters.countryOfResidence && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">COUNTRY OF RESIDENCE</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white">{filters.countryOfResidence}</p>
                                        </div>
                                    )}

                                    {filters.dateRange && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">DATE FILTERS (1)</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                FROM ADDED ON
                                            </p>
                                            <p className="text-sm text-gray-800 dark:text-white mt-1">
                                                {formatDateRangeDisplay()}
                                            </p>
                                        </div>
                                    )}

                                    {appliedFiltersCount === 0 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                            No filters applied
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={resetFilters}
                                    className="w-full rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>

                        {showAppliedFilters && (
                            <div
                                className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                                onClick={() => setShowAppliedFilters(false)}
                            />
                        )}
                    </div>) : ""}
            </div>
            <LeadModal isOpen={isOpen} closeModal={closeModal} selectedLead={selectedLead} handleAddNote={handleAddNote} newNote={newNote} setNewNote={setNewNote} user={user} getStatusColor={getStatusColor} />

            <CreateLeadForm editModalOpen={editModalOpen} setEditModalOpen={setEditModalOpen} selectedLead={selectedLead} handleCreateLead={handleCreateLead} handleSaveLead={handleSaveLead} formData={formData} setFormData={setFormData} handleChange={handleChange} errors={errors} setErrors={setErrors} user={user} allCounselors={allCounselors} />

            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedLead && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirm Deletion</h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete lead <strong>{selectedLead.fullName}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="px-2">
                            <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            <p>Deleting this lead will permanently remove all associated data.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="primary" onClick={deleteLead}>
                                Delete Lead
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isCallModalOpen} onClose={() => setCallModalOpen(false)} className="max-w-xl">
                {selectedLead && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirm Call</h4>
                            <p className="mb-2 text-base text-gray-500 dark:text-gray-400">
                                Are you sure you want to Call on this lead <strong>{selectedLead.fullName}</strong> ?
                            </p>
                        </div>
                        <div className="p-2">
                            <label htmlFor="customNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Or enter a custom number:
                            </label>
                            <div className="flex gap-2 mb-1">
                                <input
                                    id="customNumber"
                                    type="tel"
                                    placeholder="Enter phone number"
                                    className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    onChange={(e) => {
                                        setCustomNumber(e.target.value);
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => {
                                        callNow(customNumber);
                                        setCallModalOpen(false);
                                    }}
                                    className="whitespace-nowrap"
                                >
                                    <PhoneCall className="h-4 w-4 mr-1" />
                                    Call
                                </Button>
                            </div>
                        </div>
                        <div className="">
                            <div className="rounded-md border border-red-50 p-2 dark:bg-red-900/20">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-base font-medium text-red-800 dark:text-red-200">Warning</h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            <p>By this action you can call on this lead. before continuing, please ensure that the phone number by that you are calling is ready to receive calls.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <img className="h-30 w-70 object-contain" src="https://cdn-icons-gif.flaticon.com/17576/17576940.gif" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="primary" onClick={() => { callNow(); setCallModalOpen(false) }}>
                                Call Now
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCallModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )
                }
            </Modal >
            <ActivityLogsModal
                isOpen={activityModalOpen}
                onClose={() => setActivityModalOpen(false)}
                leadId={selectedLeadForActivity?._id}
                leadName={selectedLeadForActivity?.fullName}
            />
        </div >
    );
}

function LeadModal({ isOpen, closeModal, selectedLead, handleAddNote, newNote, setNewNote, user, getStatusColor }: any) {
    return (
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
            <div className=" relative w-full max-w-[700px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Lead Details</h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Detailed information about this lead
                    </p>
                </div>
                {selectedLead && (
                    <div className="space-y-6 px-2 max-h-[60vh] overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div>
                                <p className="text-sm text-gray-500">Full Name</p>
                                <p className="text-sm font-medium text-gray-800 capitalize dark:text-white">{selectedLead.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Country</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.countryOfResidence || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.phone || "—"} </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">City</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.city || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Course Preference</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.coursePreference}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Intended Intake</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                    {selectedLead.intendedIntake
                                        ? selectedLead.intendedIntake
                                        : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(selectedLead.status)}`}>
                                    {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                                </span>
                            </div>
                            {user.role && user.role === "admin" && <div>
                                <p className="text-sm text-gray-500">Source</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                                    {selectedLead.source.replace(/_/g, " ")}
                                </p>
                            </div>}
                            {user.role && user.role === "admin" && <div className="md:col-span-1">
                                <p className="text-sm text-gray-500">Assigned Counselor</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                    {selectedLead.assignedCounselor?.name || selectedLead.assignedCounselor?.email || "Unassigned"}
                                </p>
                            </div>}
                            <div className="col-span-3">
                                <p className="text-sm text-gray-500">Extra Details</p>
                                <div className="mt-1 text-sm text-gray-800 dark:text-white font-medium">
                                    {selectedLead.extraDetails && typeof selectedLead.extraDetails === "object" ? (
                                        Object.entries(selectedLead.extraDetails).map(([key, value]) => (
                                            <div key={key} className="flex items-start mb-1">
                                                <span className="font-medium text-gray-600 mr-1 dark:text-gray-400">
                                                    {key.replace(/_/g, ' ').replace(/\?/g, '').replace(/\b\w/g, c => c.toUpperCase())}:
                                                </span>
                                                <span className="text-sm text-gray-800 dark:text-white font-medium">{String(value)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <span>{selectedLead.extraDetails || "N/A"}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedLead.notes && selectedLead.notes.length > 0 && (
                            <div>
                                <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">Notes</h6>
                                <div className="space-y-3">
                                    {selectedLead.notes.map((note, i) => (
                                        <div key={i} className="border-l-4 border-indigo-500 pl-3 py-1">
                                            <p className="text-sm text-gray-800 dark:text-white">{note.text}</p>
                                            <p className="text-xs text-gray-500">
                                                by {note.createdBy === user._id ? "You" : note.createdBy == selectedLead.assignedCounselor?._id ? "Counselor" : "Admin"} •{" "}
                                                {moment(note.createdAt).format("MMM D, YYYY h:mm A")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mt-2">
                            <Label>Add Note</Label>
                            <TextArea
                                value={newNote}
                                onChange={setNewNote}
                                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                placeholder="Type your note here..."
                            />
                            <button
                                onClick={handleAddNote}
                                className="mt-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                                disabled={!newNote.trim()}
                            >
                                Add Note
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button size="sm" variant="outline" onClick={closeModal}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    )
}


function CreateLeadForm({ editModalOpen, setEditModalOpen, selectedLead, handleCreateLead, handleSaveLead, formData, setFormData, handleChange, errors, setErrors, user, allCounselors }: any) {
    return (
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        {selectedLead ? "Edit Lead" : "Add New Lead"}
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        {selectedLead ? "Update lead information" : "Enter new lead details"}
                    </p>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        selectedLead ? handleSaveLead() : handleCreateLead();
                    }}
                    className="px-2"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label>Full Name *</Label>
                                <Input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g. John Doe"
                                />
                                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                            </div>
                            {user.role != "counselor" && <>
                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </>}
                            <div>
                                <Label>Country of Residence</Label>
                                <Input
                                    type="text"
                                    name="countryOfResidence"
                                    value={formData.countryOfResidence}
                                    onChange={handleChange}
                                    placeholder="e.g. India"
                                />
                            </div>
                            <div>
                                <Label>Course Preference *</Label>
                                <Input
                                    type="text"
                                    name="coursePreference"
                                    value={formData.coursePreference}
                                    onChange={handleChange}
                                    placeholder="e.g. MBA, Data Science"
                                />
                                {errors.coursePreference && (
                                    <p className="mt-1 text-sm text-red-600">{errors.coursePreference}</p>
                                )}
                            </div>
                            <div>
                                <Label>Intended Intake</Label>
                                <Input
                                    type="text"
                                    name="intendedIntake"
                                    value={formData.intendedIntake}
                                    onChange={handleChange}
                                />
                                {errors.intendedIntake && (
                                    <p className="mt-1 text-sm text-red-600">{errors.intendedIntake}</p>
                                )}
                            </div>
                            <div>
                                <Label>Status *</Label>
                                <Select
                                    name="status"
                                    defaultValue={formData.status}
                                    options={Object.entries(LeadStatus).map(([value, label]) => ({
                                        value,
                                        label
                                    }))}
                                    onChange={(value) => setFormData((prev: any) => ({ ...prev, status: value }))}
                                />
                            </div>
                            {user.role && user.role === "admin" && <div>
                                <Label>Source *</Label>
                                <Select
                                    name="source"
                                    defaultValue={formData.source}
                                    options={LeadSources.map((s) => ({
                                        value: s,
                                        label: s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                                    }))}
                                    onChange={(value) => setFormData((prev) => ({ ...prev, source: value }))}
                                />
                                {errors.source && <p className="mt-1 text-sm text-red-600">{errors.source}</p>}
                            </div>}
                            {user.role && user.role === "admin" && <div className="md:col-span-2">
                                <Label>Assigned Counselor</Label>
                                <Select
                                    name="assignedCounselor"
                                    defaultValue={formData.assignedCounselor}
                                    options={allCounselors.map((c) => ({
                                        value: c._id,
                                        label: c.name || c.email
                                    }))}
                                    onChange={(value) => setFormData((prev) => ({ ...prev, assignedCounselor: value }))}
                                />
                            </div>}
                        </div>
                    </div>
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
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {selectedLead ? "Save Changes" : "Create Lead"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    )
}
