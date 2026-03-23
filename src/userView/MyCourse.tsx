// src/pages/MyCoursesPage.tsx
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Clock,
    BookOpen,
    CheckCircle,
    Search,
    Grid,
    List,
    Award,
    Sparkles,
    Trophy,
    Brain,
    Zap,
    Crown,
    Target,
    Timer,
    ChevronRight,
    Rocket,
    Lightbulb
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api, { ImageBaseUrl } from "../axiosInstance";
import { useNavigate } from "react-router";

// Types
interface CourseProgress {
    percentage: number;
    completedLessons: Array<{
        lesson: string;
        completedAt: string;
    }>;
}

interface PurchasedCourse {
    _id: string;
    course: {
        _id: string;
        title: string;
        subtitle?: string;
        slug: string;
        thumbnail: { url: string };
        level: string;
        language: string;
        status: string;
        duration?: string;
        rating?: number;
        studentsEnrolled?: number;
    };
    enrolledAt: string;
    accessExpiresAt?: string;
    isActive: boolean;
    isCompleted: boolean;
    completedAt?: string;
    progress: CourseProgress;
    totalTimeSpent: number; // in seconds
    lastAccessedAt?: string;
    isExpired?: boolean; // virtual field
}

const CourseCard = ({ course, viewMode }: { course: PurchasedCourse; viewMode: "grid" | "list" }) => {
    const progress = course.progress?.percentage || 0;
    const isCompleted = course.isCompleted || progress >= 100;
    const isRecentlyAccessed = course.lastAccessedAt
        ? new Date(course.lastAccessedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        : false;
    const isNew = new Date(course.enrolledAt).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000;
    const timeRemaining = course.accessExpiresAt
        ? Math.ceil((new Date(course.accessExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    const getLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
            case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
            case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
        }
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'from-emerald-400 to-green-500';
        if (progress >= 50) return 'from-blue-400 to-cyan-500';
        if (progress >= 25) return 'from-amber-400 to-orange-500';
        return 'from-gray-300 to-gray-400';
    };

    const navigate = useNavigate();

    if (viewMode === "list") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/80 hover:shadow-xl transition-all duration-500 hover:border-blue-200 dark:hover:border-blue-800/50 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-900/5 dark:via-gray-800 dark:to-purple-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative flex items-center p-6 z-10">
                    <div className="relative flex-shrink-0">
                        <div className="relative w-56 h-32 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-500">
                            <img
                                src={!course.course.thumbnail?.url
                                    ? 'https://www.gatewayabroadeducations.com/images/logo.svg'
                                    : `${ImageBaseUrl}/${course.course.thumbnail.url}`
                                }
                                alt={course.course.title}
                                className="w-full h-full object-cover transform transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </div>

                        <div className="absolute -top-2 -left-2 flex flex-col gap-2">
                            {isNew && (
                                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg border border-amber-300/50">
                                    <Rocket className="h-3 w-3 mr-1" />
                                    New
                                </div>
                            )}
                            {isRecentlyAccessed && !isCompleted && (
                                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg border border-green-300/50">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Recent
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 ml-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelColor(course.course.level)}`}>
                                        {course.course.level}
                                    </span>
                                    {isCompleted && (
                                        <div className="flex items-center bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs border border-amber-300/50">
                                            <Award className="h-3 w-3 mr-1" />
                                            Certificate Ready
                                        </div>
                                    )}
                                </div>

                                <h3
                                    onClick={() => navigate(`/courses/${course.course.slug}`)}
                                    className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 cursor-pointer"
                                >
                                    {course.course.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-2 line-clamp-2">
                                    {course.course?.shortDescription}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {timeRemaining && timeRemaining > 0 && (
                                    <div className="flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 rounded-xl text-sm border border-red-200 dark:border-red-800">
                                        <Clock className="h-4 w-4 mr-1.5" />
                                        {timeRemaining} days left
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-3">
                                {isCompleted ? (
                                    <Button
                                        onClick={() => navigate(`/courses/${course.course.slug}/certificate`)}
                                        size="sm"
                                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                    >
                                        <Trophy className="h-4 w-4 mr-2" />
                                        Get Certificate
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => navigate(`/courses/${course.course.slug}`)}
                                        size="sm"
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                    >
                                        {progress === 0 ? "Start Learning" : "Continue"}
                                        <ChevronRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Grid View
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 hover:shadow-xl transition-all duration-500 hover:border-blue-200 dark:hover:border-blue-800/50 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-900/5 dark:via-gray-800 dark:to-purple-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative h-40 overflow-hidden">
                <img
                    src={!course.course.thumbnail?.url
                        ? 'https://www.gatewayabroadeducations.com/images/logo.svg'
                        : `${ImageBaseUrl}/${course.course.thumbnail.url}`
                    }
                    alt={course.course.title}
                    className="w-full h-full object-cover transform transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isNew && (
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg border border-amber-300/50">
                            <Rocket className="h-3 w-3 mr-1" />
                            New
                        </div>
                    )}
                    {!course.accessExpiresAt && (
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg border border-purple-300/50">
                            <Crown className="h-3 w-3 mr-1" />
                            Lifetime
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelColor(course.course.level)}`}>
                        {course.course.level}
                    </span>
                    {isCompleted && (
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    )}
                </div>
            </div>

            <div className="relative p-4 pt-2 z-10">
                <div className="mb-2">
                    <h3
                        onClick={() => navigate(`/courses/${course.course.slug}`)}
                        className="font-semibold text-gray-900 dark:text-white text-base mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 cursor-pointer"
                    >
                        {course.course.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2">
                        {course?.course?.shortDescription}
                    </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {course.course.rating && (
                        <div className="flex items-center">
                            <svg className="h-3 w-3 mr-1 text-amber-400 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {course.course.rating}
                        </div>
                    )}
                    {/* {timeRemaining && timeRemaining > 0 && (
                        <div className="flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1 rounded-xl text-sm border border-red-200 dark:border-red-800">
                            <Clock className="h-4 w-4 mr-1.5" />
                            {timeRemaining} days left
                        </div>
                    )} */}
                </div>

                <Button
                    onClick={() => navigate(`/courses/${course.course.slug}`)}
                    className="w-full rounded-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-0.5 group"
                    size="sm"
                >
                    {isCompleted ? (
                        <>
                            <Trophy className="h-4 w-4 mr-1" />
                            View Certificate
                        </>
                    ) : (
                        <>
                            {progress === 0 ? "Start Learning" : "Continue"}
                        </>
                    )}
                    <ChevronRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
            </div>
        </motion.div>
    );
};

const CourseSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => {
    if (viewMode === "list") {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="flex items-center">
                    <div className="w-56 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="flex-1 ml-6 space-y-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="flex space-x-2 mt-4">
                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl mt-4"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 animate-pulse overflow-hidden">
            <div className="w-full h-40 bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="flex justify-between">
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
        </div>
    );
};

export default function MyCoursesPage() {
    const [courses, setCourses] = useState<PurchasedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyCourses = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get("/purchase", {
                    params: {
                        populate: "course",
                        sort: "-lastAccessedAt,-enrolledAt"
                    }
                });
                setCourses(response.data.data || []);
            } catch (err: any) {
                console.error("Failed to fetch purchased courses:", err);
                setError(err.response?.data?.message || "Failed to load courses");
            } finally {
                setLoading(false);
            }
        };

        fetchMyCourses();
    }, []);

    // Derived data
    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch =
                course.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (course.course.subtitle && course.course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

            const progress = course.progress.percentage;
            const isCompleted = course.isCompleted || progress >= 100;

            const matchesFilter =
                filter === "all" ||
                (filter === "in-progress" && !isCompleted && progress > 0) ||
                (filter === "completed" && isCompleted);

            return matchesSearch && matchesFilter;
        });
    }, [courses, searchQuery, filter]);

    // Stats
    const stats = useMemo(() => {
        const total = courses.length;
        const completed = courses.filter(c => c.isCompleted || c.progress.percentage >= 100).length;
        const inProgress = courses.filter(c => !c.isCompleted && c.progress.percentage > 0).length;
        const totalTimeSeconds = courses.reduce((sum, c) => sum + (c.totalTimeSpent || 0), 0);
        const avgProgress = total > 0
            ? Math.round(courses.reduce((sum, c) => sum + c.progress.percentage, 0) / total)
            : 0;

        return {
            total,
            completed,
            inProgress,
            totalTimeSeconds,
            avgProgress
        };
    }, [courses]);

    const filterButtons = [
        { key: "all" as const, label: "All Courses", icon: Grid },
        // { key: "in-progress" as const, label: "In Progress", icon: Play },
        // { key: "completed" as const, label: "Completed", icon: CheckCircle },
    ];

    return (
        <div className="min-h-[85vh] bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { label: "Total Courses", value: stats.total.toString(), icon: BookOpen },
                            { label: "Completed", value: stats.completed.toString(), icon: CheckCircle },
                            { label: "In Progress", value: stats.inProgress.toString(), icon: Brain },
                            {
                                label: "Learning Time",
                                value: `${Math.floor(stats.totalTimeSeconds / 3600)}h ${Math.floor((stats.totalTimeSeconds % 3600) / 60)}m`,
                                icon: Timer
                            },
                            { label: "Avg Progress", value: `${stats.avgProgress}%`, icon: Target }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow border border-gray-200/50 dark:border-gray-700/50 p-4 text-center"
                            >
                                <stat.icon className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div> */}

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-4"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="relative flex-1 max-w-full mr-4">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses, instructors, or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-inner transition-all duration-300"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 overflow-x-auto">
                                {filterButtons.map((filterOption) => {
                                    const IconComponent = filterOption.icon;
                                    return (
                                        <button
                                            key={filterOption.key}
                                            onClick={() => setFilter(filterOption.key)}
                                            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${filter === filterOption.key
                                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                        >
                                            <IconComponent className="h-4 w-4 mr-2" />
                                            {filterOption.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "grid"
                                        ? "bg-white dark:bg-gray-600 shadow-lg text-blue-600 transform scale-110"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <Grid className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "list"
                                        ? "bg-white dark:bg-gray-600 shadow-lg text-blue-600 transform scale-110"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <List className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Results */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
                            {searchQuery && ` for "${searchQuery}"`}
                        </p>
                        {filteredCourses.length > 0 && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <Lightbulb className="h-4 w-4" />
                                <span>Sorted by: Recent Activity</span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" : "space-y-6"}>
                            {[...Array(viewMode === "grid" ? 8 : 4)].map((_, index) => (
                                <CourseSkeleton key={index} viewMode={viewMode} />
                            ))}
                        </div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                                <BookOpen className="h-16 w-16 text-red-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops! Something went wrong</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                                <Button
                                    onClick={() => window.location.reload()}
                                    size="lg"
                                    className="rounded-xl px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </motion.div>
                    ) : filteredCourses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="p-10 ">
                                <BookOpen className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    {searchQuery || filter !== "all"
                                        ? "No courses match your criteria"
                                        : "Start Your Learning Journey"}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                                    {searchQuery || filter !== "all"
                                        ? "Try adjusting your search or filter to find what you're looking for."
                                        : "Explore our catalog and enroll in your first course to begin learning."
                                    }
                                </p>
                                <Button
                                    onClick={() => navigate('/course')}
                                    size="lg"
                                    className="rounded-xl px-8 py-2.5 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
                                >
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Browse Courses
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" : "space-y-6"}>
                            <AnimatePresence>
                                {filteredCourses.map((course) => (
                                    <CourseCard
                                        key={course._id}
                                        course={course}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}