import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Gift,
    Share2,
    Copy,
    CheckCircle,
    Award,
    Mail,
    Facebook,
    Twitter,
    Linkedin,
    UserPlus,
    BarChart3,
    Calendar,
    CreditCard,
    Eye,
    EyeOff,
    Bell,
    Info
} from "lucide-react";
import Button from "../components/ui/button/Button";
import { useAuth } from "../context/UserContext";
import { Loader } from "../components/fullScreeLoader";
import api from "../axiosInstance";

const RewardBadge = ({ status, amount }: { status: string; amount: number }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status === 'available'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : status === 'used'
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            }`}
    >
        +₹{amount}
        <div
            className={`ml-2 w-2 h-2 rounded-full ${status === 'available'
                ? 'bg-green-500'
                : status === 'used'
                    ? 'bg-gray-500'
                    : 'bg-amber-500'
                }`}
        ></div>
    </motion.div>
);

const ShareButton = ({
    icon: Icon,
    label,
    color,
    onClick,
}: {
    icon: any;
    label: string;
    color: string;
    onClick: () => void;
}) => (
    <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`${color} text-white p-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex flex-col items-center space-y-2`}
    >
        <Icon className="h-5 w-5" />
        <span className="text-xs font-medium">{label}</span>
    </motion.button>
);

export default function ReferAndEarnPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") || "refer";
    const { wallet } = useAuth() as any;

    const [referralCode, setReferralCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false); // ✅ New state
    const [activeTab, setActiveTab] = useState(initialTab);
    const [email, setEmail] = useState("");
    const [showBalance, setShowBalance] = useState(true);
    const [loading, setLoading] = useState(true);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Sync tab from URL
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["refer", "history"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const updateUrlTab = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    // Fetch referral data
    useEffect(() => {
        const fetchReferData = async () => {
            try {
                setLoading(true);
                const res = await api.get("/wallet/history");
                setReferrals(res.data.referrals || []);
                setReferralCode(wallet?.referralCode || "");
            } catch (err: any) {
                console.error("Failed to load referral data", err);
                setError(err.response?.data?.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        if (wallet) fetchReferData();
    }, [wallet]);

    // Copy full link
    const copyToClipboard = () => {
        const link = `https://www.gatewayabroadeducations.com?ref=${referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ✅ Copy just the code
    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    // Share config
    const shareLink = `https://www.gatewayabroadeducations.com?ref=${referralCode}`;
    const shareText = encodeURIComponent("Join me on Gateway Abroad and get started! Use my link:");

    const shareOptions = [
        {
            platform: "whatsapp",
            icon: Bell,
            color: "bg-green-500 hover:bg-green-600",
            label: "WhatsApp",
            onClick: () =>
                window.open(
                    `https://wa.me/?text=${shareText}%20${encodeURIComponent(shareLink)}`,
                    "_blank"
                ),
        },
        {
            platform: "facebook",
            icon: Facebook,
            color: "bg-blue-600 hover:bg-blue-700",
            label: "Facebook",
            onClick: () =>
                window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
                    "_blank"
                ),
        },
        {
            platform: "twitter",
            icon: Twitter,
            color: "bg-blue-400 hover:bg-blue-500",
            label: "Twitter",
            onClick: () =>
                window.open(
                    `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareLink)}`,
                    "_blank"
                ),
        },
        {
            platform: "linkedin",
            icon: Linkedin,
            color: "bg-blue-700 hover:bg-blue-800",
            label: "LinkedIn",
            onClick: () =>
                window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
                    "_blank"
                ),
        },
        {
            platform: "email",
            icon: Mail,
            color: "bg-gray-600 hover:bg-gray-700",
            label: "Email",
            onClick: () =>
                (window.location.href = `mailto:?subject=Join%20me%20on%20Gateway%20Abroad&body=${shareText}%0A${shareLink}`),
        },
    ];

    const referralSteps = [
        {
            step: 1,
            icon: Share2,
            title: "Share Your Link",
            description: "Send your unique referral link or code to friends",
            color: "from-blue-500 to-blue-600",
        },
        {
            step: 2,
            icon: UserPlus,
            title: "Friend Signs Up",
            description: "They sign up using your link or enter your code",
            color: "from-green-500 to-green-600",
        },
        {
            step: 3,
            icon: Gift,
            title: "You Get ₹50 Credit",
            description: "Instant ₹50 added to your wallet per friend!",
            color: "from-purple-500 to-purple-600",
        },
    ];

    const tabs = [
        { id: "refer", label: "Refer Friends", icon: Share2 },
        { id: "history", label: "Referral History", icon: BarChart3 },
    ];

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center text-red-500 p-6 max-w-md">
                    <p className="text-lg font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
                >
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                            <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    updateUrlTab(tab.id);
                                }}
                                className={`flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                    }`}
                            >
                                <IconComponent className="h-4 w-4 mr-2" />
                                {tab.label}
                            </motion.button>
                        );
                    })}
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {activeTab === "refer" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    Your Referral Link & Code
                                                </h3>
                                                <motion.div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => setShowBalance(!showBalance)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                        aria-label={showBalance ? "Hide balance" : "Show balance"}
                                                    >
                                                        {showBalance ? (
                                                            <EyeOff className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                        )}
                                                    </button>
                                                </motion.div>
                                            </div>

                                            {/* Full Link Section */}
                                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 shadow-lg space-y-6">
                                                {/* Full Link */}
                                                <div>
                                                    <div className="text-blue-100 text-sm font-medium mb-2">
                                                        SHARE THIS LINK
                                                    </div>
                                                    <div className="font-mono flex justify-between text-lg sm:text-xl font-bold text-white break-all">
                                                        <p>{shareLink}</p>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={copyToClipboard}
                                                            className="bg-white/20 hover:bg-white/30 text-white px-2 py-2 rounded-lg font-semibold flex items-center space-x-2"
                                                        >
                                                            {copied ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    {/* <span>Copied!</span> */}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="h-4 w-4" />
                                                                    {/* <span>Copy</span> */}
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </div>

                                                </div>

                                                {/* Referral Code */}
                                                <div className="pt-4 border-t border-white/20">
                                                    <div className="text-blue-100 text-sm font-medium mb-2">
                                                        OR SHARE JUST YOUR CODE
                                                    </div>
                                                    <div className="font-mono flex justify-between text-lg font-bold text-white">
                                                        <p>{referralCode || "—"} </p>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={copyReferralCode}
                                                            className="bg-white/20 hover:bg-white/30 text-white px-2 py-2 rounded-lg font-semibold items-center space-x-2"
                                                        >
                                                            {codeCopied ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    {/* <span>Copied!</span> */}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="h-4 w-4" />
                                                                    {/* <span>Copy</span> */}
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* Info Banner */}
                                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start space-x-3 text-sm text-blue-700 dark:text-blue-300">
                                                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                                <span>
                                                    You earn <strong>₹50 credit</strong> for every friend who signs up using your link or code.
                                                    Credits can be used for <strong>up to 10% off</strong> on any course purchase.
                                                    No limits — refer unlimited friends!
                                                </span>
                                            </div>

                                            {/* Share Buttons */}
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                                    Share via
                                                </h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                    {shareOptions.map((option) => (
                                                        <ShareButton
                                                            key={option.platform}
                                                            icon={option.icon}
                                                            label={option.label}
                                                            color={option.color}
                                                            onClick={option.onClick}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Earnings Summary */}
                                <div className="space-y-6">
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6 h-full"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Award className="h-5 w-5 mr-2 text-amber-500" />
                                            Earnings Summary
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    Available
                                                </span>
                                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    {showBalance ? `₹${wallet?.balance || 0}` : "••••"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    Total Earned
                                                </span>
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    ₹{wallet?.totalEarned || 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                                            Credits apply automatically at checkout (max 10% off).
                                        </div>
                                        <Button className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Use Credits
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {activeTab === "history" && (
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Referral History
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {referrals.length > 0 ? (
                                        referrals.map((referral) => (
                                            <motion.div
                                                key={referral._id}
                                                whileHover={{ x: 4 }}
                                                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div
                                                        className={`p-3 rounded-xl ${referral.status === 'completed'
                                                            ? 'bg-green-100 dark:bg-green-900/30'
                                                            : referral.status === 'pending'
                                                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                                                : 'bg-gray-100 dark:bg-gray-700'
                                                            }`}
                                                    >
                                                        <Users
                                                            className={`h-5 w-5 ${referral.status === 'completed'
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : referral.status === 'pending'
                                                                    ? 'text-amber-600 dark:text-amber-400'
                                                                    : 'text-gray-600 dark:text-gray-400'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                            {referral.user.name || referral.user.email}
                                                        </div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            Sign up on {new Date(referral.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <RewardBadge status="available" amount={50} />
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No referrals yet. Start sharing your link or code!
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* How It Works */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mt-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8"
                    >
                        <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
                            How Refer & Earn Works
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {referralSteps.map((step) => {
                                const IconComponent = step.icon;
                                return (
                                    <motion.div
                                        key={step.step}
                                        whileHover={{ scale: 1.05 }}
                                        className="text-center"
                                    >
                                        <div
                                            className={`bg-gradient-to-r ${step.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                                        >
                                            <IconComponent className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            Step {step.step}
                                        </div>
                                        <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {step.title}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400">
                                            {step.description}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <div className="mt-10 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                            <p className="text-blue-700 dark:text-blue-300">
                                <strong>₹50 per friend • No limits • 10% max discount per purchase</strong>
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}