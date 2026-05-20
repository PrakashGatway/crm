import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, X, RefreshCw, Loader2, Clock, CheckCircle, 
  AlertCircle, StopCircle, ChevronDown, ChevronUp, History, 
  GitBranch, Zap, FileText, MessageCircle, Phone, 
  ArrowRight, Calendar, User, Settings, Activity
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../axiosInstance";

const ExecutionStatus = {
    RUNNING: { label: "Running", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: RefreshCw },
    PAUSED: { label: "Paused", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Pause },
    COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle },
    FAILED: { label: "Failed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: AlertCircle },
    CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300", icon: StopCircle },
    WAITING: { label: "Waiting", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", icon: Clock },
};

const ActionTypeIcons = {
    "WAIT": Clock,
    "SEND_WHATSAPP": MessageCircle,
    "CALL_NOW": Phone,
    "MOVE_PIPELINE": GitBranch,
    "CONDITION": Activity,
    "ACTION": Zap,
};

const getActionIcon = (actionType) => {
    const Icon = ActionTypeIcons[actionType] || FileText;
    return Icon;
};

export default function AutomationExecutionModal({ isOpen, onClose, leadId, leadName, onExecutionComplete }) {
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [executingAutomation, setExecutingAutomation] = useState(null);
    const [selectedAutomationId, setSelectedAutomationId] = useState("");
    const [availableAutomations, setAvailableAutomations] = useState([]);
    const [loadingAutomations, setLoadingAutomations] = useState(false);
    const [expandedExecution, setExpandedExecution] = useState(null);
    const [expandedHistory, setExpandedHistory] = useState({});

    // Fetch available automations for this lead
    const fetchAvailableAutomations = async () => {
        if (!leadId) return;

        setLoadingAutomations(true);
        try {
            const response = await api.get(`/automations?limit=100`);
            setAvailableAutomations(response.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch automations:", error);
            toast.error(error.response?.data?.message || "Failed to fetch available automations");
        } finally {
            setLoadingAutomations(false);
        }
    };

    // Fetch execution history for this lead
    const fetchExecutions = async () => {
        if (!leadId) return;

        setLoading(true);
        try {
            const response = await api.get(`/automation/${leadId}`);
            setExecutions(response.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch executions:", error);
            toast.error(error?.message || "Failed to fetch execution history");
        } finally {
            setLoading(false);
        }
    };

    // Start automation execution
    const handleStartAutomation = async () => {
        if (!selectedAutomationId) {
            toast.warn("Please select an automation to execute");
            return;
        }

        setExecutingAutomation(selectedAutomationId);
        try {
            const response = await api.post("/automation/start", {
                leadId,
                automationId: selectedAutomationId
            });
            if (response.data?.data?.success) {
                toast.success("Automation started successfully");
                await fetchExecutions();
                setSelectedAutomationId("");
            } else {
                toast.error(response.data?.data?.error || "Failed to start automation");
            }

        } catch (error) {
            console.error("Failed to start automation:", error);
            toast.error(error?.error || "Failed to start automation");
        } finally {
            setExecutingAutomation(null);
        }
    };

    // Pause automation
    const handlePause = async (executionId) => {
        try {
            await api.get(`/automation/pause/${executionId}`);
            toast.success("Automation paused");
            await fetchExecutions();
        } catch (error) {
            console.error("Failed to pause automation:", error);
            toast.error(error.response?.data?.error || "Failed to pause automation");
        }
    };

    // Resume automation
    const handleResume = async (executionId) => {
        try {
            await api.get(`/automation/resume/${executionId}`);
            toast.success("Automation resumed");
            await fetchExecutions();
        } catch (error) {
            console.error("Failed to resume automation:", error);
            toast.error(error.response?.data?.error || "Failed to resume automation");
        }
    };

    // Cancel automation
    const handleCancel = async (executionId) => {
        if (!window.confirm("Are you sure you want to cancel this automation?")) return;

        try {
            await api.get(`/automation/cancel/${executionId}`);
            toast.success("Automation cancelled");
            await fetchExecutions();
        } catch (error) {
            console.error("Failed to cancel automation:", error);
            toast.error(error.response?.data?.error || "Failed to cancel automation");
        }
    };

    useEffect(() => {
        if (isOpen && leadId) {
            fetchExecutions();
            fetchAvailableAutomations();
        }
    }, [isOpen, leadId]);

    const getStatusConfig = (status) => {
        return ExecutionStatus[status] || ExecutionStatus.RUNNING;
    };

    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleString();
    };

    const formatDuration = (start, end) => {
        if (!start) return "—";
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();
        const durationMs = endTime - startTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    const toggleExecutionExpand = (executionId) => {
        setExpandedExecution(expandedExecution === executionId ? null : executionId);
    };

    const toggleHistoryExpand = (executionId) => {
        setExpandedHistory(prev => ({
            ...prev,
            [executionId]: !prev[executionId]
        }));
    };

    const getStepName = (automation, stepId) => {
        const step = automation?.steps?.find(s => s.stepId === stepId);
        return step?.name || stepId;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-100"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl z-100"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-indigo-600" />
                                        Automation Execution
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="h-3 w-3 text-gray-400" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Lead: <span className="font-medium text-gray-700 dark:text-gray-300">{leadName || "—"}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {/* Start New Automation */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-900 rounded-xl p-4 border border-indigo-100 dark:border-gray-700">
                                    <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                        <Play className="h-4 w-4 text-indigo-600" />
                                        Start New Automation
                                    </h3>

                                    {loadingAutomations ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                            <span className="ml-2 text-sm text-gray-500">Loading automations...</span>
                                        </div>
                                    ) : availableAutomations.length === 0 ? (
                                        <div className="text-center py-6">
                                            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">No automations available for this lead</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <select
                                                value={selectedAutomationId}
                                                onChange={(e) => setSelectedAutomationId(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            >
                                                <option value="">Select an automation...</option>
                                                {availableAutomations.map((auto) => (
                                                    <option key={auto._id} value={auto._id}>
                                                        {auto.name} {auto.description && `- ${auto.description}`}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                onClick={handleStartAutomation}
                                                disabled={!selectedAutomationId || executingAutomation}
                                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {executingAutomation ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Starting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-4 w-4" />
                                                        Start Automation
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Execution History */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                        <History className="h-4 w-4 text-indigo-600" />
                                        Execution History
                                        <span className="text-xs text-gray-500 font-normal">
                                            ({executions.length} executions)
                                        </span>
                                    </h3>

                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                        </div>
                                    ) : executions.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm text-gray-500">No automation executions found</p>
                                            <p className="text-xs text-gray-400 mt-1">Start a new automation to see history</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {executions.map((execution) => {
                                                const statusConfig = getStatusConfig(execution.status);
                                                const StatusIcon = statusConfig.icon;
                                                const isExpanded = expandedExecution === execution._id;
                                                const isHistoryExpanded = expandedHistory[execution._id];

                                                return (
                                                    <div
                                                        key={execution._id}
                                                        className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
                                                    >
                                                        {/* Execution Header */}
                                                        <div 
                                                            className="p-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                                                            onClick={() => toggleExecutionExpand(execution._id)}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                        <h4 className="font-semibold text-gray-800 dark:text-white">
                                                                            {execution.automationId?.name || "Unknown Automation"}
                                                                        </h4>
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                                            <StatusIcon className="h-3 w-3" />
                                                                            {statusConfig.label}
                                                                        </span>
                                                                        {execution.status === "WAITING" && execution.nextActionAt && (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                                                                <Clock className="h-3 w-3" />
                                                                                Next: {formatDate(execution.nextActionAt)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                                        <div className="flex items-center gap-1 text-gray-500">
                                                                            <Calendar className="h-3 w-3" />
                                                                            <span>Started: {formatDate(execution.startedAt || execution.createdAt)}</span>
                                                                        </div>
                                                                        {execution.completedAt && (
                                                                            <div className="flex items-center gap-1 text-gray-500">
                                                                                <CheckCircle className="h-3 w-3" />
                                                                                <span>Completed: {formatDate(execution.completedAt)}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1 text-gray-500">
                                                                            <Clock className="h-3 w-3" />
                                                                            <span>Duration: {formatDuration(execution.startedAt || execution.createdAt, execution.completedAt)}</span>
                                                                        </div>
                                                                        {execution.currentStepId && (
                                                                            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                                                                <GitBranch className="h-3 w-3" />
                                                                                <span>Step: {getStepName(execution.automationId, execution.currentStepId)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 ml-4">
                                                                    <div className="flex gap-1">
                                                                        {execution.status === "RUNNING" && (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handlePause(execution._id);
                                                                                    }}
                                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                                                    title="Pause"
                                                                                >
                                                                                    <Pause className="h-4 w-4 text-yellow-600" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleCancel(execution._id);
                                                                                    }}
                                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                                                    title="Cancel"
                                                                                >
                                                                                    <StopCircle className="h-4 w-4 text-red-600" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {execution.status === "PAUSED" && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleResume(execution._id);
                                                                                }}
                                                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                                                title="Resume"
                                                                            >
                                                                                <Play className="h-4 w-4 text-green-600" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {isExpanded ? (
                                                                        <ChevronUp className="h-5 w-5 text-gray-400" />
                                                                    ) : (
                                                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            {execution.status === "RUNNING" && execution.totalSteps > 0 && (
                                                                <div className="mt-3">
                                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                                        <span>Progress</span>
                                                                        <span>{execution.currentStep || 0} / {execution.totalSteps} steps</span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                                                        <div
                                                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                                                                            style={{
                                                                                width: `${((execution.currentStep || 0) / execution.totalSteps) * 100}%`
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Expanded Details */}
                                                        {isExpanded && (
                                                            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
                                                                {/* Automation Details */}
                                                                {execution.automationId && (
                                                                    <div>
                                                                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                                            <FileText className="h-4 w-4" />
                                                                            Automation Details
                                                                        </h5>
                                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
                                                                            <p><span className="font-medium text-gray-600">Name:</span> {execution.automationId.name}</p>
                                                                            {execution.automationId.description && (
                                                                                <p><span className="font-medium text-gray-600">Description:</span> {execution.automationId.description}</p>
                                                                            )}
                                                                            <p><span className="font-medium text-gray-600">Category:</span> {execution.automationId.category}</p>
                                                                            <p><span className="font-medium text-gray-600">Status:</span> {execution.automationId.status}</p>
                                                                            <p><span className="font-medium text-gray-600">Total Steps:</span> {execution.automationId.steps?.length || 0}</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Execution Context */}
                                                                {execution.context && (
                                                                    <div>
                                                                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                                            <Settings className="h-4 w-4" />
                                                                            Execution Context
                                                                        </h5>
                                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-1 text-sm">
                                                                            <p><span className="font-medium text-gray-600">Attempts:</span> {execution.context.attempts || 0}</p>
                                                                            {execution.context.lastReply && (
                                                                                <p><span className="font-medium text-gray-600">Last Reply:</span> {execution.context.lastReply}</p>
                                                                            )}
                                                                            {execution.currentActionIndex !== undefined && (
                                                                                <p><span className="font-medium text-gray-600">Current Action Index:</span> {execution.currentActionIndex}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Error Message */}
                                                                {execution.error && (
                                                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                                                        <div className="flex items-start gap-2">
                                                                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                                                            <div>
                                                                                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                                                                                <p className="text-sm text-red-700 dark:text-red-300">{execution.error}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Execution History Timeline */}
                                                                {execution.history && execution.history.length > 0 && (
                                                                    <div>
                                                                        <button
                                                                            onClick={() => toggleHistoryExpand(execution._id)}
                                                                            className="w-full flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                                        >
                                                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                                                <History className="h-4 w-4" />
                                                                                Execution Timeline ({execution.history.length} actions)
                                                                            </span>
                                                                            {isHistoryExpanded ? (
                                                                                <ChevronUp className="h-4 w-4" />
                                                                            ) : (
                                                                                <ChevronDown className="h-4 w-4" />
                                                                            )}
                                                                        </button>
                                                                        
                                                                        {isHistoryExpanded && (
                                                                            <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                                                                                {execution.history.map((item, index) => {
                                                                                    const ActionIcon = getActionIcon(item.action);
                                                                                    return (
                                                                                        <div key={item._id || index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-indigo-500">
                                                                                            <div className="flex items-start justify-between">
                                                                                                <div className="flex-1">
                                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                                        <ActionIcon className="h-4 w-4 text-indigo-600" />
                                                                                                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                                                                                                            {item.action}
                                                                                                        </span>
                                                                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                                                                            item.status === "SUCCESS" 
                                                                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                                                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                                                                        }`}>
                                                                                                            {item.status}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div className="text-xs text-gray-500">
                                                                                                        Step: {getStepName(execution.automationId, item.stepId)}
                                                                                                    </div>
                                                                                                    {item.message && (
                                                                                                        <div className="text-xs text-gray-600 mt-1">
                                                                                                            {item.message}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="text-xs text-gray-400">
                                                                                                    {formatDate(item.executedAt)}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <button
                                    onClick={onClose}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}