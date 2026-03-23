// TestSeriesCard.tsx
import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
    ShoppingCart,
    Tag,
    CheckCircle,
    Clock,
    FileText,
    Zap,
    Shield,
    Users,
    TrendingUp,
    CalendarDays,
    Lock,
    LockIcon,
    ChevronDown
} from 'lucide-react';


export const TestSeriesCard: React.FC<any> = ({ testSeries: series }) => {
    let navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky top-20 lg:-mt-30 overflow-hidden sm:p-5"
        >
            <div className="p-[1.5px] rounded-2xl overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
                <div className="relative rounded-2xl h-full bg-white p-2 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-[#ADADAC] to-[#ADADAC]/0" />
                    <div style={{ borderRadius: "15px 15px 0px 0px" }} className="relative overflow-hidden h-[170px]">
                        <img
                            src={series?.thumbnailPic || "/images/logo.png"}
                            alt={series?.title}
                            className="object-cover h-full w-full"
                        />
                    </div>

                    <div className="py-2 px-1 space-y-1 cursor-pointer">
                        <h3 className="text-lg font-medium capitalize text-gray-900">
                            {series?.title}
                        </h3>

                        <p className="text-sm text-[#FF6A3D] font-medium">
                            {series?.description || series?.exam?.name}
                        </p>

                        {/* TAGS */}
                        {/* <div className="flex flex-wrap gap-2">
                        <span
                            className="px-3 py-1 rounded-full shadow  bg-[#FFF1EB] text-[#FF6A3D] text-sm uppercase font-medium"
                        >
                            {series?.defaultTestType}
                        </span>
                        <span
                            className="px-3 py-1 rounded-full shadow  bg-[#FFF1EB] text-[#FF6A3D] text-sm uppercase font-medium"
                        >
                            {series?.category?.name}
                        </span>
                    </div> */}

                        {/* META */}
                        <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 pt-2 pb-2">

                            {/* VALIDITY */}
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#FF6A3D]" />
                                Valid for 1 year
                            </div>

                            {/* TOTAL TESTS */}
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-[#FF6A3D]" />
                                Include: {series?.totalTests} Tests
                            </div>
                        </div>

                    </div>

                    {/* FOOTER */}
                    <div className="flex items-start">
                        <div style={{ borderRadius: "0px 0px 12px 15px" }} className="flex-1 f bg-[#FF6A3D] text-center text-white text-3xl font-bold px-4 py-2">
                            {series?.pricing?.isFree ? "Free" : `₹ ${series?.finalPrice || 1000}`}
                        </div>
                        <button style={{ borderRadius: "0px 0px 15px 0px" }} onClick={() => { series?.pricing?.isFree ? "" : navigate(`/checkout/${series?.slug}`, { state: { testSeries: true } }) }} className="flex-1 bg-[#3B3B3B] text-white font-medium py-2 bg-gradient-to-b from-[#545454] via-[#ffffff]/30 to-[#545454] hover:bg-black transition">
                            {series?.pricing?.isFree ? "Start Test" : "Buy Test"}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// TestSeriesTabs.tsx
import {
    BookOpen,
    ListChecks,
    FileQuestion,
} from 'lucide-react';
import { useNavigate } from 'react-router';

interface TestSeriesTabsProps {
    testSeries: any;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TestSeriesTabs: React.FC<TestSeriesTabsProps> = ({
    testSeries,
    activeTab,
    onTabChange
}) => {
    let navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState<number | null>(0)
    const tabs = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'tests', label: 'Tests', icon: ListChecks },
        { id: 'faq', label: 'FAQ', icon: FileQuestion }
    ];

    const faqs = [
        {
            question: "Classes will be on App or Youtube?",
            answer: "All the classes will be available on the app/web version app linkjonty"
        },
        {
            question: "What is the USP of this batch?",
            answer:
                "This batch is designed for PCM + PCB students, featuring live sessions and a comprehensive preparation and revision for state competitive exams."
        },
        {
            question: "Classes will be live or recorded?",
            answer: "All the lectures will be provided in Live format."
        }
    ];


    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 bg-[#FFF0ED] rounded-xl p-4"
                    >
                        <div className='text-gray-800 text-lg'>
                            <span>This Test Series includes</span>
                            <span className='text-[#FF6A3D] font-medium text-xl flex mx-auto flex-col items-center justify-center '>
                                <p>{testSeries?.totalTests}</p>
                                <p>Number of Tests</p>
                            </span>
                        </div>

                        <div>
                            {testSeries?.description && (
                                <p className="text-gray-800 text-lg leading-snug">
                                    {testSeries?.description}
                                </p>
                            )}
                        </div>

                        <div className='text-gray-800' dangerouslySetInnerHTML={{ __html: testSeries?.overview }} />
                        {!testSeries?.overview && <><div>
                            <p className="text-gray-800 mb-4">
                                This comprehensive GRE test series is designed to give you the most authentic
                                exam experience possible. Each test mirrors the actual GRE in format, timing,
                                and difficulty level.
                            </p>
                            <p className="text-gray-700">
                                With detailed performance analytics and personalized feedback, you'll be able
                                to identify your strengths and weaknesses, track your progress, and improve
                                your score effectively.
                            </p>
                        </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                                    <h4 className="font-semibold text-blue-900 mb-3">Key Features</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            <span>Full-length simulated tests</span>
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            <span>Detailed answer explanations</span>
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            <span>Performance tracking</span>
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            <span>Time management tools</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                                    <h4 className="font-semibold text-green-900 mb-3">Exam Structure</h4>
                                    <ul className="space-y-2">
                                        <li className="flex justify-between">
                                            <span>Verbal Reasoning</span>
                                            <span className="font-medium">40 questions</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Quantitative Reasoning</span>
                                            <span className="font-medium">40 questions</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Analytical Writing</span>
                                            <span className="font-medium">2 essays</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Total Duration</span>
                                            <span className="font-medium">3 hours 45 min</span>
                                        </li>
                                    </ul>
                                </div>
                            </div></>}
                    </motion.div>
                );

            case 'tests':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-bold text-gray-900 ">All Tests</h3>
                        {testSeries?.tests?.map((testItem, index) => (
                            <div className="p-[1.1px] rounded-2xl relative bg-gradient-to-b from-[#686868]/0 via-[#686868] to-[#686868]">
                                <div className="absolute -top-4 left-4 bg-gradient-to-r uppercase shadow from-[#2F2F2F] via-[#686868]/80 to-[#2F2F2F] text-white text-sm font-medium px-3 py-2 rounded-lg">
                                    {testSeries?.category.name} Test {index + 1}
                                </div>
                                <div className="rounded-2xl bg-gradient-to-r from-[#EBEBEB] via-[#ffffff] to-[#EBEBEB] p-4 flex justify-between items-start">
                                    <div className="space-y-2 mt-2">
                                        <span className="text-[#FF7046] font-medium">{testItem?.title}</span>
                                        <p className="text-sm text-gray-700">
                                            <span className="text-[#FF7046] font-semibold">{testItem?.totalQuestions}</span> Questions{" "}
                                            | <span className="text-[#FF7046] font-semibold">{testItem?.totalDurationMinutes}</span> Mins{" "}
                                            | Type {" "}<span className="text-[#FF7046] font-semibold uppercase">- {testItem?.testType}</span>
                                            | Difficulty Label {" "}<span className="text-[#FF7046] font-semibold uppercase">- {testItem?.difficultyLabel}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 p-0 m-0">
                                            {testItem?.description}
                                        </p>

                                        {/* <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <CalendarDays className="h-4 w-4" />
                                            Held on Jan 07, 2026 at 09:00 AM
                                        </div> */}
                                    </div>

                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        {testItem?.pricing?.isFree ?
                                            <button onClick={() => navigate(`/gmat/tests/${testItem?._id}`)} className='p-2 rounded-xl bg-[#FF7046] px-4 shadow  text-white hover:bg-[#2F2F2F]'>
                                                Start Test
                                            </button> : <><div className="h-10 w-10 rounded-full bg-[#FFE1D6] flex items-center justify-center">
                                                <LockIcon className="h-5 w-5 text-[#2F2F2F]" />
                                            </div>
                                            <span className="text-xs mt-1">Locked</span></>}
                                    </div>
                                </div>
                            </div>

                        ))}
                    </motion.div>
                );

            case "faq":
                return (
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-[#FF7046]">FAQ's</h3>

                        {faqs.map((faq, index) => {
                            const isOpen = openIndex === index

                            return (
                                <div
                                    key={index}
                                    className="rounded-xl bg-[#EEEEEE] p-[1px] overflow-hidden"
                                >
                                    {/* Question */}
                                    <button
                                        onClick={() =>
                                            setOpenIndex(isOpen ? null : index)
                                        }
                                        className="w-full flex rounded-xl bg-white items-center justify-between px-4 py-3 text-left"
                                    >
                                        <span className="text-[#FF7046] font-medium text-base">
                                            {faq.question}
                                        </span>

                                        <ChevronDown
                                            className={`h-4 w-4 text-[#FF7046] transition-transform ${isOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    {/* Answer */}
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className=""
                                            >
                                                <div className="rounded-xl px-4 py-4 text-base text-gray-800">
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                )
            default:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {tabs.find(tab => tab.id === activeTab)?.label} Content
                        </h3>
                        <p className="text-gray-600">
                            This section contains detailed information about {activeTab}.
                        </p>
                    </motion.div>
                );
        }
    };

    return (
        <>
            <div className=" pt-2">
                <LayoutGroup id="test-series-tabs">
                    <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-xl p-1.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <motion.button
                                    key={tab.id}
                                    layout
                                    onClick={() => onTabChange(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-2 text-base font-medium rounded-lg
                    ${isActive
                                            ? "text-white bg-[#FF7046] shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                        }`}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ y: 0 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="test-series-active-tab"
                                            className="absolute inset-0 bg-[#FF7046] rounded-lg shadow-sm -z-10"
                                            transition={{
                                                type: "spring",
                                                stiffness: 320,
                                                damping: 30,
                                            }}
                                        />
                                    )}

                                    {tab.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </LayoutGroup>
            </div>


            {/* Tab Content */}
            <div className="mt-4">
                {renderTabContent()}
            </div>
        </>
    );
};