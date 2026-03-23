import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    Clock,
    Users,
    Star,
    Crown,
    Gift,
    ChevronDown,
    Copy,
    CheckCircle,
    TrendingUp,
    Share2,
    Sparkles,
    Zap,
    Tag,
    Calendar,
    Filter,
    ArrowUpDown,
    Loader
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api from "../axiosInstance";

interface PromoCode {
    _id: string;
    code: string;
    title: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchase: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    usedCount: number;
    type: 'general' | 'course_specific' | 'user_specific' | 'category_specific' | 'user_course_specific';
    courses: Array<{
        _id: string;
        title: string;
        thumbnail: string;
        instructor: string;
        price: number;
        discountPrice?: number;
    }>;
    categories: Array<{
        _id: string;
        name: string;
    }>;
    applicableUsers: Array<{
        _id: string;
        name: string;
        email: string;
    }>;
    terms: string[];
    isActive: boolean;
    isFeatured: boolean;
    createdAt: string;
}

const getTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const end = new Date(validUntil);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
};

const Badge = ({
    children,
    variant = "default",
    className = "",
}: {
    children: React.ReactNode;
    variant?: "default" | "secondary" | "premium" | "success" | "warning" | "danger" | "info";
    className?: string;
}) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200";

    const variants = {
        default: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        premium: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        info: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    };

    return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>;
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden ${className}`}>
        {children}
    </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-6 ${className}`}>{children}</div>
);

const DiscountTag = ({ discountType, discountValue, maxDiscount }: { discountType: string; discountValue: number; maxDiscount?: number }) => (
    <div className="relative">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="text-center">
                <div className="text-2xl font-bold leading-none">
                    {discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}
                </div>
                <div className="text-xs opacity-90 mt-1">OFF</div>
            </div>
            {maxDiscount && discountType === 'percentage' && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full border shadow-sm">
                    Up to ₹{maxDiscount}
                </div>
            )}
        </div>
    </div>
);

const ProgressBar = ({ used, total }: { used: number; total?: number }) => {
    const percentage = total ? Math.min((used / total) * 100, 100) : 0;
    
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{used} used</span>
                <span>{total ? `${total - used} left` : 'Unlimited'}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                    className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                        percentage > 80 ? 'bg-red-500' : 
                        percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const PromoCard = React.memo(({
    promo,
    copiedCode,
    onCopy
}: {
    promo: PromoCode;
    copiedCode: string | null;
    onCopy: (code: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isExpired = new Date(promo.validUntil) < new Date();
    const isEndingSoon = !isExpired && new Date(promo.validUntil) < new Date(Date.now() + 24 * 60 * 60 * 1000);

    return (
        <Card 
            className={`relative overflow-hidden transition-all duration-500 hover:scale-[1.01] ${
                promo.isFeatured ? 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-xl' : ''
            } ${isExpired ? 'opacity-70 grayscale' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Animated Background */}
            {promo.isFeatured && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-500/5" />
            )}
            
            {/* Expired Overlay */}
            {isExpired && (
                <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-20 backdrop-blur-sm rounded-2xl">
                    <Badge variant="danger" className="text-lg py-3 px-6 animate-pulse">
                        Expired
                    </Badge>
                </div>
            )}

            {/* Status Badges */}
            <div className="absolute top-4 right-4 z-10 space-y-2">
                {promo.isFeatured && (
                    <Badge variant="premium" className="animate-bounce shadow-lg">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Featured
                    </Badge>
                )}
                {!isExpired && isEndingSoon && (
                    <Badge variant="warning" className="animate-pulse">
                        <Zap className="h-3 w-3 mr-1" />
                        Ending Soon
                    </Badge>
                )}
            </div>

            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left Section - Discount Tag */}
                    <div className="lg:w-40 flex-shrink-0">
                        <DiscountTag 
                            discountType={promo.discountType}
                            discountValue={promo.discountValue}
                            maxDiscount={promo.maxDiscount}
                        />
                    </div>

                    {/* Middle Section - Content */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-2xl leading-tight mb-2 line-clamp-2">
                                        {promo.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-1 line-clamp-2">
                                        {promo.description}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                    {getTimeRemaining(promo.validUntil)}
                                </div>
                                {/* <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Users className="h-4 w-4 mr-2 text-green-500" />
                                    {promo.usedCount} used
                                </div> */}
                                {promo.minPurchase > 0 && (
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Tag className="h-4 w-4 mr-2 text-purple-500" />
                                        Min. ₹{promo.minPurchase}
                                    </div>
                                )}
                                {(promo.courses?.length > 0 || promo.categories?.length > 0) && (
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                                        {promo.courses?.length > 0 ? `${promo.courses.length} course(s)` : 
                                         promo.categories?.length > 0 ? `${promo.categories.length} category(s)` : ''}
                                    </div>
                                )}
                            </div>

                            {/* Usage Progress */}
                            {/* <ProgressBar used={promo.usedCount} total={promo.usageLimit} /> */}

                            {/* Terms and Conditions */}
                            {promo.terms?.length > 0 && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 font-medium"
                                    >
                                        Terms & Conditions
                                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isExpanded && (
                                        <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400 animate-in fade-in duration-300">
                                            {promo.terms.map((term, index) => (
                                                <li key={index} className="flex items-start bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                                                    <span className="leading-relaxed">{term}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Section - Code and Actions */}
                    <div className="lg:w-80 flex flex-col gap-4">
                        {/* Code Box */}
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                            <div className="space-y-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">PROMO CODE</div>
                                <div className="flex items-center justify-between gap-1">
                                    <code className="font-mono font-bold text-xl text-gray-900 w-full dark:text-white tracking-wider bg-white dark:bg-gray-800 px-3 py-1 rounded-lg">
                                        {promo.code}
                                    </code>
                                    <Button
                                        onClick={() => onCopy(promo.code)}
                                        disabled={isExpired}
                                        variant={copiedCode === promo.code ? "default" : "outline"}
                                        size="sm"
                                        className={`min-w-[80px] transition-all duration-300 transform hover:scale-105 ${
                                            copiedCode === promo.code
                                                ? 'bg-green-500 hover:bg-green-600 border-green-500 shadow-lg'
                                                : 'border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                        } ${isExpired ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                                    >
                                        {copiedCode === promo.code ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-1.5" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {/* <div className="flex gap-3">
                            <Button
                                size="lg"
                                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                disabled={isExpired}
                            >
                                {isExpired ? 'Expired' : 'Apply Code'}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg"
                                className="px-4 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transform hover:scale-105 transition-all duration-300"
                            >
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div> */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

const LoadingSkeleton = () => (
    <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-32">
                            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(4)].map((_, j) => (
                                    <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-80 space-y-4">
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            <div className="flex gap-3">
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-12"></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

export default function OffersPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [sortBy, setSortBy] = useState("-createdAt");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(6);
    const observerTarget = useRef<HTMLDivElement>(null);

    const types = [
        { id: "all", name: "All Offers", icon: Gift, color: "gray" },
        { id: "featured", name: "Featured", icon: Crown, color: "amber" },
        { id: "new", name: "New Arrivals", icon: Star, color: "blue" },
        { id: "popular", name: "Most Popular", icon: TrendingUp, color: "green" },
        { id: "ending", name: "Ending Soon", icon: Clock, color: "red" },
    ];

    const sortOptions = [
        { id: "-createdAt", name: "Newest First" },
        { id: "createdAt", name: "Oldest First" },
        { id: "-discountValue", name: "Highest Discount" },
        { id: "-usedCount", name: "Most Popular" },
        { id: "validUntil", name: "Ending Soon" },
    ];

    const fetchPromoCodes = useCallback(async () => {
        try {
            setLoading(page === 1);
            setLoadingMore(page > 1);

            let filterParams: Record<string, any> = {};
            const selectedTypeObj = types.find(t => t.id === selectedType);

            if (selectedType !== "all") {
                if (selectedType === "ending") {
                    filterParams.validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                } else if (selectedTypeObj) {
                    filterParams = { ...selectedTypeObj.filter };
                }
            }

            const params = {
                page,
                limit: 12,
                search: searchTerm,
                sort: sortBy,
                ...filterParams
            };

            Object.keys(params).forEach(key => {
                if (params[key] === "" || params[key] === undefined) delete params[key];
            });

            const response = await api.get("/promo-codes", { params });
            
            if (page === 1) {
                setPromoCodes(response.data.data || []);
            } else {
                setPromoCodes(prev => [...prev, ...(response.data.data || [])]);
            }
            setHasMore(response.data.totalPages > page);
        } catch (error) {
            console.error("Error fetching promo codes:", error);
            setPromoCodes([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [page, searchTerm, selectedType, sortBy]);

    useEffect(() => {
        setPage(1);
        setVisibleCount(6);
    }, [searchTerm, selectedType, sortBy]);

    useEffect(() => {
        fetchPromoCodes();
    }, [fetchPromoCodes]);

    useEffect(() => {
        if (!hasMore || loadingMore) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore]);

    const copyToClipboard = useCallback((code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    }, []);

    const handleTypeChange = useCallback((typeId: string) => {
        setSelectedType(typeId);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto p-2">
                {/* Search and Filters */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-6 mb-2 animate-in slide-in-from-top duration-500">
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500" />
                                <input
                                    type="text"
                                    placeholder="Search offers, courses, or codes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-inner transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <ArrowUpDown className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="pl-10 pr-8 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base appearance-none shadow-inner transition-all duration-300 cursor-pointer"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Type Filters */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {types.map((type, index) => {
                            const IconComponent = type.icon;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeChange(type.id)}
                                    className={`flex items-center px-4 py-2.5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 font-medium text-sm ${
                                        selectedType === type.id
                                            ? `bg-${type.color}-500 border-${type.color}-500 text-white shadow-lg scale-105`
                                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <IconComponent className="h-4 w-4 mr-2.5" />
                                    {type.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Loading State */}
                {loading && <LoadingSkeleton />}

                {/* Promo Codes Grid */}
                {!loading && (
                    <div className="space-y-2 mb-4">
                        {promoCodes
                            .slice(0, visibleCount)
                            .map((promo, index) => (
                                <div 
                                    key={promo._id}
                                    className="animate-in fade-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <PromoCard
                                        promo={promo}
                                        copiedCode={copiedCode}
                                        onCopy={copyToClipboard}
                                    />
                                </div>
                            ))}
                    </div>
                )}

                {/* Load More Button */}
                {visibleCount < promoCodes.length && (
                    <div className="text-center mb-8 animate-in fade-in duration-500">
                        <Button
                            onClick={() => setVisibleCount(prev => prev + 6)}
                            variant="outline"
                            size="lg"
                            className="px-8 py-4 border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <ChevronDown className="h-5 w-5 mr-2" />
                            Load More ({promoCodes.length - visibleCount} remaining)
                        </Button>
                    </div>
                )}

                {/* Infinite Scroll Loader */}
                {hasMore && visibleCount >= promoCodes.length && (
                    <div ref={observerTarget} className="h-20 flex items-center justify-center">
                        {loadingMore && (
                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                <Loader className="h-6 w-6 animate-spin" />
                                <span className="text-sm">Loading more offers...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!loading && promoCodes.length === 0 && (
                    <div className="text-center py-16 animate-in fade-in duration-500">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-2xl border border-gray-200 dark:border-gray-700">
                            <Gift className="h-24 w-24 text-gray-300 dark:text-gray-600 mx-auto mb-6 transition-colors duration-300" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                No offers found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                                {searchTerm || selectedType !== "all"
                                    ? "Try adjusting your search or filters to find more offers."
                                    : "Check back later for new exciting offers!"
                                }
                            </p>
                            {(searchTerm || selectedType !== "all") && (
                                <Button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedType("all");
                                    }}
                                    variant="primary"
                                    size="lg"
                                    className="rounded-xl px-8 py-4 text-base font-semibold transition-all duration-300 transform hover:scale-105"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}