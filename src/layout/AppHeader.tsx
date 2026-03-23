import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { useAuth } from "../context/UserContext";
import DynamicIcon from "../components/DynamicIcon";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    Gift,
    Sparkles,
    Zap,
    Crown,
    Coins,
    Percent,
    Info,
    ShoppingCart,
    SpeakerIcon,
    Volume2,
    VolumeOff
} from "lucide-react";
import { set } from "date-fns";

const AppHeader: React.FC = () => {
    const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
    const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
    const { user, logout, wallet, toggleSound, isSoundEnabled } = useAuth() as any;
    let navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(isSoundEnabled);

    const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

    const referralWalletBalance = wallet?.balance || 0;
    const totalEarned = wallet?.totalEarned || 0;
    const availableForUse = Math.min(referralWalletBalance, referralWalletBalance);
    const maxUsagePercent = 10;

    const handleToggle = () => {
        if (window.innerWidth >= 1024) {
            toggleSidebar();
        } else {
            toggleMobileSidebar();
        }
    };

    const toggleApplicationMenu = () => {
        setApplicationMenuOpen(!isApplicationMenuOpen);
    };

    const toggleWalletDropdown = () => {
        setIsWalletDropdownOpen(!isWalletDropdownOpen);
    };

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "k") {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getMaxUsableAmount = (coursePrice: number) => {
        const maxFromPercent = coursePrice * (maxUsagePercent / 100);
        return Math.min(maxFromPercent, availableForUse);
    };

    return (
        <header className="sticky top-0 flex w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 z-50 shadow-sm">
            <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
                {/* Mobile Header Section */}
                <div className="flex items-center justify-between w-full gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-3">
                    {/* Sidebar Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                        onClick={handleToggle}
                        aria-label="Toggle Sidebar"
                    >
                        {isMobileOpen ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
                            </svg>
                        )}
                    </motion.button>

                    {/* Mobile Logo */}
                    <Link to="/" className="lg:hidden">
                        <motion.img
                            whileHover={{ scale: 1.05 }}
                            className="dark:hidden h-8"
                            src="https://www.gatewayabroadeducations.com/images/logo.svg"
                            alt="Logo"
                        />
                        <motion.img
                            whileHover={{ scale: 1.05 }}
                            className="hidden dark:block h-8"
                            src="https://www.gatewayabroadeducations.com/images/logo.svg"
                            alt="Logo"
                        />
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleApplicationMenu}
                        className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-400 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 lg:hidden"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z" fill="currentColor" />
                        </svg>
                    </motion.button>
                </div>

                {/* Desktop Navigation Section */}
                <div className={`${isApplicationMenuOpen ? "flex" : "hidden"} items-center justify-between w-full gap-4 px-4 py-3 lg:flex lg:justify-end lg:px-0 lg:py-2`}>
                    <div className="flex items-center gap-2 2xsm:gap-2">
                        {/* Theme Toggle */}
                        <ThemeToggleButton />
                        <button
                            className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-10 w-10 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                            onClick={() => {toggleSound();setIsMuted(!isMuted)}}
                        >
                            {!isMuted ? <VolumeOff className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                        </button>
                        {/* Notification Dropdown */}
                        <NotificationDropdown />

                        {/* Referral Reward Wallet Dropdown */}
                        {user.role != "counselor" && user.role != "teacher" && user.role != "leader" && user.role != "manager" && <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={toggleWalletDropdown}
                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:shadow-md transition-all duration-200 group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                        {formatCurrency(wallet?.balance)}
                                    </span>
                                </div>
                                <ChevronDown className={`h-3 w-3 text-purple-600 dark:text-purple-400 transition-transform duration-200 ${isWalletDropdownOpen ? 'rotate-180' : ''}`} />
                            </motion.button>
                            <AnimatePresence>
                                {isWalletDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
                                    >
                                        {/* Wallet Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Gift className="h-4 w-4 text-purple-500" />
                                                Referral Rewards
                                            </h3>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                <Percent className="h-3 w-3 text-purple-500" />
                                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Max 10%</span>
                                            </div>
                                        </div>

                                        {/* Usage Info */}
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                                            <div className="flex items-start gap-2">
                                                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                                                        Use up to 10% of course price from rewards
                                                    </p>
                                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                                        Applicable on course purchases only
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Balance Overview */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
                                                <div>
                                                    <span className="text-sm font-medium">Available Rewards</span>
                                                    <div className="text-xs opacity-90">Max 10% per course</div>
                                                </div>
                                                <span className="text-lg font-bold">{formatCurrency(wallet?.balance)}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Zap className="h-3 w-3 text-green-500" />
                                                        <span className="text-xs text-green-600 dark:text-green-400">Available</span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                                                        {formatCurrency(availableForUse)}
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Crown className="h-3 w-3 text-blue-500" />
                                                        <span className="text-xs text-blue-600 dark:text-blue-400">Total Earned</span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                        {formatCurrency(totalEarned)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Usage Examples */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Usage Examples</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-600 dark:text-gray-400">₹10,000 :</span>
                                                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                                                        Save up to {formatCurrency(getMaxUsableAmount(10000))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => navigate('/course')}
                                                    className="flex items-center justify-center gap-2 p-2 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                                                >
                                                    <ShoppingCart className="h-3 w-3" />
                                                    Browse Courses
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => navigate('/referrals')}
                                                    className="flex items-center justify-center gap-2 p-2 text-xs text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                                >
                                                    <Coins className="h-3 w-3" />
                                                    Earn More
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* View Details Link */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                className="w-full text-center text-xs text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                                onClick={() => navigate('/referrals?tab=history')}
                                            >
                                                View Reward History →
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>}

                        {user.role != 'counselor' && user.role != 'manager' && user.role != 'leader' && user.role != 'teacher' && <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate("/course/category")}
                                className={`
                                inline-flex items-center justify-center
                                px-4 py-2
                                bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20
                                text-blue-700 dark:text-blue-300
                                font-medium text-sm
                                rounded-xl
                                border border-blue-200 dark:border-blue-800
                                transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                hover:shadow-md hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30
                            `}
                            >
                                <DynamicIcon
                                    name={user.subCategory?.icon || user.category?.icon}
                                    className="h-4 w-4 mr-2"
                                />
                                {user.subCategory?.name || user.category?.name}
                                <Sparkles className="h-3 w-3 ml-1 text-yellow-500" />
                            </motion.button>
                        </>}
                    </div>

                    {/* User Dropdown */}
                    {user.role != 'counselor' && user.role != 'manager' && user.role != 'leader' && <UserDropdown user={user} logout={logout} />}

                </div>
            </div>
        </header>
    );
};

export default AppHeader;