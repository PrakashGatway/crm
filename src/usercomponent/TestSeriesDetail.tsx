// TestSeriesDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TestSeriesCard, TestSeriesTabs } from './TestSeriesComponent';
import { LeftSlider, RightOffer } from './TestSeriesSlider';
import { useParams } from 'react-router';
import api from '../axiosInstance';

const TestSeriesDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>()
    const [testSeries, setTestSeries] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!slug) return

        const fetchTestSeries = async () => {
            try {
                setLoading(true)

                const res = await api.get(`/mcu/series/${slug}`)
                setTestSeries(res.data.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchTestSeries()
    }, [slug])

    // Loading state
    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
                />
            </div>
        );
    }

    if (!testSeries) {
        return <div className="min-h-[80vh] flex items-center justify-center">
            <h1 className="text-2xl font-semibold text-gray-600">
                Test Series not found
            </h1>
        </div>
    }

    return (
        <div className="min-h-[85vh] max-w-7xl mx-auto p-4">
            <div className="grid max-h-[250px] grid-cols-3 lg:grid-cols-3 gap-1 rounded-3xl space-x-2 mb-4">
                <LeftSlider />
                <RightOffer content={true} />
            </div>

            <div className="mx-auto p-1">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-2/3">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className=""
                        >
                            <div className="flex flex-col md:flex-row md:items-start">
                                <div className="md:w-2/3">
                                    <h1 className="text-2xl uppercase font-medium text-gray-600 mb-2">
                                        {testSeries?.title}
                                    </h1>
                                </div>
                            </div>
                        </motion.div>
                        

                        <TestSeriesTabs
                            testSeries={testSeries}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-10"
                        >
                            <div className="mx-auto">
                                <div className="flex items-center gap-4 rounded-2xl border border-[#E5E5E5] bg-white p-2 px-4">

                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src="/images/iels/listening.png"
                                            alt="Support"
                                            className="h-full w-24"
                                        />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 text-sm">
                                        <p className="text-[#FF7046] font-semibold text-base">
                                            Still have some queries?
                                        </p>

                                        <p className="text-gray-600 leading-snug">
                                            Call Us at{" "}
                                            <a
                                                href="tel:09509829849"
                                                className="text-[#FF7046] font-semibold"
                                            >
                                                09509829849
                                            </a>
                                            <br />
                                            Or chat with our customer support
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    <div className="lg:w-1/3">
                        <TestSeriesCard testSeries={testSeries} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestSeriesDetailPage;