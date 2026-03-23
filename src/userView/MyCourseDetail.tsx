import { useState, useEffect, useRef } from "react"
import {
    Star,
    Download,
    ChevronRight,
    BarChart3,
    FileText,
    Video,
    MessageCircle,
    Book,
    Users2,
} from "lucide-react"
import Button from "../components/ui/button/Button"
import api, { ImageBaseUrl } from "../axiosInstance"
import { useNavigate, useParams } from "react-router"
import { motion, LayoutGroup } from "framer-motion"


interface Instructor {
    _id: string
    name: string
    email: string
    bio?: string
    avatar?: string
    rating: number
    totalCourses: number
}

interface CurriculumItem {
    _id: string
    title: string
    duration: string
    type: "video" | "document" | "quiz" | "assignment"
    isPreview: boolean
}

interface CurriculumSection {
    _id: string
    title: string
    items: CurriculumItem[]
}

interface Review {
    _id: string
    user: {
        name: string
        avatar?: string
    }
    rating: number
    comment: string
    date: string
    helpful: number
}

interface Course {
    _id: string
    title: string
    subtitle: string
    code: string
    slug: string
    description: string
    shortDescription: string
    thumbnail: { url: string }
    rating: number
    reviews: number
    studentsEnrolled: number
    duration: string
    pricing: {
        amount: number;
        discount: number;
        originalAmount?: number;
        currency?: string;
        earlyBird?: {
            discount: number;
            deadline: string;
        }
    }
    instructorNames: string[]
    instructors: Instructor[]
    tags: string[]
    status: string
    mode: string
    categoryInfo: { name: string; slug: string }
    subcategoryInfo?: { name: string; slug: string }
    language: string
    featured: boolean
    hasInfinityPlan: boolean
    level: string
    schedule?: {
        startDate: string
        endDate: string
    }
    curriculum: CurriculumSection[]
    reviewsData: Review[]
    objectives: string[]
    requirements: string[]
    targetAudience: string[]
    faqs: { question: string; answer: string }[]
    highlights: string[]
    previewVideoUrl?: string
}

const Badge = ({
    children,
    variant = "default",
    className = "",
}: {
    children: React.ReactNode
    variant?: "default" | "secondary" | "outline"
    className?: string
}) => {
    const baseClasses =
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground",
    }

    return <div className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</div>
}

const CurriculumSkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-5 bg-gray-50 dark:bg-gray-700/50">
                            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[1, 2].map((j) => (
                                <div key={j} className="flex items-center p-5">
                                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded-full mr-4 animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-5/6"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-1/3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function CourseDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("curriculum")
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
    const [isVideoCardFixed, setIsVideoCardFixed] = useState(false)
    const courseHeaderRef = useRef<HTMLDivElement>(null)
    const videoCardRef = useRef<HTMLDivElement>(null)
    const [curriculum, setCurriculum] = useState<{ _id: string; title: string; items: any[] }[]>([]);
    const [curriculumLoading, setCurriculumLoading] = useState(false);
    const curriculumRef = useRef(false); // to ensure fetch only once


    const navigate = useNavigate()

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${slug}`)
                setCourse(response.data.data)
            } catch (error) {
                console.error("Failed to fetch course:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchCourse()
    }, [slug])

    useEffect(() => {
        if (activeTab === "curriculum" && course && !curriculumRef.current) {
            const fetchCurriculum = async () => {
                setCurriculumLoading(true);
                try {
                    const res = await api.get(`/courses/curriculum/${course._id}`);
                    setCurriculum(res.data.curriculum || []);
                    curriculumRef.current = true;
                } catch (err) {
                    console.error("Failed to load curriculum:", err);
                    setCurriculum([]);
                } finally {
                    setCurriculumLoading(false);
                }
            };
            fetchCurriculum();
        }
    }, [activeTab, course]);

    useEffect(() => {
        const handleScroll = () => {
            if (!courseHeaderRef.current || !videoCardRef.current) return

            const headerBottom = courseHeaderRef.current.getBoundingClientRect().bottom
            if (headerBottom <= 0 && !isVideoCardFixed) {
                setIsVideoCardFixed(true)
            } else if (headerBottom > 0 && isVideoCardFixed) {
                setIsVideoCardFixed(false)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isVideoCardFixed])


    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course details...</p>
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Course not found</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">The course you're looking for doesn't exist.</p>
                    <Button className="mt-6" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <motion.div
                ref={courseHeaderRef}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10"
            >
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 items-start">
                        {/* Left: Course Info */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="space-y-1">
                                <h1 className="text-2xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight text-balance">
                                    {course.title}
                                </h1>
                                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed text-pretty max-w-3xl">
                                    {course.shortDescription}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="">
                    <div className="lg:col-span-4">
                        <div className="mb-8">
                            <nav className="relative">
                                <LayoutGroup>
                                    <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-2">
                                        {[
                                            { id: "curriculum", label: "Curriculum", icon: Book },
                                            { id: "instructors", label: "Instructors", icon: Users2 },
                                            { id: "faq", label: "FAQ", icon: MessageCircle }
                                        ].map((tab) => {
                                            const IconComponent = tab.icon;
                                            return (
                                                <motion.button
                                                    key={tab.id}
                                                    layout
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`relative py-3 px-4 font-medium text-sm flex items-center rounded-lg transition-all duration-200
                                                        ${activeTab === tab.id
                                                            ? "text-blue-600 bg-white shadow-sm dark:bg-gray-900 dark:text-blue-400"
                                                            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                                        }`}
                                                    whileHover={{ y: -1 }}
                                                    whileTap={{ y: 0 }}
                                                >
                                                    {activeTab === tab.id && (
                                                        <motion.div
                                                            layoutId="tabBackground"
                                                            className="absolute inset-0 bg-white dark:bg-gray-900 rounded-lg shadow-sm -z-10"
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        />
                                                    )}
                                                    <IconComponent className="h-4 w-4 mr-2" />
                                                    {tab.label}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </LayoutGroup>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="prose prose-blue dark:prose-invert max-w-none">
                            {activeTab === "curriculum" && (
                                <div className="space-y-4">
                                    {/* <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Curriculum</h2> */}

                                    {curriculumLoading ? (
                                        <CurriculumSkeleton />
                                    ) : (
                                        <>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {curriculum.length || 0} sections •{' '}
                                                {curriculum.reduce((acc, section) => acc + section.items.length, 0) || 0} lectures
                                            </p>

                                            <div className="space-y-2">
                                                {curriculum.map((section, sectionIndex) => (
                                                    <div
                                                        key={section._id}
                                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                                                    >
                                                        <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50">
                                                            <h3 className="font-bold text-gray-900 dark:text-white">
                                                                Section {sectionIndex + 1}: {section.title}
                                                            </h3>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {section.items.length} lectures
                                                            </span>
                                                        </div>
                                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                            {section.items.map((item) => (
                                                                <div
                                                                    key={item._id}
                                                                    className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                                >
                                                                    <div className="flex items-center mr-4">
                                                                        {item.type === "video" && <Video className="h-5 w-5 text-blue-500" />}
                                                                        {item.type === "document" && <FileText className="h-5 w-5 text-green-500" />}
                                                                        {item.type === "quiz" && <BarChart3 className="h-5 w-5 text-purple-500" />}
                                                                        {item.type === "assignment" && <Download className="h-5 w-5 text-orange-500" />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div onClick={() =>
                                                                            !item.isLocked && navigate(
                                                                                `/class/${item._id}/${course?._id}?module=${section._id}`
                                                                            )
                                                                        } className="font-medium text-gray-900 dark:text-white cursor-pointer">{item.title}</div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.duration}</div>
                                                                    </div>
                                                                    {item.isPreview && !item.isLocked && (
                                                                        <Button onClick={() =>
                                                                            navigate(
                                                                                `/class/${item._id}/${course?._id}?module=${section._id}`
                                                                            )
                                                                        } variant="outline" size="sm" className="text-blue-600 dark:text-blue-400">
                                                                            Preview
                                                                        </Button>
                                                                    )}
                                                                    {item.isLocked ? (
                                                                        <Button disabled size="sm" variant="outline" className="text-gray-400 cursor-not-allowed">
                                                                            Locked
                                                                        </Button>
                                                                    ) : (
                                                                        <>
                                                                            <ChevronRight onClick={() =>
                                                                                navigate(
                                                                                    `/class/${item._id}/${course?._id}?module=${section._id}`
                                                                                )
                                                                            } className="h-5 w-5 text-gray-400 ml-2" />
                                                                        </>

                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            {activeTab === "instructors" && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meet Your Instructors</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {course.instructorNames?.map((instructor) => (
                                            <div key={instructor._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                                                <div className="flex items-start">
                                                    <img
                                                        src={`https://res.cloudinary.com/dd5s7qpsc/image/upload/${instructor.profilePic}` || "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740"}
                                                        alt={instructor.name || instructor.email}
                                                        className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-100 dark:border-gray-700"
                                                    />
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{instructor.name || 'Teacher'}</h3>
                                                        <div className="flex items-center mt-1">
                                                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                            <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                                                                {4.9} ({'5+'} courses)
                                                            </span>
                                                        </div>
                                                        {instructor.profile && (
                                                            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                                                                {instructor?.profile?.bio}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeTab === "reviews" && (
                                <div className="space-y-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Reviews</h2>
                                        <div className="mt-4 sm:mt-0">
                                            <Button>Write a Review</Button>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="flex items-center mb-6">
                                            <div className="text-5xl font-bold text-gray-900 dark:text-white mr-6">
                                                {course.rating}
                                            </div>
                                            <div>
                                                <div className="flex items-center">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-5 w-5 ${i < Math.floor(course.rating)
                                                                ? "text-yellow-400 fill-current"
                                                                : "text-gray-300 dark:text-gray-600"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="mt-1 text-gray-600 dark:text-gray-400">
                                                    Based on {course.reviews} reviews
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            {course.reviewsData?.slice(0, 5).map((review) => (
                                                <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                                                    <div className="flex items-center mb-3">
                                                        <img
                                                            src={review.user.avatar || "/placeholder-avatar.jpg"}
                                                            alt={review.user.name}
                                                            className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200 dark:border-gray-700"
                                                        />
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 dark:text-white">{review.user.name}</h4>
                                                            <div className="flex items-center mt-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`h-4 w-4 ${i < review.rating
                                                                            ? "text-yellow-400 fill-current"
                                                                            : "text-gray-300 dark:text-gray-600"
                                                                            }`}
                                                                    />
                                                                ))}
                                                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                                    {formatDate(review.date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                                                    <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                        <button className="flex items-center hover:text-gray-700 dark:hover:text-gray-300">
                                                            <MessageCircle className="h-4 w-4 mr-1" />
                                                            Reply
                                                        </button>
                                                        <span className="mx-2">•</span>
                                                        <button className="flex items-center hover:text-gray-700 dark:hover:text-gray-300">
                                                            <span className="mr-1">👍</span>
                                                            Helpful ({review.helpful})
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === "faq" && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                                    <div className="space-y-1">
                                        {[
                                            {
                                                question: "What do your study abroad courses include?",
                                                answer: "Our courses cover everything from English language prep, IELTS/TOEFL training, and subject-specific coaching to application guidance, interview prep, and cultural orientation."
                                            },
                                            {
                                                question: "Are these courses suitable for beginners?",
                                                answer: "Yes! Whether you’re just starting or already advanced, we have beginner, intermediate, and advanced-level courses tailored to your needs."
                                            },
                                            {
                                                question: "How do these courses help with my study abroad application?",
                                                answer: "We focus on strengthening your academic profile, language skills, and test performance so that you can meet admission requirements at top universities abroad."
                                            },
                                            {
                                                question: "Do you provide guidance for visa and admissions along with courses?",
                                                answer: "Absolutely. Along with coaching, we guide you through application essays, SOPs, LORs, and visa interview preparation."
                                            },
                                            {
                                                question: "Are the courses conducted online or offline?",
                                                answer: "We offer both flexible online classes and offline sessions (depending on your location). You can choose what fits you best."
                                            },
                                            {
                                                question: "What makes your study abroad courses different from others?",
                                                answer: "Our trainers have years of experience helping students secure admissions abroad. We provide personalized feedback, mock tests, and one-on-one mentoring."
                                            },
                                            {
                                                question: "How long does it take to complete a course?",
                                                answer: "Course duration ranges from 4 weeks to 6 months, depending on the program and your target university requirements."
                                            },
                                            {
                                                question: "Will these courses improve my chances of getting scholarships?",
                                                answer: "Yes, stronger academic and language skills increase your chances of securing merit-based scholarships abroad."
                                            },
                                            {
                                                question: "Do you provide practice tests and study materials?",
                                                answer: "Yes, we provide updated study guides, sample papers, mock exams, and practice sessions for standardized tests like IELTS, TOEFL, GRE, and GMAT."
                                            },
                                            {
                                                question: "How do I enroll in a course?",
                                                answer: "Simply click on the “Enroll Now” button, fill in your details, and our team will contact you with the next steps."
                                            }
                                        ]?.map((faq, index) => (
                                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                                    className="flex justify-between items-center w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <h3 className="font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                                                    <ChevronRight
                                                        className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === index ? "rotate-90" : ""
                                                            }`}
                                                    />
                                                </button>
                                                {expandedFaq === index && (
                                                    <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}