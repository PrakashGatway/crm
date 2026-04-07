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
    VolumeOff,
    ChevronLeft,
    ChevronRight
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
        <header className="sticky top-0 flex w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 z-50">
            <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
                {/* Mobile Header Section */}
                <div className="flex items-center justify-between w-full gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-3">
                    {/* Sidebar Toggle */}
                    <motion.button
                        className="lg:hidden"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleToggle}
                    ><ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" /></motion.button>

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
                    <div className="flex items-center justify-end">
                        <div className="sm:flex items-center gap-1 justify-center ">
                            <p className="text-sm text-gray-500">Welcome back,</p>
                            <h2 className="text-lg font-semibold text-gray-800">
                                {user?.name} 👋
                            </h2>
                        </div>
                    </div>
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

                <div className={`${isApplicationMenuOpen ? "flex" : "hidden"} items-center justify-between w-full gap-4 px-4 py-3 lg:flex lg:justify-end lg:px-0 lg:py-2`}>
                    <div className="flex items-center gap-2 2xsm:gap-2">
                        {/* Theme Toggle */}
                        <ThemeToggleButton />
                        <button
                            className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-10 w-10 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                            onClick={() => { toggleSound(); setIsMuted(!isMuted) }}
                        >
                            {!isMuted ? <VolumeOff className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                        </button>
                        {/* Notification Dropdown */}
                        <NotificationDropdown />
                    </div>

                    {/* User Dropdown */}
                    {<UserDropdown user={user} logout={logout} />}

                </div>
            </div>
        </header>
    );
};

export default AppHeader;