import { useState, useRef, useEffect } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Settings,
    HelpCircle,
    LogOut,
    CreditCard,
    ChevronDown
} from "lucide-react";

export default function UserDropdown({ user, logout }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }

    const handleLogout = async () => {
        try {
            await logout();
            closeDropdown();
        } catch (error: any) {
            console.error("Logout failed:", error);
        }
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* User Avatar Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleDropdown}
                className={`
                    flex items-center gap-1
                    bg-white dark:bg-gray-800  
                    rounded-full 
                    transition-all duration-200 
                    hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                    ${isOpen ? "shadow-lg border-blue-300 dark:border-blue-600" : ""}
                `}
            >
                {/* User Avatar */}
                <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user?.name || "User"}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            getUserInitials(user?.name || "User")
                        )}
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-80 z-50"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                            {/* User Header Section */}
                            <div className="p-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                                        {user?.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user?.name || "User"}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getUserInitials(user?.name || "User")
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {user?.name || "User"}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2">
                                <nav className="space-y-1">
                                    <DropdownItem
                                        onItemClick={closeDropdown}
                                        tag="a"
                                        to="/profile"
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group"
                                    >
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Profile</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">View and edit your profile</div>
                                        </div>
                                    </DropdownItem>

                                    <DropdownItem
                                        onItemClick={closeDropdown}
                                        tag="a"
                                        to="/settings"
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                                    >
                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Settings</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Account preferences</div>
                                        </div>
                                    </DropdownItem>

                                    <DropdownItem
                                        onItemClick={closeDropdown}
                                        tag="a"
                                        to="/billing"
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 group"
                                    >
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Billing</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Payment methods & invoices</div>
                                        </div>
                                    </DropdownItem>
                                    <DropdownItem
                                        onItemClick={closeDropdown}
                                        tag="a"
                                        to="/support"
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 group"
                                    >
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Help & Support</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Get help and contact support</div>
                                        </div>
                                    </DropdownItem>
                                </nav>
                            </div>

                            {/* Footer Section */}
                            <div className="p-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}