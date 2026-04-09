import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    X,
    TrendingUp,
    Search,
    Download,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { useAuth } from "../../context/UserContext";
import { useNavigate } from "react-router";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "—";
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${(m % 60).toString().padStart(2, "0")}m`;
    if (m > 0) return `${m}m ${(s % 60).toString().padStart(2, "0")}s`;
    return `${s}s`;
};

// Controller returns extraDetails.Direction ("In" / "Out")
const getDirection = (call) =>
    call.extraDetails?.Direction || call.callDetails?.callType || null;

// Controller returns callDetails.ivrSTime as call start time
const getCallTime = (call) =>
    call.callDetails?.ivrSTime || call.createdAt || null;

// Recording URL lives at callDetails.recordingUrl (per controller projection)
const getRecordingUrl = (call) =>
    call.callDetails?.recordingUrl || call.recordingData || null;

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }) {
    const colorMap = {
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
        green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        red: "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl dark:border-gray-700 p-5 flex items-center gap-4 hover:-md transition-">
            <div className={`p-3 rounded-xl shrink-0 ${colorMap[color] || colorMap.indigo}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">{label}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white leading-tight">{value}</p>
                {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const map = {
        Answer: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800", icon: <CheckCircle2 className="h-3 w-3" /> },
        Missed: { cls: "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800", icon: <PhoneMissed className="h-3 w-3" /> },
        Busy: { cls: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800", icon: <Clock className="h-3 w-3" /> },
        Failed: { cls: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600", icon: <XCircle className="h-3 w-3" /> },
    };
    const style = map[status] || map.Failed;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.cls}`}>
            {style.icon}{status || "Unknown"}
        </span>
    );
}

// ─── DirectionBadge ───────────────────────────────────────────────────────────

function DirectionBadge({ direction }) {
    const isIn = direction === "In";
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${isIn
            ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
            : "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800"
            }`}>
            {isIn ? <PhoneIncoming className="h-3 w-3" /> : <PhoneOutgoing className="h-3 w-3" />}
            {isIn ? "Inbound" : "Outbound"}
        </span>
    );
}

// ─── RecordingPlayer ──────────────────────────────────────────────────────────

function RecordingPlayer({ url, callId, playing, onToggle }) {
    if (!url) return <span className="text-xs text-gray-300 dark:text-gray-600 italic">No recording</span>;
    const active = playing === callId;
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(active ? null : callId); }}
                className={`p-1.5 rounded-full transition-colors ${active
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                    }`}
                title={active ? "Pause" : "Play recording"}
            >
                {active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            {active && (
                <audio key={callId} autoPlay controls className="h-7 w-48 rounded" onEnded={() => onToggle(null)}>
                    <source src={url} type="audio/mpeg" />
                </audio>
            )}
        </div>
    );
}

// ─── CallDetailModal ──────────────────────────────────────────────────────────

function Section({ title, children }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{title}</p>
            {children}
        </div>
    );
}

function DetailGrid({ rows }) {
    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {rows.map(({ label, value }) => (
                <div key={label}>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    <div className="text-sm font-medium text-gray-800 dark:text-white mt-0.5">{value ?? "—"}</div>
                </div>
            ))}
        </div>
    );
}

function CallDetailModal({ call, onClose }) {
    if (!call) return null;
    const dir = getDirection(call);
    const time = getCallTime(call);
    const recUrl = getRecordingUrl(call);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl -2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-white">Call Details</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <Section title="Call Information">
                        <DetailGrid rows={[
                            { label: "Time", value: time ? moment(time).format("MMM D, YYYY  h:mm:ss A") : "—" },
                            { label: "Duration", value: formatDuration(call.callDetails?.duration ?? call.duration) },
                            { label: "Direction", value: dir ? <DirectionBadge direction={dir} /> : "—" },
                            { label: "Status", value: <StatusBadge status={call.status} /> },
                            { label: "Phone", value: call.phone },
                            { label: "Master Call #", value: call.masterCallNumber },
                        ]} />
                    </Section>

                    <Section title="Lead">
                        <DetailGrid rows={[
                            { label: "Name", value: call.lead?.name },
                            { label: "Email", value: call.lead?.email },
                            { label: "Status", value: call.lead?.status },
                            { label: "Secondary Status", value: call.lead?.secondaryStatus },
                        ]} />
                    </Section>

                    <Section title="Counselor">
                        <DetailGrid rows={[{ label: "Name", value: call.counselor?.name }]} />
                    </Section>

                    {call.extraDetails?.notes && (
                        <Section title="Notes">
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 leading-relaxed">
                                {call.extraDetails.notes}
                            </p>
                        </Section>
                    )}

                    {recUrl && (
                        <Section title="Recording">
                            <audio controls className="w-full rounded-lg" src={recUrl}>
                                Your browser does not support audio.
                            </audio>
                        </Section>
                    )}
                </div>

                <div className="px-6 pb-5 pt-4 flex justify-end border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DailyReport() {
    const { user } = useAuth();

    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
    const [stats, setStats] = useState({ totalCalls: 0, connected: 0, missed: 0, busy: 0, failed: 0, totalDuration: 0 });
    const [counselors, setCounselors] = useState([]);
    const [filters, setFilters] = useState({ counselorId: "", status: "", search: "" });
    const [selectedCall, setSelectedCall] = useState(null);
    const [playingId, setPlayingId] = useState(null);
    const [page, setPage] = useState(1);
    const LIMIT = 20;
    const navigate = useNavigate();


    // Fetch counselor list once on mount
    useEffect(() => {
        api.get("/users?role=counselor")
            .then(res => setCounselors(res.data?.users || []))
            .catch(() => { });
    }, []);

    // Fetch daily report whenever date / filters / page change
    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = moment(selectedDate).startOf("day").toISOString();
            const endDate = moment(selectedDate).endOf("day").toISOString();
            const params = {
                startDate,
                endDate,
                page,
                limit: LIMIT,
                ...(filters.counselorId && { counselorId: filters.counselorId }),
                ...(filters.status && { status: filters.status }),
            };
            const res = await api.get("/leads/reports/calls", { params });
            if (res.data?.success) {
                setCalls(res.data.data || []);
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to fetch report");
        } finally {
            setLoading(false);
        }
    }, [selectedDate, filters.counselorId, filters.status, page]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Client-side search across phone / lead name / counselor name
    const visibleCalls = calls.filter(call => {
        if (!filters.search) return true;
        const q = filters.search.toLowerCase();
        return (
            call.phone?.includes(q) ||
            call.lead?.name?.toLowerCase().includes(q) ||
            call.counselor?.name?.toLowerCase().includes(q)
        );
    });

    const handleDateShift = (days) => {
        setSelectedDate(prev => moment(prev).add(days, "days").format("YYYY-MM-DD"));
        setPage(1);
    };

    const isToday = selectedDate === moment().format("YYYY-MM-DD");

    const exportCSV = () => {
        if (!visibleCalls.length) { toast.info("No data to export"); return; }
        const header = ["Time", "Direction", "Status", "Duration", "Phone", "Lead", "Counselor", "Master Call #"];
        const rows = visibleCalls.map(c => [
            getCallTime(c) ? moment(getCallTime(c)).format("YYYY-MM-DD HH:mm:ss") : "",
            getDirection(c) === "In" ? "Inbound" : "Outbound",
            c.status,
            formatDuration(c.callDetails?.duration ?? c.duration),
            c.phone,
            c.lead?.name || "",
            c.counselor?.name || "",
            c.masterCallNumber || "",
        ]);
        const csv = [header, ...rows]
            .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
            download: `calls-${selectedDate}.csv`,
        });
        a.click();
        toast.success("Exported successfully");
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                <StatCard icon={Phone} label="Total Calls" value={stats.totalCalls} sub={`${stats.connected || 0} connected`} color="indigo" />
                <StatCard icon={CheckCircle2} label="Connected" value={stats.connected || 0} sub={`${stats.missed || 0} missed`} color="green" />
                <StatCard icon={Clock} label="Total Duration" value={formatDuration(stats.totalDuration)} sub={stats.totalCalls ? `avg ${formatDuration(Math.round((stats.totalDuration || 0) / stats.totalCalls))}` : "—"} color="amber" />
                <StatCard icon={TrendingUp} label="Miss / Busy / Fail" value={`${stats.missed || 0} / ${stats.busy || 0} / ${stats.failed || 0}`} sub="breakdown" color="red" />
            </div>
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg overflow-hidden -sm">
                    <button onClick={() => handleDateShift(-1)} className="px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 border-r border-gray-200 dark:border-gray-700 transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <input
                        type="date"
                        value={selectedDate}
                        max={moment().format("YYYY-MM-DD")}
                        onChange={e => { setSelectedDate(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none"
                    />
                    <button onClick={() => handleDateShift(1)} disabled={isToday} className="px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 border-l border-gray-200 dark:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {!isToday && (
                    <button onClick={() => { setSelectedDate(moment().format("YYYY-MM-DD")); setPage(1); }} className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors -sm">
                        Today
                    </button>
                )}

                {/* <button onClick={exportCSV} title="Export CSV" className="p-2 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors -sm">
            <Download className="h-4 w-4" />
          </button> */}
            </div>

            {/* Table card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 -sm overflow-hidden">

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search lead, phone, counselor…"
                            value={filters.search}
                            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-200 placeholder:text-gray-400"
                        />
                    </div>

                    <select
                        value={filters.counselorId}
                        onChange={e => { setFilters(f => ({ ...f, counselorId: e.target.value })); setPage(1); }}
                        className="text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-200"
                    >
                        <option value="">All Counselors</option>
                        {counselors.map(c => (
                            <option key={c._id} value={c._id}>{c.name || c.email}</option>
                        ))}
                    </select>

                    <select
                        value={filters.status}
                        onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
                        className="text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-gray-200"
                    >
                        <option value="">All Statuses</option>
                        <option value="Answer">Answered</option>
                        <option value="Missed">Missed</option>
                        <option value="Busy">Busy</option>
                        <option value="Failed">Failed</option>
                    </select>

                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap">
                        {visibleCalls.length} call{visibleCalls.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <div className="h-7 w-7 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
                            <p className="text-sm text-gray-400">Loading calls…</p>
                        </div>
                    ) : visibleCalls.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-400 dark:text-gray-500">
                            <Phone className="h-10 w-10 opacity-30" />
                            <p className="text-sm font-medium">No calls found</p>
                            <p className="text-xs">Try adjusting filters or picking a different date</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-gray-700/30">
                                    {["Time", "Direction", "Status", "Duration", "Phone", "Lead", "Counselor", "Recording", ""].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {visibleCalls.map((call, idx) => {
                                    const dir = getDirection(call);
                                    const time = getCallTime(call);
                                    const recUrl = getRecordingUrl(call);
                                    const rowKey = call._id || call.masterCallNumber || idx;
                                    return (
                                        <tr key={rowKey} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                {time ? moment(time).format("hh:mm:ss A") : "—"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {dir ? <DirectionBadge direction={dir} /> : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge status={call.callDetails?.status} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                                                {formatDuration(call.callDetails?.duration ?? call.duration)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {call.phone || "—"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white leading-tight">{call.lead?.name || "—"}</p>
                                                {call.lead?.status && (
                                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize mt-0.5">{call.lead.status}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {call.counselor?.name || "—"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <audio key={recUrl} controls className="h-7 w-48 rounded" >
                                                    <source src={recUrl} type="audio/mpeg" />
                                                </audio>
                                                {/* <RecordingPlayer url={recUrl} callId={rowKey} playing={playingId} onToggle={setPlayingId} /> */}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => navigate(`/leads?q=${call.lead?.phone10 || call.lead?.phone || ""}&name=${call.lead?.fullName || ""}&lead=${call.lead?.id}`)}
                                                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition-opacity"
                                                >
                                                    Details →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination — show only when a full page came back */}
                {!loading && calls.length === LIMIT && (
                    <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" /> Prev
                        </button>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Page {page}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Detail modal */}
            <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />
        </div>
    );
}