import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import api from '../axiosInstance';
import WritingSummary from './WritingSummary';

// Timer Component
const Timer: React.FC<{ initialTime: number; onTimeUp: () => void }> = ({ initialTime, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        setTimeLeft(initialTime);
    }, [initialTime]);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp]);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`text-lg font-mono px-3 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
            } text-white`}>
            {formatTime(timeLeft)}
        </div>
    );
};

interface WritingSectionProps {
    testId?: string;
    onTestComplete?: (results: any) => void;
    onNextQuestion?: () => void;
    darkMode?: boolean;
    standalone?: boolean;
}

const WritingSection: React.FC<WritingSectionProps> = ({
    testId: propTestId,
    onTestComplete,
    onNextQuestion,
    darkMode = true,
    standalone = true
}) => {
    const paramsTestId = useParams().testId;
    const testId = propTestId || paramsTestId;

    const { register, watch, setValue, handleSubmit } = useForm();

    // States
    const [timeLeft, setTimeLeft] = useState(0);
    const [testData, setTestData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [wordCount, setWordCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [writingResults, setWritingResults] = useState<any>(null);
    const [isWritingCompleted, setIsWritingCompleted] = useState(false);
    const [localDarkMode, setLocalDarkMode] = useState(darkMode);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const currentDarkMode = darkMode !== undefined ? darkMode : localDarkMode;

    // Helper: calculate word count
    const calculateWordCount = (text: string) => {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    // Get current question data
    const getCurrentQuestionData = () => {
        if (!testData) return null;
        return testData.currentQuestion || testData;
    };

    // Extract title
    const extractTitle = () => {
        const currentQuestion = getCurrentQuestionData();
        return currentQuestion?.title || "Writing Test";
    };

    // Extract instruction
    const extractInstruction = () => {
        const currentQuestion = getCurrentQuestionData();
        return currentQuestion?.content?.instruction || "Complete the writing task below.";
    };

    // Extract content (for display)
    const extractContent = () => {
        const currentQuestion = getCurrentQuestionData();
        if (!currentQuestion) return "Writing task content will appear here.";
        return currentQuestion.content?.passageText ||
            currentQuestion.content?.text ||
            (typeof currentQuestion.content === 'string' ? currentQuestion.content : '');
    };

    // Get stable question ID
    const getCurrentQuestionId = () => {
        const currentQuestion = getCurrentQuestionData();
        return currentQuestion?._id || currentQuestion?.id || `writing_${currentQuestionIndex}`;
    };

    // Get progress info
    const getProgressInfo = () => {
        if (!testData) return { current: 1, total: 1 };
        const total = testData.totalQuestions || testData.progress?.totalQuestions || 1;
        const current = currentQuestionIndex + 1;
        return { current, total };
    };

    // Format answers for submission
    const formatAnswersForSubmission = (formData: any) => {
        const answers = [];
        const currentQuestion = getCurrentQuestionData();
        const questionId = currentQuestion?._id || currentQuestion?.id;

        if (!questionId) return answers;

        const essayAnswer = formData[questionId] || '';
        if (essayAnswer.trim() !== '') {
            answers.push({
                questionId: questionId,
                answer: essayAnswer
            });
        }

        return answers;
    };

    // Handle time up
    const handleTimeUp = () => {
        console.log("⏰ Time's up! Auto-submitting...");
        handleSubmit(handleWritingSubmit)();
    };

    // Toggle dark mode
    const toggleDarkMode = () => {
        if (darkMode === undefined) {
            setLocalDarkMode(!localDarkMode);
        }
    };

    // Calculate total writing tasks
    const calculateTotalQuestions = () => {
        return testData?.totalQuestions || testData?.progress?.totalQuestions || 1;
    };

    // Auto-fill answer for current question
    const autoFillWritingAnswer = (questionIndex: number, apiResponse = null) => {
        const currentQuestion = getCurrentQuestionData();
        if (!currentQuestion) return;

        const questionId = currentQuestion._id || currentQuestion.id || `writing_${questionIndex}`;
        const userAnswers = (apiResponse?.userAnswer || testData?.userAnswer || [])
            .filter((item: any) => item.answer !== null && item.answer !== '');

        const answer = userAnswers.find((ans: any) =>
            ans.questionId === questionId ||
            ans.questionId === currentQuestion._id
        );

        setTimeout(() => {
            if (answer && answer.answer) {
                const essayAnswer = String(answer.answer).trim();
                setValue(questionId, essayAnswer, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true
                });
                setWordCount(calculateWordCount(essayAnswer));
            } else {
                setValue(questionId, "", { shouldValidate: true, shouldDirty: false });
                setWordCount(0);
            }
        }, 100);
    };

    // Submit current answer and go to next
    const handleNextQuestion = async () => {
        try {
            setIsSubmitting(true);
            const currentAnswers = watch();
            const formattedAnswers = formatAnswersForSubmission(currentAnswers);

            const totalQuestions = calculateTotalQuestions();
            const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

            const submissionData = {
                answers: formattedAnswers,
                lastQuestionIndex: currentQuestionIndex,
                timeSpent: 60 * 60 - timeLeft,
                completed: isLastQuestion,
            };

            let response;
            try {
                response = await api.post(`/test/session/${sessionId}/submit`, submissionData);
            } catch (submitError) {
                console.error("Submit error:", submitError);
                if (!isLastQuestion) {
                    const newIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(newIndex);
                    setTimeout(() => autoFillWritingAnswer(newIndex), 100);
                }
                return;
            }

            if (response?.data?.success) {
                if (response.data.isTestCompleted) {
                    setIsWritingCompleted(true);
                    setWritingResults(response.data.analysis);
                } else {
                    setTestData(prev => ({
                        ...prev,
                        ...response.data,
                        currentQuestion: response.data.currentQuestion || response.data.data?.currentQuestion,
                        progress: response.data.progress || response.data.data?.progress || prev.progress
                    }));
                }

                if (!isLastQuestion) {
                    const newIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(newIndex);
                    setTimeout(() => autoFillWritingAnswer(newIndex, response.data), 100);
                }
            }
        } catch (err) {
            console.error("handleNextQuestion error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Go to previous question
    const goToPreviousQuestion = async () => {
        if (currentQuestionIndex <= 0) return;

        try {
            setIsSubmitting(true);

            // Submit current answer first
            const currentAnswers = watch();
            const formattedAnswers = formatAnswersForSubmission(currentAnswers);
            //   await api.post(`/test/session/${sessionId}/submit`, {
            //     answers: formattedAnswers,
            //     lastQuestionIndex: currentQuestionIndex,
            //     timeSpent: 60 * 60 - timeLeft,
            //     completed: false,
            //   });

            // Fetch previous question
            const response = await api.get(`/test/session/${sessionId}/previous`);

            if (response.data.success) {
                const prevQuestion = response.data.currentQuestion || response.data.data?.currentQuestion;
                if (!prevQuestion) throw new Error("No previous question");

                setTestData(prev => ({
                    ...prev,
                    currentQuestion: prevQuestion,
                    progress: response.data.progress || response.data.data?.progress || prev.progress,
                }));

                const newQuestionIndex = Math.max(0, (response.data.progress?.currentQuestion || currentQuestionIndex) - 1);
                setCurrentQuestionIndex(newQuestionIndex);

                const userAnswers = (response?.data?.userAnswer || [])
                    .filter(item => item.questionId && item.answer !== null && item.answer != '');

                userAnswers.map(ans => setValue(ans.questionId, ans.answer || ''))
            }
        } catch (err) {
            console.error("Failed to go back:", err);
            // Fallback: just go back in UI
            const newIndex = currentQuestionIndex - 1;
            setCurrentQuestionIndex(newIndex);
            setTimeout(() => autoFillWritingAnswer(newIndex), 100);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit final test
    const handleWritingSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            const formattedAnswers = formatAnswersForSubmission(data);
            const submissionData = {
                answers: formattedAnswers,
                timeSpent: 60 * 60 - timeLeft,
                completed: true
            };

            const response = await api.post(`/test/session/${sessionId}/submit`, submissionData);

            if (response.data.success && response.data.isTestCompleted) {
                const results = response.data.analysis;
                setWritingResults(results);

                if (onTestComplete) {
                    onTestComplete(results);
                } else {
                    setIsWritingCompleted(true);
                }
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            alert("Error submitting writing test. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch test data on mount
    useEffect(() => {
        if (!testId) return;

        const fetchTestData = async () => {
            try {
                setLoading(true);
                const response = await api.post('/test/start', { testSeriesId: testId });

                setTestData(response.data);
                setSessionId(
                    response.data?.sessionId ||
                    response.data?.testSessionId ||
                    response.data?.data?.sessionId ||
                    response.data?.data?.testSessionId
                );

                let initialTime = 60 * 60;
                if (response.data.timeRemaining !== undefined) {
                    initialTime = response.data.timeRemaining;
                } else if (response.data.duration) {
                    initialTime = response.data.duration * 60;
                }
                setTimeLeft(initialTime);

                // Set initial question index
                if (response.data.lastQuestionIndex !== undefined) {
                    setCurrentQuestionIndex(response.data.lastQuestionIndex);
                }

                // Auto-fill if answers exist
                if (response.data.userAnswer?.length > 0) {
                    setTimeout(() => autoFillWritingAnswer(response.data.lastQuestionIndex || 0, response.data), 200);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to load writing test");
            } finally {
                setLoading(false);
            }
        };

        fetchTestData();
    }, [testId]);

    // Update word count for essay
    const questionId = getCurrentQuestionId();
    const writingAnswer = watch(questionId);
    useEffect(() => {
        setWordCount(calculateWordCount(writingAnswer));
    }, [writingAnswer, questionId]);

    // Show results if completed (standalone mode)
    if (standalone && isWritingCompleted && writingResults) {
        return (
            <WritingSummary
                results={writingResults}
                onClose={() => setIsWritingCompleted(false)}
                darkMode={currentDarkMode}
            />
        );
    }

    if (!standalone && isWritingCompleted) {
        return null;
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-xl">Loading writing test...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Error Loading Test</h2>
                    <p className="text-gray-400 mb-2">{error}</p>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-white"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const progress = getProgressInfo();
    const isLastQuestion = currentQuestionIndex >= calculateTotalQuestions() - 1;
    const minWords = currentQuestionIndex === 0 ? 150 : 250;

    return (
        <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 w-full">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-bold">{extractTitle()}</h1>
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-600">
                            Essay Writing
                        </span>
                        <span className="text-sm text-gray-400">
                            Task {progress.current} of {progress.total}
                        </span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className={`px-3 py-1 rounded-lg ${wordCount < minWords ? 'bg-yellow-600' : 'bg-green-600'
                            } text-white`}>
                            Words: {wordCount}/{minWords}
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg bg-gray-700 text-white hover:opacity-80"
                        >
                            {currentDarkMode ? '☀️' : '🌙'}
                        </button>

                        <Timer initialTime={timeLeft} onTimeUp={handleTimeUp} />

                        {isLastQuestion ? (
                            <button
                                onClick={handleSubmit(handleWritingSubmit)}
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Test"}
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                            >
                                {isSubmitting ? "Loading..." : "Next Task"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex w-full" style={{ height: 'calc(100vh - 80px)' }}>
                {/* Left Panel - Instructions */}
                <div className="w-2/5 bg-gray-800 p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-3">Instructions:</h3>
                            <div className="bg-gray-600 rounded-lg p-4">
                                <p className="text-gray-200 leading-relaxed text-lg whitespace-pre-line">
                                    {extractInstruction()}
                                </p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white mb-3">Task Content:</h3>
                            <div className="bg-gray-600 rounded-lg p-4">
                                {getCurrentQuestionData()?.content?.imageUrl && (
                                    <img
                                        src={getCurrentQuestionData().content.imageUrl}
                                        alt="Writing task diagram"
                                        className="max-w-full max-h-96 mx-auto rounded-lg mb-4"
                                    />
                                )}
                                <div
                                    className="prose prose-invert max-w-none text-gray-200 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: extractContent() }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Writing Area */}
                <div className="w-3/5 bg-gray-900 p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit(handleWritingSubmit)} className="bg-gray-80 rounded-lg p-6 h-full flex flex-col">
                        {/* Word Count Progress */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span>Word Count: {wordCount}</span>
                                <span>Minimum: {minWords} words</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${wordCount < minWords / 2 ? 'bg-red-500' :
                                        wordCount < minWords ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.min((wordCount / minWords) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Essay Textarea */}
                        <textarea
                            {...register(questionId)}
                            placeholder={`Write at least ${minWords} words...`}
                            className="flex-1 w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white resize-none font-mono text-lg leading-relaxed"
                            style={{ minHeight: '400px' }}
                            onChange={(e) => setWordCount(calculateWordCount(e.target.value))}
                        />

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-6 pt-6 border-t border-gray-700">
                            {currentQuestionIndex > 0 ? (
                                <button
                                    type="button"
                                    onClick={goToPreviousQuestion}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Loading..." : "Previous Task"}
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {isLastQuestion ? (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Writing"}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleNextQuestion}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Loading..." : "Next Task"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WritingSection;