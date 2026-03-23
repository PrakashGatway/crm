// pages/TransactionsPage.tsx or components/TransactionsPage.tsx
import { useState, useEffect, useRef } from "react";
import {
    Search,
    Filter,
    Calendar,
    Clock,
    CreditCard,
    Wallet,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    Copy,
    ChevronDown,
    ChevronUp,
    Receipt,
    Tag,
    Coins,
    Shield
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api from "../axiosInstance";

// ✅ Updated to match your Mongoose schema exactly
interface Transaction {
    _id: string;
    user: string;
    course?: {
        _id: string;
        title: string;
    };
    type:
    | "purchase"
    | "subscription"
    | "refund"
    | "discount"
    | "referral_bonus"
    | "purchase_bonus"
    | "course_purchase";
    amount: number;
    breakdown: {
        baseAmount: number;
        tax: number;
        discount: number;
        platformFee: number;
        creditsUsed: number;
        creditsEarned: number;
    };
    status: "pending" | "success" | "failed" | "refunded" | "cancelled";
    paymentMethod: "wallet" | "bank";
    transactionId: string;
    orderId?: string;
    invoiceNumber?: string;
    receiptUrl?: string;
    reason?: string;
    refund?: {
        isRefunded: boolean;
        refundId?: string;
        refundAmount?: number;
        refundDate?: string;
        reason?: string;
    };
    coupon?: {
        code: string;
        discountType: "percentage" | "fixed";
        discountValue: number;
    };
    createdAt: string;
}

const Badge = ({
    children,
    variant = "default",
    className = "",
}: {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "secondary" | "info";
    className?: string;
}) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200";

    const variants = {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        secondary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        info: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    };

    return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>;
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const LoadingSkeleton = () => (
    <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const PriceBreakdown = ({ breakdown, type }: { breakdown: Transaction['breakdown']; type: string }) => {
    const isCredit = ['refund', 'referral_bonus', 'discount', 'purchase_bonus'].includes(type);

    return (
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 mt-3">
            <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Price Breakdown
            </h5>
            <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Amount:</span>
                    <span className="text-gray-900 dark:text-white">₹{breakdown.baseAmount?.toLocaleString() || '0'}</span>
                </div>
                {breakdown.tax > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                        <span className="text-red-600 dark:text-red-400">+₹{breakdown.tax.toLocaleString()}</span>
                    </div>
                )}
                {breakdown.discount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                        <span className="text-green-600 dark:text-green-400">-₹{breakdown.discount.toLocaleString()}</span>
                    </div>
                )}
                {breakdown.platformFee > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Platform Fee:</span>
                        <span className="text-red-600 dark:text-red-400">+₹{breakdown.platformFee.toLocaleString()}</span>
                    </div>
                )}
                {breakdown.creditsUsed > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5" />
                            Credits Used:
                        </span>
                        <span className="text-green-600 dark:text-green-400">-₹{breakdown.creditsUsed.toLocaleString()}</span>
                    </div>
                )}
                {breakdown.creditsEarned > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5" />
                            Credits Earned:
                        </span>
                        <span className="text-green-600 dark:text-green-400">+₹{breakdown.creditsEarned.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedType, setSelectedType] = useState("all");

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (value: string) => {
        setDebouncedSearchTerm(value)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
        }, 700);
    };
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const statuses = [
        { id: "all", name: "All", icon: Filter, color: "gray" },
        { id: "success", name: "Completed", icon: CheckCircle, color: "green" },
        { id: "pending", name: "Pending", icon: Clock, color: "yellow" },
        { id: "failed", name: "Failed", icon: XCircle, color: "red" },
        { id: "refunded", name: "Refunded", icon: TrendingDown, color: "blue" },
        { id: "cancelled", name: "Cancelled", icon: AlertCircle, color: "red" },
    ];

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = {
            page,
            limit,
        };

        if (selectedStatus !== "all") params.status = selectedStatus;
        if (selectedType !== "all") params.type = selectedType;
        if (searchTerm) params.search = searchTerm;

        try {
            const response = await api.get("/payments", { params });

            if (response.data.success) {
                setTransactions(response.data.data);
                setTotalPages(response.data.pagination.pages);
            } else {
                setError("Failed to load transactions");
            }
        } catch (err: any) {
            console.error("API Error:", err);
            setError(err.response?.data?.message || "Unable to fetch transactions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, selectedStatus, selectedType, searchTerm]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [selectedStatus, selectedType, searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            // Scroll to top when changing pages
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'danger';
            case 'refunded': return 'secondary';
            case 'cancelled': return 'danger';
            default: return 'default';
        }
    };

    const getTypeIcon = (type: string) => {
        const creditTypes = ['refund', 'referral_bonus', 'discount', 'purchase_bonus'];
        return creditTypes.includes(type) ? TrendingUp : TrendingDown;
    };

    const getTypeColor = (type: string) => {
        const creditTypes = ['refund', 'referral_bonus', 'discount', 'purchase_bonus'];
        return creditTypes.includes(type) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('en-IN'),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            datetime: date.toISOString()
        };
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const getTypeDisplayName = (type: string) => {
        const typeMap: Record<string, string> = {
            purchase: "Purchase",
            subscription: "Subscription",
            refund: "Refund",
            discount: "Discount",
            referral_bonus: "Referral Bonus",
            purchase_bonus: "Purchase Bonus",
            course_purchase: "Course Purchase"
        };
        return typeMap[type] || type.replace(/_/g, ' ');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-3 sm:px-3 py-2">

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-2 transition-all duration-300">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500" />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Transaction ID, or Course..."
                                value={debouncedSearchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-4">
                        {/* Status Filters */}
                        <div>
                            <div className="flex flex-wrap gap-2">
                                {statuses.map(status => {
                                    const IconComponent = status.icon;
                                    return (
                                        <button
                                            key={status.id}
                                            onClick={() => setSelectedStatus(status.id)}
                                            className={`flex items-center px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95 ${selectedStatus === status.id
                                                ? `bg-${status.color}-500 text-white border-${status.color}-500 shadow-lg shadow-${status.color}-500/25`
                                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                }`}
                                        >
                                            <IconComponent className="h-4 w-4 mr-2" />
                                            {status.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {(loading && transactions.length === 0) &&
                    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                                <LoadingSkeleton />
                            </div>
                        </div>
                    </div>

                }


                <div className="space-y-2 mb-8">
                    {!loading && transactions.map((transaction, index) => {
                        const { date, time } = formatDate(transaction.createdAt);
                        const TypeIcon = getTypeIcon(transaction.type);
                        const isCredit = getTypeColor(transaction.type).includes('green');

                        return (
                            <Card
                                key={transaction._id}
                                className="overflow-hidden transform transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-lg ${isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                    <TypeIcon className={`h-5 w-5 ${getTypeColor(transaction.type)}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                                                        {transaction.course?.title || getTypeDisplayName(transaction.type)}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <Badge variant={getStatusColor(transaction.status)} className="animate-pulse">
                                                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                            via {transaction.paymentMethod}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1.5" />
                                                    {date} at {time}
                                                </div>
                                                {transaction.orderId && (
                                                    <div className="flex items-center">
                                                        <Shield className="h-4 w-4 mr-1.5" />
                                                        Order: {transaction.orderId}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <div className={`text-2xl font-bold ${getTypeColor(transaction.type)} transform transition-transform duration-200 hover:scale-110`}>
                                                {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleExpand(transaction._id)}
                                                className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                                            >
                                                {expandedId === transaction._id ? (
                                                    <>
                                                        <ChevronUp className="h-4 w-4 mr-2" />
                                                        Less Details
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="h-4 w-4 mr-2" />
                                                        More Details
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedId === transaction._id && (
                                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 animate-in fade-in duration-300">
                                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                                        <CreditCard className="h-5 w-5" />
                                                        Transaction Details
                                                    </h4>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center py-2">
                                                            <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                                    {transaction.transactionId}
                                                                </code>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between py-2">
                                                            <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                                                            <Badge variant="secondary" className="capitalize">
                                                                {transaction.paymentMethod}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex justify-between py-2">
                                                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                            <Badge variant={getStatusColor(transaction.status)}>
                                                                {transaction.status}
                                                            </Badge>
                                                        </div>
                                                        {transaction.reason && (
                                                            <div className="flex justify-between py-2">
                                                                <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                                                                <span className="text-gray-900 dark:text-white text-right">{transaction.reason}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                                        <Wallet className="h-5 w-5" />
                                                        Order Details
                                                    </h4>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between py-2">
                                                            <span className="text-gray-600 dark:text-gray-400">Course:</span>
                                                            <span className="text-gray-900 dark:text-white text-right">
                                                                {transaction.course?.title || '—'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between py-2">
                                                            <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                                                            <span className="text-gray-900 dark:text-white">{transaction.orderId || '—'}</span>
                                                        </div>
                                                        {transaction.invoiceNumber && (
                                                            <div className="flex justify-between py-2 ">
                                                                <span className="text-gray-600 dark:text-gray-400">Invoice:</span>
                                                                <span className="text-gray-900 dark:text-white">{transaction.invoiceNumber}</span>
                                                            </div>
                                                        )}
                                                        {transaction.coupon && (
                                                            <div className="flex justify-between py-2">
                                                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                                    <Tag className="h-3.5 w-3.5" />
                                                                    Coupon:
                                                                </span>
                                                                <div className="text-right">
                                                                    <div className="text-gray-900 dark:text-white">{transaction.coupon.code} ({transaction.coupon.discountType === 'percentage'
                                                                        ? `${transaction.coupon.discountValue}% off`
                                                                        : `₹${transaction.coupon.discountValue} off`
                                                                    })</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price Breakdown */}
                                                <div className="space-y-2">
                                                    <PriceBreakdown
                                                        breakdown={transaction.breakdown}
                                                        type={transaction.type}
                                                    />
                                                    <div className="pt-1 p-3 mt-1.5">
                                                        <div className="flex justify-between font-semibold">
                                                            <span className="text-gray-900 dark:text-white">Total Amount:</span>
                                                            <span className={`${isCredit ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                                {isCredit ? '+' : '-'}₹{transaction.amount?.toLocaleString() || '0'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Refund Information */}
                                                    {transaction.refund?.isRefunded && (
                                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                                                            <h5 className="font-medium text-sm text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                                                                <AlertCircle className="h-4 w-4" />
                                                                Refund Processed
                                                            </h5>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-yellow-700 dark:text-yellow-400">Refund Amount:</span>
                                                                    <span className="text-yellow-800 dark:text-yellow-300 font-semibold">
                                                                        ₹{transaction.refund.refundAmount?.toLocaleString('en-IN')}
                                                                    </span>
                                                                </div>
                                                                {transaction.refund.refundId && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-yellow-700 dark:text-yellow-400">Refund ID:</span>
                                                                        <span className="text-yellow-800 dark:text-yellow-300 text-xs">
                                                                            {transaction.refund.refundId}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {transaction.refund.reason && (
                                                                    <div className="text-yellow-700 dark:text-yellow-400 text-xs">
                                                                        Reason: {transaction.refund.reason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap justify-end gap-3 mt-2 pt-2">
                                                {transaction.receiptUrl && (
                                                    <a
                                                        href={transaction.receiptUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block"
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                                                        >
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download Receipt
                                                        </Button>
                                                    </a>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(transaction.transactionId, 'copy')}
                                                    className="text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                                                >
                                                    <Copy className={`h-4 w-4 mr-2 ${copiedId === 'copy' ? 'text-green-500' : ''}`} />
                                                    {copiedId === 'copy' ? 'Copied!' : 'Copy Transaction ID'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 py-8 animate-in fade-in duration-500">
                        <Button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            variant="outline"
                            size="lg"
                            className="px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                        >
                            Previous
                        </Button>
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
                            Page <span className="text-blue-600 dark:text-blue-400">{page}</span> of {totalPages}
                        </span>
                        <Button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            variant="outline"
                            size="lg"
                            className="px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                        >
                            Next
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {transactions.length === 0 && !loading && (
                    <div className="text-center py-16 animate-in fade-in duration-500">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
                            <CreditCard className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-6 transition-colors duration-300" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No transactions found</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {searchTerm || selectedStatus !== "all" || selectedType !== "all"
                                    ? "Try adjusting your filters to see more results."
                                    : "Your transaction history will appear here once you make your first purchase."
                                }
                            </p>
                            {(searchTerm || selectedStatus !== "all" || selectedType !== "all") && (
                                <Button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedStatus("all");
                                        setSelectedType("all");
                                    }}
                                    variant="primary"
                                    size="lg"
                                    className="rounded-xl px-8 py-3 transition-all duration-200 transform hover:scale-105"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-8 animate-in fade-in duration-300">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-md mx-auto">
                            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Unable to load transactions</h3>
                            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                            <Button
                                onClick={fetchTransactions}
                                variant="outline"
                                size="sm"
                                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}