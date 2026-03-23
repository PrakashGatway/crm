// pages/FullTestsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Clock,
  LayoutList,
  ListChecks,
  Target,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Timer,
} from "lucide-react";
import Button from "../components/ui/button/Button";

type ExamId = "gmat" | "gre" | "sat";

interface SectionConfig {
  id: string;
  name: string;
  durationMinutes: number;
  questionCount: number;
  questionTypeLabel: string;
}

interface ExamConfig {
  id: ExamId;
  name: string;
  subtitle: string;
  totalQuestions: number;
  totalDurationMinutes: number;
  difficulty: "Medium" | "High";
  sections: SectionConfig[];
  accentColor: string;
}

interface DummyQuestion {
  id: string;
  examId: ExamId;
  sectionId: string;
  index: number;
  text: string;
  options: string[];
}

const exams: ExamConfig[] = [
  {
    id: "gmat",
    name: "GMAT Focus Full Test",
    subtitle: "Quant, Verbal & Data Insights",
    totalQuestions: 64, // 21 + 23 + 20
    totalDurationMinutes: 135, // 45 + 45 + 45
    difficulty: "High",
    accentColor: "blue",
    sections: [
      {
        id: "gmat-quant",
        name: "Quantitative Reasoning",
        durationMinutes: 45,
        questionCount: 21,
        questionTypeLabel: "GMAT Quant (Problem Solving & Data Sufficiency)",
      },
      {
        id: "gmat-verbal",
        name: "Verbal Reasoning",
        durationMinutes: 45,
        questionCount: 23,
        questionTypeLabel: "GMAT Verbal (RC / CR / SC)",
      },
      {
        id: "gmat-di",
        name: "Data Insights",
        durationMinutes: 45,
        questionCount: 20,
        questionTypeLabel: "GMAT Data Insights",
      },
    ],
  },
  {
    id: "gre",
    name: "GRE General Full Test",
    subtitle: "Analytical Writing, Verbal & Quant",
    totalQuestions: 55, // 27 verbal + 27 quant + 1 AWA (essay)
    totalDurationMinutes: 118, // 30 + 41 + 47 (no break)
    difficulty: "High",
    accentColor: "emerald",
    sections: [
      {
        id: "gre-aw",
        name: "Analytical Writing",
        durationMinutes: 30,
        questionCount: 1,
        questionTypeLabel: "GRE Analytical Writing – Analyze an Issue",
      },
      {
        id: "gre-verbal",
        name: "Verbal Reasoning",
        durationMinutes: 41,
        questionCount: 27,
        questionTypeLabel:
          "GRE Verbal (Reading Comprehension, Text Completion, Sentence Equivalence)",
      },
      {
        id: "gre-quant",
        name: "Quantitative Reasoning",
        durationMinutes: 47,
        questionCount: 27,
        questionTypeLabel: "GRE Quantitative Reasoning",
      },
    ],
  },
  {
    id: "sat",
    name: "Digital SAT Full Test",
    subtitle: "Reading & Writing + Math",
    totalQuestions: 98, // 54 RW + 44 Math
    totalDurationMinutes: 134, // 64 + 70 (no break counted)
    difficulty: "Medium",
    accentColor: "violet",
    sections: [
      {
        id: "sat-rw",
        name: "Reading & Writing",
        durationMinutes: 64,
        questionCount: 54,
        questionTypeLabel: "SAT Reading & Writing (2 × 27 adaptive modules)",
      },
      {
        id: "sat-math",
        name: "Math",
        durationMinutes: 70,
        questionCount: 44,
        questionTypeLabel: "SAT Math (2 × 22 adaptive modules)",
      },
    ],
  },
];

const buildDummyQuestions = (
  exam: ExamConfig
): Record<string, DummyQuestion[]> => {
  const bySection: Record<string, DummyQuestion[]> = {};
  exam.sections.forEach((sec) => {
    const questions: DummyQuestion[] = [];
    for (let i = 0; i < sec.questionCount; i++) {
      const globalIndex = i + 1;
      questions.push({
        id: `${exam.id}-${sec.id}-q${globalIndex}`,
        examId: exam.id,
        sectionId: sec.id,
        index: globalIndex,
        text: `Dummy ${exam.name} • ${sec.name} • Question ${globalIndex}`,
        options: [
          "Option A (dummy)",
          "Option B (dummy)",
          "Option C (dummy)",
          "Option D (dummy)",
        ],
      });
    }
    bySection[sec.id] = questions;
  });
  return bySection;
};

// Build dummy questions for all exams once
const dummyQuestionsByExam: Record<
  ExamId,
  Record<string, DummyQuestion[]>
> = {
  gmat: buildDummyQuestions(exams.find((e) => e.id === "gmat")!),
  gre: buildDummyQuestions(exams.find((e) => e.id === "gre")!),
  sat: buildDummyQuestions(exams.find((e) => e.id === "sat")!),
};

type AnswersState = Record<string, number | null>; // questionId -> optionIndex

const formatTime = (totalSeconds: number | null) => {
  if (totalSeconds === null || totalSeconds < 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  return `${mm}:${ss}`;
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:bg-gray-900 dark:border-gray-800 ${className}`}
  >
    {children}
  </div>
);

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`p-4 sm:p-5 ${className}`}>{children}</div>
);

const Pill = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 ${className}`}
  >
    {children}
  </span>
);

export default function FullTestsPage() {
  const [activeExamId, setActiveExamId] = useState<ExamId | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  const timerRef = useRef<number | null>(null);

  const activeExam = useMemo(
    () => exams.find((e) => e.id === activeExamId) || null,
    [activeExamId]
  );

  const activeSection: SectionConfig | null = useMemo(() => {
    if (!activeExam) return null;
    return activeExam.sections[activeSectionIndex] || null;
  }, [activeExam, activeSectionIndex]);

  const activeQuestions: DummyQuestion[] = useMemo(() => {
    if (!activeExam || !activeSection) return [];
    return dummyQuestionsByExam[activeExam.id][activeSection.id] || [];
  }, [activeExam, activeSection]);

  const currentQuestion: DummyQuestion | null =
    activeQuestions[currentQuestionIndex] || null;

  // Timer effect
  useEffect(() => {
    if (!isRunning || remainingSeconds === null) return;

    timerRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          window.clearInterval(timerRef.current!);
          handleSectionTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, activeExamId, activeSectionIndex]);

  const handleStartExam = (examId: ExamId) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    setActiveExamId(examId);
    setActiveSectionIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTestCompleted(false);
    setRemainingSeconds(exam.sections[0].durationMinutes * 60);
    setIsRunning(true);
  };

  const handleResetExam = () => {
    if (!activeExam) return;
    setActiveSectionIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setRemainingSeconds(activeExam.sections[0].durationMinutes * 60);
    setIsRunning(true);
    setTestCompleted(false);
  };

  const handleSectionTimeUp = () => {
    if (!activeExam) return;
    const isLastSection =
      activeSectionIndex >= activeExam.sections.length - 1;
    if (isLastSection) {
      setIsRunning(false);
      setTestCompleted(true);
    } else {
      const nextSectionIndex = activeSectionIndex + 1;
      setActiveSectionIndex(nextSectionIndex);
      setCurrentQuestionIndex(0);
      const nextSection = activeExam.sections[nextSectionIndex];
      setRemainingSeconds(nextSection.durationMinutes * 60);
    }
  };

  const handleToggleTimer = () => {
    if (!activeExam || !activeSection) return;
    if (remainingSeconds === null) {
      setRemainingSeconds(activeSection.durationMinutes * 60);
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  };

  const handleSelectOption = (questionId: string, index: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: index,
    }));
  };

  const handleNextQuestion = () => {
    if (!activeQuestions.length) return;
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < activeQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleChangeSection = (index: number) => {
    if (!activeExam) return;
    if (index < 0 || index >= activeExam.sections.length) return;
    setActiveSectionIndex(index);
    setCurrentQuestionIndex(0);
    const sec = activeExam.sections[index];
    setRemainingSeconds(sec.durationMinutes * 60);
    setIsRunning(true);
  };

  const progressForCurrentSection = (() => {
    if (!activeQuestions.length) return 0;
    const answeredCount = activeQuestions.filter(
      (q) => answers[q.id] !== undefined && answers[q.id] !== null
    ).length;
    return Math.round((answeredCount / activeQuestions.length) * 100);
  })();

  const totalAnsweredAcrossExam = (() => {
    if (!activeExam) return 0;
    const allSecIds = activeExam.sections.map((s) => s.id);
    let total = 0;
    allSecIds.forEach((secId) => {
      const qs = dummyQuestionsByExam[activeExam.id][secId] || [];
      qs.forEach((q) => {
        if (answers[q.id] !== undefined && answers[q.id] !== null) {
          total++;
        }
      });
    });
    return total;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Live exam-like interface
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Full-Length Test Lab
              <GraduationCap className="h-7 w-7 text-blue-500" />
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
              Practice full-length{" "}
              <span className="font-semibold">GMAT, GRE, and SAT</span> with
              realistic section timings and question counts using dummy
              questions.
            </p>
          </div>
        </div>

        {/* Exam cards when no exam active */}
        {!activeExam && (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3 mb-8">
            {exams.map((exam) => (
              <Card key={exam.id} className="relative overflow-hidden">
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-${exam.accentColor}-400 to-${exam.accentColor}-600`}
                />
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {exam.name}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {exam.subtitle}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2 dark:bg-gray-800">
                      <BookOpen className="h-6 w-6 text-gray-500 dark:text-gray-300" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
                    <Pill>
                      <ListChecks className="h-3.5 w-3.5 mr-1" />
                      {exam.totalQuestions} Questions
                    </Pill>
                    <Pill>
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {exam.totalDurationMinutes} min
                    </Pill>
                    <Pill>
                      <Target className="h-3.5 w-3.5 mr-1" />
                      {exam.difficulty === "High" ? "Challenging" : "Moderate"}
                    </Pill>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {exam.sections.map((sec, idx) => (
                      <div className="flex justify-between" key={sec.id}>
                        <span>
                          {idx + 1}. {sec.name}
                        </span>
                        <span>
                          {sec.questionCount} Q • {sec.durationMinutes} min
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-between items-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Dummy questions, real structure.
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="rounded-xl px-4 py-2 flex items-center gap-1.5"
                      onClick={() => handleStartExam(exam.id)}
                    >
                      Start {exam.id.toUpperCase()} Test
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Active exam UI */}
        {activeExam && activeSection && (
          <div className="space-y-4">
            {/* Top bar with exam + timer */}
            <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
              <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-300 mb-1">
                    <BookOpen className="h-4 w-4" />
                    Full-Length {activeExam.name}
                  </div>
                  <h2 className="text-xl font-semibold flex flex-wrap items-center gap-2">
                    Section {activeSectionIndex + 1}: {activeSection.name}
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                      {activeSection.questionTypeLabel}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    {activeExam.sections.length} sections •{" "}
                    {activeExam.totalQuestions} questions •{" "}
                    {activeExam.totalDurationMinutes} minutes total
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs font-medium">
                      <Timer className="h-4 w-4 text-emerald-300" />
                      <span className="tabular-nums text-lg font-semibold text-emerald-200">
                        {formatTime(remainingSeconds)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleTimer}
                      className="rounded-full border-white/30 bg-white/10 text-xs text-white hover:bg-white/20"
                    >
                      {isRunning ? (
                        <>
                          <Pause className="h-3.5 w-3.5 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 mr-1" />
                          {remainingSeconds === null ? "Start Section" : "Resume"}
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <span>
                      Section progress:{" "}
                      <span className="font-semibold">
                        {progressForCurrentSection}%
                      </span>
                    </span>
                    <span className="h-1.5 w-24 bg-slate-700 rounded-full overflow-hidden">
                      <span
                        className="h-full bg-emerald-400 transition-all"
                        style={{ width: `${progressForCurrentSection}%` }}
                      />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Layout: left nav, center question, right section navigator */}
            <div className="grid grid-cols-1 lg:grid-cols-[260px,minmax(0,1.5fr),260px] gap-4">
              {/* Left: Question palette */}
              <Card className="h-full">
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <LayoutList className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Question Palette
                      </h3>
                    </div>
                    <Pill>
                      <ListChecks className="h-3.5 w-3.5 mr-1" />
                      {activeQuestions.length} Q
                    </Pill>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 text-xs">
                    {activeQuestions.map((q, idx) => {
                      const isAnswered =
                        answers[q.id] !== undefined && answers[q.id] !== null;
                      const isCurrent = idx === currentQuestionIndex;
                      return (
                        <button
                          key={q.id}
                          onClick={() => handleJumpToQuestion(idx)}
                          className={`relative flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-medium transition-all ${
                            isCurrent
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:border-blue-400 dark:text-blue-50"
                              : isAnswered
                              ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-400 dark:text-emerald-50"
                              : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                          }`}
                        >
                          {idx + 1}
                          {isAnswered && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-900" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Center: Question viewer */}
              <Card className="h-full">
                <CardContent className="flex flex-col h-full">
                  {currentQuestion ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-semibold text-gray-800 dark:text-gray-100">
                            Q{currentQuestionIndex + 1}
                          </span>
                          <span>of {activeQuestions.length}</span>
                        </div>
                        <Pill className="text-[11px]">
                          {activeSection.name}
                        </Pill>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                          {currentQuestion.text}
                        </p>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 mb-4">
                        {currentQuestion.options.map((opt, idx) => {
                          const selected = answers[currentQuestion.id] === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() =>
                                handleSelectOption(currentQuestion.id, idx)
                              }
                              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                                selected
                                  ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-50"
                                  : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-500"
                              }`}
                            >
                              <span
                                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                                  selected
                                    ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-500"
                                    : "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Navigation buttons */}
                      <div className="mt-auto pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg px-3"
                            onClick={handlePrevQuestion}
                            disabled={currentQuestionIndex === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg px-3"
                            onClick={handleNextQuestion}
                            disabled={
                              currentQuestionIndex >=
                              activeQuestions.length - 1
                            }
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Answered in this section:{" "}
                          <span className="font-semibold text-gray-800 dark:text-gray-100">
                            {progressForCurrentSection}% ({activeQuestions.filter(
                              (q) =>
                                answers[q.id] !== undefined &&
                                answers[q.id] !== null
                            ).length}
                            /{activeQuestions.length})
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
                      <AlertCircle className="h-10 w-10 mb-2" />
                      <p>No questions loaded for this section.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Section switcher & summary */}
              <Card className="h-full">
                <CardContent className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Sections
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {activeExam.sections.map((sec, idx) => {
                      const secQuestions =
                        dummyQuestionsByExam[activeExam.id][sec.id] || [];
                      const answeredInSec = secQuestions.filter(
                        (q) =>
                          answers[q.id] !== undefined && answers[q.id] !== null
                      ).length;
                      const completed = answeredInSec === secQuestions.length;
                      const current = idx === activeSectionIndex;
                      return (
                        <button
                          key={sec.id}
                          onClick={() => handleChangeSection(idx)}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs transition-all ${
                            current
                              ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-50"
                              : completed
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-900/20 dark:text-emerald-50"
                              : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[13px]">
                              Section {idx + 1}: {sec.name}
                            </span>
                            <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-300">
                              {answeredInSec}/{sec.questionCount} Q
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                            <span>{sec.durationMinutes} min</span>
                            {completed && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Overall answered:{" "}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {totalAnsweredAcrossExam}/{activeExam.totalQuestions}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs"
                        onClick={handleResetExam}
                      >
                        Restart Test
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="rounded-lg text-xs"
                        onClick={() => {
                          setIsRunning(false);
                          setTestCompleted(true);
                        }}
                      >
                        End Test
                      </Button>
                    </div>
                    {testCompleted && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-4 w-4 mt-0.5" />
                        <div>
                          <div className="font-semibold">
                            Test session ended
                          </div>
                          <div>
                            You answered {totalAnsweredAcrossExam} out of{" "}
                            {activeExam.totalQuestions} questions. (Dummy
                            content – scoring not implemented here.)
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      This is a frontend-only mock. Connect with your backend
                      schemas to store attempts.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
