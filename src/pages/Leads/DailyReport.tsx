import { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import {
    Calendar,
    Phone,
    PhoneIncomingIcon,
    PhoneOutgoingIcon,
    Users,
    Download,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Clock,
    CheckCircle,
    XCircle,
    Play
} from "lucide-react";
import { useAuth } from "../../context/UserContext";

export default function DailyReport() {
    const { user } = useAuth();
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
    const [stats, setStats] = useState({
        totalCalls: 0,
        answeredCalls: 0,
        missedCalls: 0,
        inboundCalls: 0,
        outboundCalls: 0,
        totalDuration: 0,
        uniqueLeads: 0,
        uniqueCounselors: 0
    });
    const [counselorStats, setCounselorStats] = useState([]);
    const [filters, setFilters] = useState({
        counselorId: "",
        callType: "",
        status: "",
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);
    const [callDetailModal, setCallDetailModal] = useState(false);
    const [allCounselors, setAllCounselors] = useState([]);
    const [playingRecording, setPlayingRecording] = useState(null);

    // Fetch counselors on mount
    useEffect(() => {
        fetchCounselors();
    }, []);

    // Fetch report when date or filters change
    useEffect(() => {
        fetchDailyReport();
    }, [selectedDate, filters.counselorId, filters.page, filters.limit,filters.status]);

    const fetchCounselors = async () => {
        try {
            const res = await api.get("/users?role=counselor");
            setAllCounselors(res.data?.users || []);
        } catch (error) {
            console.error("Failed to fetch counselors:", error);
        }
    };

    const fetchDailyReport = async () => {
        setLoading(true);
        try {
            // Convert single date to startDate/endDate range for backend
            const startDate = moment(selectedDate).startOf('day').toISOString();
            const endDate = moment(selectedDate).endOf('day').toISOString();

            const params = {
                startDate,
                endDate,
                page: filters.page,
                limit: filters.limit,
                sort: "-createdAt",
                ...(filters.counselorId && { counselorId: filters.counselorId })
                // Note: callType & status filtering handled client-side since backend doesn't support them yet
            };

            const response = await api.get("/leads/reports/calls", { params });

            if (response.data?.success) {
                const data = response.data.data || [];

                // Apply client-side filters for callType and status
                let filteredData = [...data];
                if (filters.callType) {
                    filteredData = filteredData.filter(call =>
                        call.extraDetails?.Direction === filters.callType
                    );
                }
                if (filters.status) {
                    filteredData = filteredData.filter(call => call.status === filters.status);
                }

                setCalls(filteredData);

                // Calculate stats from filtered data
                calculateStats(filteredData);

                // setPagination(response.data.pagination || {
                //   page: 1,
                //   limit: 20,
                //   total: 0,
                //   totalPages: 0
                // });
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || "Failed to fetch daily report");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const totalCalls = data.length;
        const answeredCalls = data.filter(c => c.status === "Answer").length;
        const missedCalls = data.filter(c => c.status === "Missed").length;
        const inboundCalls = data.filter(c => c.extraDetails?.Direction === "In").length;
        const outboundCalls = data.filter(c => c.extraDetails?.Direction === "Out").length;
        const totalDuration = data.reduce((sum, c) => sum + (c.duration || 0), 0);
        const uniqueLeads = new Set(data.map(c => c.lead?.id)).size;
        const uniqueCounselors = new Set(data.map(c => c.counselor?.id)).size;

        setStats({
            totalCalls,
            answeredCalls,
            missedCalls,
            inboundCalls,
            outboundCalls,
            totalDuration,
            uniqueLeads,
            uniqueCounselors
        });

        // Calculate counselor stats
        const counselorMap = {};
        data.forEach(call => {
            const cId = call.counselor?.id || "unknown";
            if (!counselorMap[cId]) {
                counselorMap[cId] = {
                    counselorName: call.counselor?.name || "Unknown",
                    total: 0,
                    answered: 0,
                    missed: 0,
                    totalDuration: 0
                };
            }
            counselorMap[cId].total++;
            if (call.status === "Answer") counselorMap[cId].answered++;
            if (call.status === "Missed") counselorMap[cId].missed++;
            counselorMap[cId].totalDuration += call.duration || 0;
        });
        setCounselorStats(Object.values(counselorMap));
    };

    const handleDateChange = (days) => {
        const newDate = moment(selectedDate).add(days, 'days').format("YYYY-MM-DD");
        setSelectedDate(newDate);
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            counselorId: "",
            callType: "",
            status: "",
            page: 1,
            limit: 20
        });
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const formatDuration = (seconds) => {
        if (!seconds && seconds !== 0) return "0s";
        const secs = Math.floor(seconds);
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        if (mins > 0) {
            return `${mins}m ${remainingSecs.toString().padStart(2, '0')}s`;
        }
        return `${remainingSecs}s`;
    };

    const getCallTypeIcon = (direction) => {
        if (direction === "In") {
            return <PhoneIncomingIcon className="h-4 w-4 text-green-600" />;
        }
        return <PhoneOutgoingIcon className="h-4 w-4 text-blue-600" />;
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            Answer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            Missed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            // Busy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            // Failed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        };

        const statusIcons = {
            Answer: <CheckCircle className="h-3 w-3 mr-1" />,
            Missed: <XCircle className="h-3 w-3 mr-1" />,
            Busy: <Clock className="h-3 w-3 mr-1" />
        };

        return (
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusClasses[status] || statusClasses.Failed}`}>
                {statusIcons[status]}
                {status}
            </span>
        );
    };

    const getCounselorName = (counselor) => {
        if (!counselor) return "—";
        return counselor.name || "Unknown";
    };

    const getLeadName = (lead) => {
        if (!lead) return "—";
        return lead.name || lead.fullName || "Unknown";
    };

    const exportToCSV = () => {
        if (calls.length === 0) {
            toast.info("No data to export");
            return;
        }

        const csvData = calls.map(call => ({
            'Time': call.ivrSTime ? moment(call.ivrSTime).format('YYYY-MM-DD HH:mm:ss') : '',
            'Type': call.extraDetails?.Direction === 'In' ? 'Inbound' : 'Outbound',
            'Status': call.status,
            'Duration': formatDuration(call.duration),
            'Phone': call.phone || '',
            'Lead Name': getLeadName(call.lead),
            'Lead Email': call.lead?.email || '',
            'Counselor': getCounselorName(call.counselor),
            'Master Number': call.masterCallNumber || '',
            'Recording': call.recordingData || ''
        }));

        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row =>
            Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
        );

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-report-${selectedDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Report exported successfully");
    };

    const viewCallDetails = (call) => {
        setSelectedCall(call);
        setCallDetailModal(true);
    };

    const toggleRecording = (callId, e) => {
        e.stopPropagation();
        setPlayingRecording(playingRecording === callId ? null : callId);
    };

    const getAppliedFiltersCount = () => {
        let count = 0;
        if (filters.counselorId) count++;
        if (filters.callType) count++;
        if (filters.status) count++;
        return count;
    };

    return (
        <div className="w-full overflow-x-auto">
            {/* Header */}
            <div className="p-2 px-3 border border-gray-200 rounded-2xl dark:border-gray-800 mb-2 bg-white dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col items-center w-full gap-4 md:flex-row">

                        <div className="order-3 xl:order-2">
                            <h4 className="text-lg font-semibold text-center text-gray-800 dark:text-white/90 md:text-left">
                                Daily Call Report
                            </h4>

                        </div>
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <button
                                onClick={() => handleDateChange(-1)}
                                className="p-2 rounded-l-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                aria-label="Previous day"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setFilters(prev => ({ ...prev, page: 1 }));
                                }}
                                className="px-2 py-1 bg-transparent border-x border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                                max={moment().format("YYYY-MM-DD")}
                            />
                            <button
                                onClick={() => handleDateChange(1)}
                                disabled={selectedDate === moment().format("YYYY-MM-DD")}
                                className="p-2 rounded-r-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Next day"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedDate(moment().format("YYYY-MM-DD"));
                                setFilters(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Today
                        </button>
                        {/* <button
                            onClick={exportToCSV}
                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            title="Export to CSV"
                        >
                            <Download className="h-4 w-4" />
                        </button> */}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Calls</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalCalls}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                            <Phone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-green-600 dark:text-green-400">{stats.answeredCalls} answered</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-red-600 dark:text-red-400">{stats.missedCalls} missed</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Call Distribution</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalCalls}</p>
                        </div>
                        <div className="flex gap-1">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full" title="Inbound">
                                <PhoneIncomingIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full" title="Outbound">
                                <PhoneOutgoingIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-green-600 dark:text-green-400">{stats.inboundCalls} Inbound</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-blue-600 dark:text-blue-400">{stats.outboundCalls} Outbound</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Duration</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {formatDuration(stats.totalDuration)}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Avg: {stats.totalCalls ? formatDuration(Math.round(stats.totalDuration / stats.totalCalls)) : '0s'} per call
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Unique</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {stats.uniqueLeads} / {stats.uniqueCounselors}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Leads / Counselors
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex justify-center duration-300 ease-in-out w-full gap-1">
                <div className="min-h-[70vh] overflow-x-auto duration-500 ease-in-out rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-800 xl:px-4 xl:py-4 w-full">

                    {/* Filters Bar */}
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Counselor</label>
                            <select
                                name="counselorId"
                                value={filters.counselorId}
                                onChange={handleFilterChange}
                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Counselors</option>
                                {allCounselors.map(c => (
                                    <option key={c._id} value={c._id}>{c.name || c.email}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="Answer">Answered</option>
                                <option value="Missed">Missed</option>
                                <option value="Busy">Busy</option>
                                <option value="Failed">Failed</option>
                            </select>
                        </div>
                        {/* <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show:
              </label>
              <select
                name="limit"
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                className="rounded-md border border-gray-300 bg-white py-1.5 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div> */}

                        {/* <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters {getAppliedFiltersCount() > 0 && <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-1.5 py-0.5 rounded-full text-xs">{getAppliedFiltersCount()}</span>}
              </button>
            </div> */}
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Calls</h6>
                                <button
                                    onClick={resetFilters}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    Reset All
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Counselor</label>
                                    <select
                                        name="counselorId"
                                        value={filters.counselorId}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">All Counselors</option>
                                        {allCounselors.map(c => (
                                            <option key={c._id} value={c._id}>{c.name || c.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Call Type</label>
                                    <select
                                        name="callType"
                                        value={filters.callType}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">All Types</option>
                                        <option value="In">Inbound</option>
                                        <option value="Out">Outbound</option>
                                    </select>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Calls Table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                            </div>
                        ) : calls.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Time</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Type</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Status</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">IVR Duration</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Phone</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Lead</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Counselor</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Recording</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800">
                                    {calls.map((call,index) => (
                                        <tr
                                            key={index || call.masterCallNumber}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900 dark:text-white">
                                                {call.ivrSTime ? moment(call.ivrSTime).format("hh:mm:ss A") : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    {getCallTypeIcon(call.extraDetails?.Direction)}
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {call.extraDetails?.Direction === "In" ? "Inbound" : "Outbound"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3">
                                                {getStatusBadge(call.status)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                                                { formatDuration(call.duration)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {call.phone || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {getLeadName(call.lead)}
                                                    </div>
                                                    {call.lead?.status && (
                                                        <span className="text-sm text-gray-500 p-0 rounded-full px-3 border-2 border-gray-600 shadow dark:text-gray-400 capitalize">
                                                            {call.lead.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {getCounselorName(call.counselor)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3">
                                                {call.recordingData ? (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => toggleRecording(call._id || call.masterCallNumber, e)}
                                                            className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                                            title={playingRecording === (call._id || call.masterCallNumber) ? "Pause" : "Play"}
                                                        >
                                                            {playingRecording === (call._id || call.masterCallNumber) ? (
                                                                ""
                                                            ) : (
                                                                <Play className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                        {playingRecording === (call._id || call.masterCallNumber) && (
                                                            <audio
                                                                key={call._id || call.masterCallNumber}
                                                                controls
                                                                autoPlay
                                                                className="h-8 w-50"
                                                                onEnded={() => setPlayingRecording(null)}
                                                            >
                                                                <source src={call.recordingData} type="audio/mpeg" />
                                                                Your browser does not support audio.
                                                            </audio>
                                                        )}

                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">No recording</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm font-medium">
                                                <button
                                                    onClick={() => viewCallDetails(call)}
                                                    className="text-indigo-600 border-2 p-1 rounded-full px-2 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                                <Phone className="h-12 w-12 mb-3 opacity-50" />
                                <p className="text-lg font-medium">No calls found</p>
                                <p className="text-sm">Try adjusting your filters or select a different date</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {(pagination.page - 1) * filters.limit + 1} to {Math.min(pagination.page * filters.limit, pagination.total)} of {pagination.total} results
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${pagination.page === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                        }`}
                                >
                                    Previous
                                </button>

                                {/* Page numbers with ellipsis */}
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(pageNum => {
                                        const currentPage = pagination.page;
                                        return pageNum === 1 || pageNum === pagination.totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                                    })
                                    .reduce((acc, pageNum, idx, arr) => {
                                        if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                                            acc.push('...');
                                        }
                                        acc.push(pageNum);
                                        return acc;
                                    }, [])
                                    .map((pageNum, idx) => (
                                        pageNum === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="px-3 py-1.5 text-gray-400">...</span>
                                        ) : (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${pagination.page === pageNum
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    ))}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${pagination.page === pagination.totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Call Details Modal */}
            <Modal isOpen={callDetailModal} onClose={() => setCallDetailModal(false)} className="max-w-2xl overflow-hidden">
                {selectedCall && (
                    <div className="max-h-[80vh] relative w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Call Details</h3>
                            <button
                                onClick={() => setCallDetailModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Call Time</p>
                                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                                        {selectedCall.ivrSTime ? moment(selectedCall.ivrSTime).format("MMM D, YYYY h:mm:ss A") : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Duration</p>
                                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                                        {formatDuration(selectedCall.duration)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Call Type</p>
                                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white flex items-center gap-1.5">
                                        {getCallTypeIcon(selectedCall.extraDetails?.Direction)}
                                        <span>{selectedCall.extraDetails?.Direction === "In" ? "Inbound" : "Outbound"}</span>
                                        {selectedCall.extraDetails?.cType && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">({selectedCall.extraDetails.cType})</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                                    <p className="mt-1">{getStatusBadge(selectedCall.status)}</p>
                                </div>
                            </div>

                            {/* Call Information */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Call Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedCall.phone || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Master Call Number</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedCall.masterCallNumber || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Lead Information */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Lead Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Lead Name</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {getLeadName(selectedCall.lead)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Lead Status</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                                            {selectedCall.lead?.status || "—"}
                                        </p>
                                    </div>
                                    {selectedCall.lead?.email && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Lead Email</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white break-all">{selectedCall.lead.email}</p>
                                        </div>
                                    )}
                                    {selectedCall.lead?.secondaryStatus && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Secondary Status</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">{selectedCall.lead.secondaryStatus}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Counselor Information */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Counselor Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Counselor Name</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {getCounselorName(selectedCall.counselor)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Counselor ID</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedCall.counselor?.id || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedCall.extraDetails?.notes && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                        {selectedCall.extraDetails.notes}
                                    </p>
                                </div>
                            )}

                            {/* Recording */}
                            {selectedCall.recordingData && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Call Recording</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <audio controls className="w-full" src={selectedCall.recordingData}>
                                            <source src={selectedCall.recordingData} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button size="sm" variant="outline" onClick={() => setCallDetailModal(false)}>
                                Close
                            </Button>

                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}