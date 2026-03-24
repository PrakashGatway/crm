import { useState, useEffect, useRef } from "react"
import {
    Star,
    Users,
    Clock,
    Calendar,
    BookOpen,
    MapPin,
    Award,
    Download,
    Play,
    CheckCircle,
    ChevronRight,
    BarChart3,
    FileText,
    Video,
    MessageCircle,
    Shield,
    Book,
    Target,
    Users2,
    Sparkles,
    Globe,
    PlayCircle,
    Zap,
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

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-lg border bg-gray-200 shadow-sm ${className}`}>{children}</div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`${className}`}>{children}</div>
)

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

