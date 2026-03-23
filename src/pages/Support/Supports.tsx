import { useState, useEffect } from "react";
import moment from "moment";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import { MessageSquare, Plus, Search, Clock, AlertCircle, CheckCircle, XCircle, ArrowLeft, Send, ChevronDown } from 'lucide-react';
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import * as Select from "@radix-ui/react-select";
import TextToSpeechSimple from "./Speaking";

interface SelectFieldProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ value, onChange, options, placeholder }) => {
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <Select.Trigger className="inline-flex items-center justify-between w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 data-[placeholder]:text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200">
                <Select.Value placeholder={placeholder || "Select option"} />
                <Select.Icon asChild>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className="overflow-hidden bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg z-50" position="popper" sideOffset={5}>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        <Select.Viewport className="p-1">
                            {options.map((option) => (
                                <Select.Item key={option.value} value={option.value} className="relative flex items-center h-8 px-8 rounded select-none text-sm outline-none data-[highlighted]:bg-indigo-500 data-[highlighted]:text-white dark:data-[highlighted]:bg-indigo-600 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 cursor-pointer transition-colors duration-150 text-gray-900 dark:text-gray-100">
                                    <Select.ItemIndicator asChild>
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute left-2"
                                        >
                                            <div className="h-2 w-2 rounded-full bg-current" />
                                        </motion.div>
                                    </Select.ItemIndicator>
                                    <Select.ItemText>{option.label}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </motion.div>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
};

export default function SupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        priority: "all",
        category: "all"
    });
    const [replyMessage, setReplyMessage] = useState("");
    const [newTicket, setNewTicket] = useState({
        subject: "",
        description: "",
        category: "general",
        priority: "medium"
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchTickets();
    }, [filters]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = {
                search: filters.search || undefined,
                status: filters.status === "all" ? undefined : filters.status,
                priority: filters.priority === "all" ? undefined : filters.priority,
                category: filters.category === "all" ? undefined : filters.category
            };
            const response = await api.get("/support", { params });
            setTickets(response.data.tickets || []);
        } catch (error) {
            toast.error("Failed to load support tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        const newErrors = {};
        if (!newTicket.subject.trim()) newErrors.subject = "Subject is required";
        if (!newTicket.description.trim()) newErrors.description = "Description is required";
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        try {
            const res = await api.post("/support", newTicket);
            toast.success("Support ticket created successfully!");
            fetchTickets();
            setShowCreateForm(false);
            setSelectedTicket(res.data.ticket);
            setNewTicket({ subject: "", description: "", category: "general", priority: "medium" });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create ticket");
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim()) return;
        try {
            await api.put(`/support/${selectedTicket._id}/reply`, {
                message: replyMessage
            });
            toast.success("Reply sent!");
            setReplyMessage("");

            const response = await api.get(`/support/${selectedTicket._id}`);
            setSelectedTicket(response.data.ticket);
        } catch (error) {
            toast.error("Failed to send reply");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "open": return <AlertCircle className="h-4 w-4" />;
            case "in_progress": return <Clock className="h-4 w-4" />;
            case "resolved": return <CheckCircle className="h-4 w-4" />;
            case "closed": return <XCircle className="h-4 w-4" />;
            default: return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "open": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString) => {
        return moment(dateString).fromNow();
    };

    const filteredTickets = tickets;

    const statusOptions = [
        { value: "all", label: "All Status" },
        { value: "open", label: "Open" },
        { value: "in_progress", label: "In Progress" },
        { value: "resolved", label: "Resolved" },
        { value: "closed", label: "Closed" }
    ];

    const priorityOptions = [
        { value: "all", label: "All Priority" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" }
    ];

    const categoryOptions = [
        { value: "all", label: "All" },
        { value: "account", label: "Account" },
        { value: "payment", label: "Payment" },
        { value: "technical", label: "Technical" },
        { value: "content", label: "Content" },
        { value: "billing", label: "Billing" },
        { value: "feature_request", label: "Feature Request" },
        { value: "general", label: "General" },
        { value: "other", label: "Other" }
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20"
                        >
                            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </motion.div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Support Center
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Get help with your account, payments, or technical issues
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {tickets.length} tickets
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreateForm(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto transition-colors duration-200"
                        >
                            <Plus className="h-4 w-4" />
                            New Support Ticket
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            <div className="min-h-[70vh] rounded-2xl bg-white dark:bg-white/[0.03]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
                    {/* Tickets List */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="tickets-list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className={`lg:col-span-5 xl:col-span-4 space-y-4 transition-all duration-200 ${selectedTicket || showCreateForm ? 'hidden lg:block' : ''}`}
                        >
                            {/* Search & Filters */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                            >
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search tickets..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <SelectField
                                        value={filters.status}
                                        onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                                        options={statusOptions}
                                        placeholder="Status"
                                    />

                                    <SelectField
                                        value={filters.priority}
                                        onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                                        options={priorityOptions}
                                        placeholder="Priority"
                                    />

                                    <SelectField
                                        value={filters.category}
                                        onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                                        options={categoryOptions}
                                        placeholder="Category"
                                    />
                                </div>
                            </motion.div>

                            {/* Tickets */}
                            <div className="space-y-3">
                                {loading ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex h-32 items-center justify-center"
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent"
                                        ></motion.div>
                                    </motion.div>
                                ) : filteredTickets.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center h-full flex items-center justify-center flex-col"
                                    >
                                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                        <p className="text-gray-500 dark:text-gray-400">No tickets found</p>
                                    </motion.div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {filteredTickets.map((ticket, idx) => (
                                            <motion.div
                                                key={ticket._id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ delay: idx * 0.05 }}
                                                whileHover={{ scale: 1.02 }}
                                                className={`bg-white dark:bg-gray-800 rounded-lg border cursor-pointer transition-all ${selectedTicket?._id === ticket._id
                                                        ? 'border-indigo-500 ring-1 ring-indigo-500'
                                                        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                                                    } p-4`}
                                                onClick={() => { setSelectedTicket(ticket); setShowCreateForm(false); }}
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                            {ticket.subject}
                                                        </h3>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                                            {ticket.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                        {ticket.description}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                                {getStatusIcon(ticket.status)}
                                                                <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                                                            </span>
                                                            <span className="text-xs text-gray-500 capitalize">{ticket.category}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-500">{formatDate(ticket.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Ticket Detail / Create Form */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={showCreateForm ? "create-form" : selectedTicket ? "ticket-detail" : "empty"}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className={`lg:col-span-7 xl:col-span-8 transition-all duration-200 ${!selectedTicket && !showCreateForm ? 'hidden lg:flex lg:items-center lg:justify-center' : ''}`}
                        >
                            {showCreateForm ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setShowCreateForm(false)}
                                                className="lg:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </motion.button>
                                            <h2 className="text-xl font-semibold">Create New Ticket</h2>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Label>Subject *</Label>
                                            <Input
                                                type="text"
                                                value={newTicket.subject}
                                                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                                                placeholder="Brief summary of your issue"
                                                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            />
                                            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <div>
                                                <Label>Category *</Label>
                                                <SelectField
                                                    value={newTicket.category}
                                                    onChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                                                    options={categoryOptions}
                                                    placeholder="Category"
                                                />
                                            </div>
                                            <div>
                                                <Label>Priority *</Label>
                                                <SelectField
                                                    value={newTicket.priority}
                                                    onChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                                                    options={[
                                                        { value: "low", label: "Low" },
                                                        { value: "medium", label: "Medium" },
                                                        { value: "high", label: "High" }
                                                    ]}
                                                    placeholder="Priority"
                                                />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <Label>Description *</Label>
                                            <textarea
                                                value={newTicket.description}
                                                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                                                rows={5}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-800"
                                                placeholder="Please provide as much detail as possible..."
                                            />
                                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.25 }}
                                            className="flex justify-end gap-3 pt-4"
                                        >
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowCreateForm(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button onClick={handleCreateTicket}>
                                                Create Ticket
                                            </Button>
                                        </motion.div>
                                    </div>
                                </div>
                            ) : selectedTicket ? (
                                <div className="space-y-4 w-full">
                                    {/* Ticket Header */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setSelectedTicket(null)}
                                                    className="lg:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <ArrowLeft className="h-5 w-5" />
                                                </motion.button>
                                                <div className="flex-1 min-w-0">
                                                    <h2 className="text-xl font-semibold mb-2">{selectedTicket.subject}</h2>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                                                            {getStatusIcon(selectedTicket.status)}
                                                            <span className="ml-1">{selectedTicket.status.replace('_', ' ')}</span>
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                                                            {selectedTicket.priority} priority
                                                        </span>
                                                        <span className="text-xs text-gray-500 capitalize">{selectedTicket.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created</p>
                                                <p className="text-sm font-medium">{moment(selectedTicket.createdAt).format("MMM D, YYYY h:mm A")}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                                                <p className="text-sm font-medium">{moment(selectedTicket.updatedAt).format("MMM D, YYYY h:mm A")}</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Conversation */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                                    >
                                        <h3 className="font-semibold mb-4">Conversation</h3>
                                        <div className="space-y-4">
                                            {/* Initial Message */}
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="flex gap-3"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <span className="text-xs font-medium">ME</span>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">You</span>
                                                        <span className="text-xs text-gray-500">
                                                            {moment(selectedTicket.createdAt).format("MMM D, YYYY h:mm A")}
                                                        </span>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-4">
                                                        <p className="text-sm whitespace-pre-line">{selectedTicket.description}</p>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Replies */}
                                            <AnimatePresence mode="popLayout">
                                                {selectedTicket.replies?.map((reply, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        layout
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                                        className="flex gap-3"
                                                    >
                                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${reply.isSupport ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                                                            }`}>
                                                            <span className="text-xs font-medium">{reply.isSupport ? 'SP' : 'ME'}</span>
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">
                                                                    {reply.isSupport ? "Support Team" : "You"}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {moment(reply.createdAt).format("MMM D, YYYY h:mm A")}
                                                                </span>
                                                            </div>
                                                            <div className={`rounded-lg p-4 ${reply.isSupport ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-700'
                                                                }`}>
                                                                <p className="text-sm whitespace-pre-line">{reply.message}</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        {/* Reply Input */}
                                        {selectedTicket.status !== 'closed' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={replyMessage}
                                                        onChange={(e) => setReplyMessage(e.target.value)}
                                                        rows={4}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-800"
                                                        placeholder="Type your reply..."
                                                    />
                                                    <div className="flex justify-end">
                                                        <motion.div
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <Button onClick={handleSendReply} className="gap-2">
                                                                <Send className="h-4 w-4" />
                                                                Send Reply
                                                            </Button>
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center"
                                >
                                    <motion.div
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                    </motion.div>
                                    <h3 className="text-lg font-semibold mb-2">Select a ticket</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Choose a ticket from the list to view details and conversation
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                    <TextToSpeechSimple/>
                </div>
            </div>
        </div>
    );
}
