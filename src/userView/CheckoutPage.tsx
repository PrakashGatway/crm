import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    CheckCircle,
    Zap,
    Gift,
    Wallet,
    ArrowRight,
    Clock,
    Users,
    Award,
    BookOpen,
    Star,
    X,
    Sparkles,
    Loader2,
    AlertCircle,
    UserRoundSearch,
    ArrowLeft
} from "lucide-react";
import api, { ImageBaseUrl } from "../axiosInstance";
import { useParams, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/UserContext";

// --- Types ---
interface Course {
    _id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    thumbnail: { url: string };
    pricing: {
        amount: number; // Current price in rupees
        originalAmount?: number; // Original price before any discounts
        currency: string;
        discount?: number; // Main discount percentage
        earlyBird?: {
            discount: number; // Early bird discount percentage
            deadline: string;
        };
    };
    instructors: string[];
    instructorNames?: string[];
    studentsEnrolled?: number;
    duration: string;
    level: string;
    categoryInfo: { name: string };
    rating?: number;
    reviews?: number;
    features: string[];
    mode: string;
}

export default function CheckoutPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const isTestSeries = location.state?.testSeries ?? false;
    const { wallet: userWallet, loading: walletLoading } = useAuth();

    // --- State ---
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState<'initial' | 'promo' | 'payment' | 'none'>('initial');
    const [error, setError] = useState<string | null>(null);

    const [promoCode, setPromoCode] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);
    const [promoDiscountAmount, setPromoDiscountAmount] = useState(0); // in rupees
    const [promoMessage, setPromoMessage] = useState<string | null>(null);

    const [useWalletBalance, setUseWalletBalance] = useState(false);

    // --- Fetch Course ---
    useEffect(() => {
        if (!slug) {
            setError("Course not specified.");
            setLoading('none');
            return;
        }

        const fetchCourse = async () => {
            try {
                setLoading('initial');

                const response = isTestSeries ? await api.get(`/mcu/series/${slug}`) : await api.get(`/courses/${slug}`);
                const courseData = response.data.data;

                if (!isTestSeries && courseData.instructors && Array.isArray(courseData.instructors)) {
                    courseData.instructorNames = courseData.instructors.map((instructor: any) =>
                        instructor.name || instructor.username || 'Teacher'
                    );
                }

                setCourse(courseData);
            } catch (err: any) {
                console.error("Failed to fetch course:", err);
                setError(err?.message || "Failed to load course details.");
            } finally {
                setLoading('none');
            }
        };

        fetchCourse();
    }, [slug]);

    // --- Check if Early Bird is Active ---
    const isEarlyBirdActive = () => {
        if (!course?.pricing.earlyBird) return false;

        const now = new Date();
        const deadline = new Date(course.pricing.earlyBird.deadline);
        return now <= deadline;
    };

    // --- Calculate Effective Price ---
    const calculateEffectivePrice = () => {
        if (!course) return { basePrice: 0, discountAmount: 0, finalPrice: 0 };

        const originalPrice = course.pricing.originalAmount || course.pricing.amount;
        let effectivePrice = originalPrice;
        let totalDiscount = 0;

        // Apply main discount if exists
        if (!isEarlyBirdActive() && course.pricing.discount && course.pricing.discount > 0) {
            const discountAmount = (originalPrice * course.pricing.discount) / 100;
            effectivePrice = originalPrice - discountAmount;
            totalDiscount += discountAmount;
        }

        // Apply early bird discount if active
        if (isEarlyBirdActive() && course.pricing.earlyBird) {
            const earlyBirdDiscountAmount = (effectivePrice * course.pricing.earlyBird.discount) / 100;
            effectivePrice -= earlyBirdDiscountAmount;
            totalDiscount += earlyBirdDiscountAmount;
        }

        return {
            basePrice: effectivePrice,
            discountAmount: totalDiscount,
            finalPrice: effectivePrice
        };
    };

    // --- Promo Code Validation ---
    const handlePromoApply = async () => {
        if (!promoCode.trim() || !course) return;

        try {
            setLoading('promo');
            setError(null);
            setPromoMessage(null);

            const { basePrice } = calculateEffectivePrice();

            const response = await api.post(`/promo-codes/validate`, {
                code: promoCode.trim().toUpperCase(),
                courseId: course._id,
                currentPrice: basePrice
            });


            const { success, discountAmount, discountType, message } = response.data;

            if (success) {
                let finalDiscountAmount = discountAmount;
                // if (discountType === 'percentage') {
                //     finalDiscountAmount = (basePrice * discountAmount) / 100;
                // }

                console.log(finalDiscountAmount)

                setPromoDiscountAmount(finalDiscountAmount);
                setPromoApplied(true);
                setPromoMessage(message || "Promo code applied!");
            } else {
                setPromoMessage(message || "Invalid promo code.");
            }
        } catch (err: any) {
            console.error("Promo validation error:", err);
            setPromoMessage(err.response?.data?.message || "Failed to validate promo code.");
        } finally {
            setLoading('none');
        }
    };

    const handleRemovePromo = () => {
        setPromoCode("");
        setPromoApplied(false);
        setPromoDiscountAmount(0);
        setPromoMessage(null);
    };

    const handleWalletToggle = () => {
        if (userWallet && userWallet.balance > 0) {
            setUseWalletBalance(!useWalletBalance);
        }
    };

    const handlePurchase = async () => {
        if (!course || !userWallet) return;
        try {
            setLoading('payment');
            setError(null);
            const paymentData = {
                courseId: course._id,
                promoCode: promoApplied ? promoCode : undefined,
                useWallet: useWalletBalance,
                finalAmount: finalPrice
            };
            const response = await api.post(`/payments/create`, paymentData);
            const { success, redirectUrl, orderId, message } = response.data;
            if (success && redirectUrl) {
                navigate(redirectUrl, { state: { orderId } });
            } else {
                setError(message || "Payment initiation failed.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to process payment.");
        } finally {
            setLoading('none');
        }
    };

    const currency = course?.pricing.currency || userWallet?.currency || "INR";

    const {
        basePrice: effectiveBasePrice,
        discountAmount: courseDiscountAmount
    } = calculateEffectivePrice();

    const originalPrice = course?.pricing.amount || effectiveBasePrice;

    const promoDiscount = promoApplied ? promoDiscountAmount : 0;

    const maxWalletUsage = effectiveBasePrice * 0.1;
    const actualWalletUsage = useWalletBalance ?
        Math.min(userWallet?.balance || 0, maxWalletUsage) : 0;

    const priceAfterPromo = Math.max(0, effectiveBasePrice - promoDiscount);
    const finalPrice = Math.max(0, priceAfterPromo - actualWalletUsage);

    const totalSavings = courseDiscountAmount + promoDiscount + actualWalletUsage;

    const formatPrice = (amount: number, curr = currency) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: curr,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading === 'initial' || walletLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading checkout details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
                <div className="p-8 max-w-xl w-full text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!course || !userWallet) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
                <p className="text-gray-600 dark:text-gray-400">Course or wallet data unavailable.</p>
            </div>
        );
    }

    const earlyBirdActive = isEarlyBirdActive();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 transition-all duration-500">
            <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-1" />
                        Back
                    </button>
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Checkout</h1>
                    <div className="w-10"></div>
                </div>
            </header>
            <div className="max-w-6xl mx-auto p-6">
                <div className="grid lg:grid-cols-3 gap-4 mx-auto">
                    {/* Course Details */}
                    {isTestSeries ? <div className="lg:col-span-2 space-y-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                        <BookOpen className="w-6 h-6 mr-3 text-blue-500" />
                                        Course Details
                                    </h2>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span>{course.rating || 4.5}</span>
                                        <span>•</span>
                                        <Users className="w-4 h-4" />
                                        <span>{(course.studentsEnrolled || 0).toLocaleString()} students</span>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="relative">
                                        <img
                                            src={course.thumbnail?.url ? `${ImageBaseUrl}/${course.thumbnail.url}` : "/placeholder-course.jpg"}
                                            alt={course.title}
                                            className="w-full lg:w-44 h-28 object-cover rounded-xl"
                                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-course.jpg"; }}
                                        />
                                        {course.mode === 'free' && (
                                            <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                Free
                                            </div>
                                        )}
                                        {earlyBirdActive && (
                                            <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                                                Early Bird!
                                            </div>
                                        )}
                                        {course.featured && !earlyBirdActive && (
                                            <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                Bestseller
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm dark:text-gray-300 mb-1">
                                            {course.shortDescription || course.description}
                                        </p>
                                        <div className="grid grid-cols-3 gap-1 mb-2">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                {course.duration || "Self-paced"}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Award className="w-4 h-4 mr-2 text-green-500" />
                                                {course.level?.charAt(0).toUpperCase() + course.level?.slice(1) || "All Levels"}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Shield className="w-4 h-4 mr-2 text-purple-500" />
                                                {course.categoryInfo?.name || "Category"}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <UserRoundSearch className="w-4 h-4 mr-2 text-orange-500" />
                                                {course.mode?.charAt(0).toUpperCase() + course.mode?.slice(1) || "Online"}
                                            </div>
                                        </div>

                                        {/* Discount Badges */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {earlyBirdActive && course.pricing.earlyBird && (
                                                <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-semibold">
                                                    🎁 Early Bird: {course.pricing.earlyBird.discount}% OFF
                                                </span>
                                            )}
                                            {course.pricing.discount && course.pricing.discount > 0 && (
                                                <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm">
                                                    🔥 {course.pricing.discount}% OFF
                                                </span>
                                            )}
                                            {/* <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                                                Lifetime Access
                                            </span>
                                            <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm">
                                                Certificate
                                            </span> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div> : <div className="lg:col-span-2 space-y-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                        <BookOpen className="w-6 h-6 mr-3 text-blue-500" />
                                        Course Details
                                    </h2>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span>{course.rating || 4.5}</span>
                                        <span>•</span>
                                        <Users className="w-4 h-4" />
                                        <span>{(course.studentsEnrolled || 0).toLocaleString()} students</span>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="relative">
                                        <img
                                            src={course.thumbnail?.url ? `${ImageBaseUrl}/${course.thumbnail.url}` : "/placeholder-course.jpg"}
                                            alt={course.title}
                                            className="w-full lg:w-44 h-28 object-cover rounded-xl"
                                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-course.jpg"; }}
                                        />
                                        {course.mode === 'free' && (
                                            <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                Free
                                            </div>
                                        )}
                                        {earlyBirdActive && (
                                            <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                                                Early Bird!
                                            </div>
                                        )}
                                        {course.featured && !earlyBirdActive && (
                                            <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                Bestseller
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm dark:text-gray-300 mb-1">
                                            {course.shortDescription || course.description}
                                        </p>
                                        <div className="grid grid-cols-3 gap-1 mb-2">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                {course.duration || "Self-paced"}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Award className="w-4 h-4 mr-2 text-green-500" />
                                                {course.level?.charAt(0).toUpperCase() + course.level?.slice(1) || "All Levels"}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Shield className="w-4 h-4 mr-2 text-purple-500" />
                                                {course.categoryInfo?.name || "Category"}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <UserRoundSearch className="w-4 h-4 mr-2 text-orange-500" />
                                                {course.mode?.charAt(0).toUpperCase() + course.mode?.slice(1) || "Online"}
                                            </div>
                                        </div>

                                        {/* Discount Badges */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {earlyBirdActive && course.pricing.earlyBird && (
                                                <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-semibold">
                                                    🎁 Early Bird: {course.pricing.earlyBird.discount}% OFF
                                                </span>
                                            )}
                                            {course.pricing.discount && course.pricing.discount > 0 && (
                                                <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm">
                                                    🔥 {course.pricing.discount}% OFF
                                                </span>
                                            )}
                                            {/* <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                                                Lifetime Access
                                            </span>
                                            <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm">
                                                Certificate
                                            </span> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="sticky top-8"
                        >
                            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 pb-3 text-white">
                                    <h3 className="text-xl font-bold flex items-center">
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Order Summary
                                    </h3>
                                    <p className="text-blue-100 text-sm mt-1">
                                        {course.mode === 'free' ? 'Free Enrollment' : 'One-time payment • Secure Payment'}
                                    </p>
                                    {earlyBirdActive && (
                                        <div className="mt-1 bg-orange-500/20 border border-orange-300/30 rounded-lg px-3 py-2 text-xs">
                                            ⚡ Early Bird offer ends {new Date(course.pricing.earlyBird!.deadline).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3 mb-3">
                                        {/* Original Price */}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                                            <span className="text-gray-900 dark:text-white line-through">
                                                {formatPrice(originalPrice)}
                                            </span>
                                        </div>

                                        {/* Main Course Discount */}
                                        {course.pricing.discount && course.pricing.discount > 0 && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Course Discount ({course.pricing.discount}%)
                                                </span>
                                                <span className="text-green-600 dark:text-green-400">
                                                    -{formatPrice((originalPrice * course.pricing.discount) / 100)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Early Bird Discount */}
                                        {earlyBirdActive && course.pricing.earlyBird && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Early Bird Discount ({course.pricing.earlyBird.discount - course.pricing.discount}%)
                                                </span>
                                                <span className="text-orange-600 dark:text-orange-400">
                                                    -{formatPrice((originalPrice * (course.pricing.earlyBird.discount - course.pricing.discount)) / 100)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Current Price */}
                                        <div className="flex justify-between items-center text-sm font-medium dark:border-gray-600 pt-1">
                                            <span className="text-gray-600 dark:text-gray-400">Current Price</span>
                                            <span className="text-gray-900 dark:text-white text-lg font-bold">
                                                {formatPrice(effectiveBasePrice)}
                                            </span>
                                        </div>

                                        {/* Promo Code Section */}
                                        <AnimatePresence>
                                            {!promoApplied ? (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="pt-1"
                                                >
                                                    <div className="flex gap-2 mb-1">
                                                        <input
                                                            type="text"
                                                            value={promoCode}
                                                            onChange={(e) => setPromoCode(e.target.value)}
                                                            placeholder="Enter promo code"
                                                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            disabled={loading !== 'none' || course.mode === 'free'}
                                                        />
                                                        <button
                                                            onClick={handlePromoApply}
                                                            disabled={!promoCode.trim() || loading !== 'none' || course.mode === 'free'}
                                                            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                                                        >
                                                            {loading === 'promo' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                                        </button>
                                                    </div>
                                                    {promoMessage && (
                                                        <div className={`mt-2 text-xs ${promoApplied ? 'text-green-600' : 'text-red-600'} dark:text-red-400`}>
                                                            {promoMessage}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 pt-1"
                                                >
                                                    <span className="flex items-center">
                                                        <Gift className="w-4 h-4 mr-1" />
                                                        Promo Applied
                                                    </span>
                                                    <div className="flex items-center">
                                                        <span>-{formatPrice(promoDiscount)}</span>
                                                        <button
                                                            onClick={handleRemovePromo}
                                                            className="ml-2 text-red-500 hover:text-red-700"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Wallet Balance Section */}
                                        {course.mode !== 'free' && (
                                            <div className="pt-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="flex items-center space-x-3 cursor-pointer">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                checked={useWalletBalance}
                                                                onChange={handleWalletToggle}
                                                                disabled={!userWallet || userWallet.balance <= 0}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-12 h-6 rounded-full transition-all ${useWalletBalance ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all transform ${useWalletBalance ? 'translate-x-7' : 'translate-x-1'}`} />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            <Wallet className="w-4 h-4 mr-2 inline" />
                                                            Use Wallet Balance
                                                        </span>
                                                    </label>
                                                </div>
                                                {useWalletBalance && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex justify-between text-sm text-green-600 dark:text-green-400"
                                                    >
                                                        <span>Wallet Credit Applied</span>
                                                        <span>-{formatPrice(actualWalletUsage)}</span>
                                                    </motion.div>
                                                )}
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Available: {formatPrice(userWallet.balance, userWallet.currency)} (Max 10%)
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Amount */}
                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mb-3">
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span className="text-gray-900 dark:text-white">Total Amount</span>
                                            <div className="text-right">
                                                <div className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                                    {course.mode === 'free' ? 'FREE' : formatPrice(finalPrice)}
                                                </div>
                                                {totalSavings > 0 && (
                                                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                        You save {formatPrice(totalSavings)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-2" />
                                            {error}
                                        </div>
                                    )}

                                    {/* Purchase Button */}
                                    <motion.button
                                        onClick={handlePurchase}
                                        disabled={loading !== 'none' || (course.mode !== 'free' && finalPrice < 0)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading === 'payment' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin mr-2 inline" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {course.mode === 'free' ? 'Enroll for Free' : 'Complete Purchase'}
                                                <ArrowRight className="w-5 h-5 ml-2 inline" />
                                            </>
                                        )}
                                    </motion.button>
                                    {/* <div className="mt-6 space-y-3 text-center">
                                        <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                            <Shield className="w-4 h-4 text-green-500" />
                                            <span>SSL Secure Payment</span>
                                        </div>
                                        {course.mode !== 'free' && (
                                            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                <span>30-Day Money-Back Guarantee</span>
                                            </div>
                                        )}
                                    </div> */}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}