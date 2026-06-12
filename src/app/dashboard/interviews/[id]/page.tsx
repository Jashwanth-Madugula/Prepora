"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Rotating messages displayed while AI evaluates the answer
const LOADING_MESSAGES = [
  "Connecting to evaluation engine...",
  "Analyzing vocabulary and communication clarity...",
  "Checking technical accuracy against reference concepts...",
  "Assessing structural logic and completeness...",
  "Scoring confidence indicators...",
  "Formulating key strengths and development areas...",
  "Drafting a high-quality suggested model response...",
  "Wrapping up detailed scorecards...",
];

export default function ActiveInterviewPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [interview, setInterview] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active session state
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [evaluation, setEvaluation] = useState<any>(null);

  // Summary dashboard state
  const [isFinishing, setIsFinishing] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    fetchInterviewDetails();
  }, [id]);

  // Loading text rotation interval
  useEffect(() => {
    let interval: any;
    if (isEvaluating) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else {
      setLoadingTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [isEvaluating]);

  async function fetchInterviewDetails() {
    try {
      const res = await fetch(`/api/interviews/${id}`);
      const data = await res.json();

      if (data.success) {
        setInterview(data.interview);
        setQuestions(data.questions || []);

        // Find first unanswered question
        if (data.interview.status === "in_progress" && data.questions?.length > 0) {
          const unansweredIndex = data.questions.findIndex((q: any) => !q.answer);
          if (unansweredIndex !== -1) {
            setCurrent(unansweredIndex);
          } else {
            setCurrent(data.questions.length - 1);
          }
        }
      } else {
        toast.error(data.message || "Failed to load interview details");
        router.push("/dashboard/interviews");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading interview session");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) {
      toast.warning("Please type an answer before submitting.");
      return;
    }

    setIsEvaluating(true);
    const activeQuestion = questions[current];

    try {
      const res = await fetch(`/api/interviews/questions/${activeQuestion._id}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer: answer.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local questions list with evaluation results
        const updatedQuestions = [...questions];
        updatedQuestions[current] = {
          ...activeQuestion,
          answer: answer.trim(),
          score: data.evaluation.overallScore,
          feedback: data.evaluation.feedback,
          technicalAccuracyScore: data.evaluation.technicalAccuracy,
          communicationScore: data.evaluation.communication,
          confidenceScore: data.evaluation.confidence,
          completenessScore: data.evaluation.completeness,
          structureScore: data.evaluation.structure,
          strengths: data.evaluation.strengths,
          weaknesses: data.evaluation.weaknesses,
          improvedAnswer: data.evaluation.improvedAnswer,
        };
        setQuestions(updatedQuestions);
        setEvaluation(data.evaluation);
        toast.success("Answer evaluated successfully!");
      } else {
        toast.error(data.message || "Failed to evaluate answer");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting answer");
    } finally {
      setIsEvaluating(false);
    }
  }

  async function finishInterview() {
    setIsFinishing(true);
    try {
      const res = await fetch(`/api/interviews/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Interview completed! Generating summary report.");
        setInterview(data.interview);
        // Refresh to fetch calculated summary stats
        fetchInterviewDetails();
      } else {
        toast.error(data.message || "Failed to finalize interview");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error finalizing interview session");
    } finally {
      setIsFinishing(false);
    }
  }

  function handleNextQuestion() {
    setAnswer("");
    setEvaluation(null);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    }
  }

  function getScoreColorClass(score: number) {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/25";
    if (score >= 60) return "text-amber-500 bg-amber-500/10 border-amber-500/25";
    return "text-rose-500 bg-rose-500/10 border-rose-500/25";
  }

  function getMetricBarColorClass(score: number) {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <Loader2 className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading interview details...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
        <p className="text-sm font-medium">Interview not found</p>
        <Link href="/dashboard/interviews" className="mt-4 text-indigo-500 underline text-sm">
          Back to Interviews
        </Link>
      </div>
    );
  }

  const isCompleted = interview.status === "completed";
  const activeQuestion = questions[current];
  const answeredCount = questions.filter((q) => q.answer).length;
  const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Render Completed Summary Report Dashboard
  if (isCompleted) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
        {/* Navbar */}
        <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="font-bold text-lg hover:opacity-85">
                Prepora
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <Link
                href="/dashboard/interviews"
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Mock Interviews
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
                Evaluation Report
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/dashboard/interviews" className="text-sm font-semibold hover:text-zinc-500 transition duration-200">
                Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-5xl mx-auto px-6 py-12 w-full flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Performance Scorecard
              </span>
              <h1 className="text-2xl font-black mt-1">Mock Interview Analysis</h1>
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                <span>Topic: <strong className="text-zinc-700 dark:text-zinc-300">{interview.role}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-zinc-700 dark:text-zinc-300 capitalize">{interview.type}</strong></span>
                <span>•</span>
                <span>Completed: <strong className="text-zinc-700 dark:text-zinc-300">{new Date(interview.completedAt || interview.updatedAt).toLocaleDateString()}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center font-black text-xl bg-indigo-500/10 text-indigo-500">
                {interview.score}%
              </div>
              <div>
                <div className="font-extrabold text-sm">Overall Evaluation</div>
                <div className="text-xs text-zinc-400">Graded by AI Engine</div>
              </div>
            </div>
          </div>

          {/* Metric Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Compute averages of sub-metrics for visual dashboard */}
            {(() => {
              const metrics = [
                {
                  label: "Technical Accuracy",
                  key: "technicalAccuracyScore",
                  desc: "Depth of knowledge",
                  emoji: "💻",
                },
                {
                  label: "Communication",
                  key: "communicationScore",
                  desc: "Clarity & articulation",
                  emoji: "🗣️",
                },
                {
                  label: "Confidence",
                  key: "confidenceScore",
                  desc: "Tone & assurance",
                  emoji: "🔥",
                },
                {
                  label: "Completeness",
                  key: "completenessScore",
                  desc: "Coverage of issues",
                  emoji: "🎯",
                },
                {
                  label: "Structure",
                  key: "structureScore",
                  desc: "Logical flow",
                  emoji: "📐",
                },
              ];

              return metrics.map((m) => {
                const total = questions.reduce((sum, q) => sum + (q[m.key] || 0), 0);
                const avg = questions.length > 0 ? Math.round(total / questions.length) : 0;
                return (
                  <div
                    key={m.label}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xl mb-2 block">{m.emoji}</span>
                      <h4 className="font-bold text-xs text-zinc-500 dark:text-zinc-400 leading-tight">
                        {m.label}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{m.desc}</p>
                    </div>
                    <div className="mt-4">
                      <div className="text-xl font-black">{avg}%</div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getMetricBarColorClass(avg)}`}
                          style={{ width: `${avg}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Question Breakdown Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight px-1">Question-by-Question Breakdown</h2>
            <div className="space-y-4">
              {questions.map((q, qIndex) => {
                const isExpanded = expandedQuestionId === q._id;
                return (
                  <div
                    key={q._id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedQuestionId(isExpanded ? null : q._id)}
                      className="w-full p-6 text-left flex justify-between items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition cursor-pointer"
                    >
                      <div className="flex gap-4 items-start pr-4">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-bold text-xs mt-0.5 shrink-0">
                          {qIndex + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-base leading-snug">
                            {q.question}
                          </h4>
                          <span className="inline-block px-2 py-0.5 mt-2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                            {q.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColorClass(
                            q.score || 0
                          )}`}
                        >
                          Score: {q.score}%
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/50 space-y-6 animate-fadeIn">
                        {/* Candidate Answer */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Your Submitted Answer
                          </h5>
                          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-700 dark:text-zinc-300 text-sm italic whitespace-pre-wrap leading-relaxed">
                            "{q.answer || "No response provided"}"
                          </div>
                        </div>

                        {/* Metric scores breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-zinc-50/50 dark:bg-zinc-950/10 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
                          {[
                            { label: "Technical Accuracy", score: q.technicalAccuracyScore },
                            { label: "Communication", score: q.communicationScore },
                            { label: "Confidence", score: q.confidenceScore },
                            { label: "Completeness", score: q.completenessScore },
                            { label: "Structure", score: q.structureScore },
                          ].map((item) => (
                            <div key={item.label}>
                              <div className="text-[10px] text-zinc-400 leading-tight font-medium">
                                {item.label}
                              </div>
                              <div className="text-sm font-extrabold mt-0.5">{item.score}%</div>
                              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getMetricBarColorClass(
                                    item.score || 0
                                  )}`}
                                  style={{ width: `${item.score || 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl border border-emerald-250 bg-emerald-50/10 dark:border-emerald-900/30 dark:bg-emerald-950/10 space-y-2">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              Key Strengths
                            </h5>
                            <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                              {q.strengths?.map((str: string, sIdx: number) => (
                                <li key={sIdx}>{str}</li>
                              )) || <li>Answered correctly and clearly.</li>}
                            </ul>
                          </div>

                          <div className="p-4 rounded-xl border border-rose-250 bg-rose-50/10 dark:border-rose-900/30 dark:bg-rose-950/10 space-y-2">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-450 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              Areas of Improvement
                            </h5>
                            <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                              {q.weaknesses?.map((weak: string, wIdx: number) => (
                                <li key={wIdx}>{weak}</li>
                              )) || <li>Add more real-world examples and structure.</li>}
                            </ul>
                          </div>
                        </div>

                        {/* Feedback */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            AI Evaluation Details
                          </h5>
                          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {q.feedback}
                          </p>
                        </div>

                        {/* Suggested Improved Answer */}
                        {q.improvedAnswer && (
                          <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                              <Zap className="w-4 h-4 text-indigo-500" />
                              AI Suggested Improved Response
                            </h5>
                            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/10 dark:border-indigo-950/20 dark:bg-indigo-950/10 text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                              {q.improvedAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-4 justify-center mt-6">
            <Link
              href="/dashboard/interviews"
              className="px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition"
            >
              Back to Interview List
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition"
            >
              Go to Home Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Render Active Question Interface (interview state: in_progress)
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      {/* Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="font-bold text-lg hover:opacity-85">
              Prepora
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <Link
              href="/dashboard/interviews"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Mock Interviews
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Active Simulation
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => {
                if (confirm("Are you sure you want to exit the active interview? Your progress is saved.")) {
                  router.push("/dashboard/interviews");
                }
              }}
              className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition"
            >
              Exit Simulator
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-850 h-1">
        <div
          className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1 flex flex-col gap-6">
        {/* Progress Text */}
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <span>
            {answeredCount} of {questions.length} Answered ({Math.round(progressPercentage)}%)
          </span>
        </div>

        {/* Live Question Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
          {/* Left Panel: Question Display (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {activeQuestion.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase tracking-wide">
                  {activeQuestion.difficulty}
                </span>
              </div>

              <h2 className="text-xl font-bold leading-snug text-zinc-800 dark:text-zinc-100">
                {activeQuestion.question}
              </h2>
            </div>

            {/* AI Prompts / Follow-up Advice Card */}
            {activeQuestion.followUps && activeQuestion.followUps.length > 0 && (
              <div className="p-6 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/25 space-y-3">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Follow-up Points to Consider:
                </h4>
                <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2 list-disc pl-4 leading-relaxed">
                  {activeQuestion.followUps.map((pt: string, ptIdx: number) => (
                    <li key={ptIdx}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Starter tips */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/30 dark:border-zinc-850/50 space-y-3">
              <h4 className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                Interviewer's Tip
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Provide a structured response. Use the **STAR** method (Situation, Task, Action, Result) for behavioral questions. For technical ones, explain the core conceptual definition, discuss edge cases, and describe any real-world project usage.
              </p>
            </div>
          </div>

          {/* Right Panel: Answer Text Input and Evaluations (7 columns) */}
          <div className="lg:col-span-7 flex flex-col h-full gap-6">
            {/* If not evaluated yet and not evaluating, show input */}
            {!evaluation && !activeQuestion.answer && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 flex flex-col flex-1 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm">Your Response</h3>
                  <span className="text-xs text-zinc-400">
                    {answer.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <textarea
                  className="w-full flex-1 border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent min-h-[250px] text-sm leading-relaxed"
                  placeholder="Type your comprehensive answer here..."
                  value={answer}
                  disabled={isEvaluating}
                  onChange={(e) => setAnswer(e.target.value)}
                />

                <div className="flex justify-end pt-2">
                  <button
                    onClick={submitAnswer}
                    disabled={isEvaluating || !answer.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                  >
                    Submit & Evaluate Answer
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Evaluating Spinner Overlay */}
            {isEvaluating && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center flex-1 shadow-sm min-h-[300px]">
                <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-6" />
                <h3 className="font-bold text-lg mb-2">Analyzing Answer</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm transition-all duration-300 animate-pulse">
                  {LOADING_MESSAGES[loadingTextIndex]}
                </p>
              </div>
            )}

            {/* Evaluated Result Screen (either local evaluation state OR already exists in DB) */}
            {(evaluation || activeQuestion.answer) && !isEvaluating && (
              <div className="space-y-6">
                {/* Visual scorecard panel */}
                {(() => {
                  const data = evaluation || activeQuestion;
                  return (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                          <h3 className="font-bold">AI Evaluation Grade</h3>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColorClass(
                            data.score || 0
                          )}`}
                        >
                          Overall: {data.score}%
                        </span>
                      </div>

                      {/* 5 metrics list sliders */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Metric Breakdown
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              label: "Technical Accuracy",
                              score: data.technicalAccuracyScore,
                              desc: "Fact checking & expertise",
                            },
                            {
                              label: "Communication",
                              score: data.communicationScore,
                              desc: "Clarity & concise articulation",
                            },
                            {
                              label: "Confidence",
                              score: data.confidenceScore,
                              desc: "Assurance & vocabulary",
                            },
                            {
                              label: "Completeness",
                              score: data.completenessScore,
                              desc: "Addresses all parts of question",
                            },
                            {
                              label: "Structure",
                              score: data.structureScore,
                              desc: "STAR structure & logical flow",
                            },
                          ].map((metric) => (
                            <div
                              key={metric.label}
                              className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 space-y-2"
                            >
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-zinc-700 dark:text-zinc-300">
                                  {metric.label}
                                </span>
                                <span>{metric.score}%</span>
                              </div>
                              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getMetricBarColorClass(
                                    metric.score || 0
                                  )}`}
                                  style={{ width: `${metric.score || 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-400 block">
                                {metric.desc}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strengths & Weaknesses list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-850 pt-6">
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Key Strengths
                          </h4>
                          <ul className="text-xs text-zinc-650 dark:text-zinc-350 space-y-1.5 list-disc pl-4 leading-relaxed">
                            {data.strengths?.map((str: string, sIdx: number) => (
                              <li key={sIdx}>{str}</li>
                            )) || <li>Response was grammatically correct and covered basic facts.</li>}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-450 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Areas to Improve
                          </h4>
                          <ul className="text-xs text-zinc-650 dark:text-zinc-350 space-y-1.5 list-disc pl-4 leading-relaxed">
                            {data.weaknesses?.map((weak: string, wIdx: number) => (
                              <li key={wIdx}>{weak}</li>
                            )) || <li>Add real-world project context.</li>}
                          </ul>
                        </div>
                      </div>

                      {/* Constructive feedback */}
                      <div className="border-t border-zinc-100 dark:border-zinc-850 pt-6 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          AI Suggestions
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed">
                          {data.feedback}
                        </p>
                      </div>

                      {/* Model answer */}
                      {data.improvedAnswer && (
                        <div className="border-t border-zinc-100 dark:border-zinc-850 pt-6 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            Exemplary Response Template
                          </h4>
                          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/10 dark:border-indigo-900/10 dark:bg-indigo-950/10 text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap italic">
                            {data.improvedAnswer}
                          </div>
                        </div>
                      )}

                      {/* Flow action buttons */}
                      <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-850 gap-3">
                        {current < questions.length - 1 ? (
                          <button
                            onClick={handleNextQuestion}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                          >
                            Next Question
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={finishInterview}
                            disabled={isFinishing}
                            className="flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50 cursor-pointer animate-pulse"
                          >
                            {isFinishing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing Averages...
                              </>
                            ) : (
                              "Finish Interview & View Report"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * FILE PURPOSE & HELP:
 * This page implements the interactive mock interview screen and the dynamic scorecard feedback.
 * - It retrieves the current active session state (with 5 pre-loaded questions).
 * - As the candidate works, it handles typing, word count analysis, and submissions.
 * - Submitting triggers a sequential AI loading state to mimic deep analysis.
 * - Displays overall percentage scores and granular visual grade bars for Communication, Accuracy, Confidence, Completeness, and Structure.
 * - Renders lists of Strengths, Weaknesses, and suggested improved templates.
 * - Allows proceeding step-by-step or finalizing the interview which calls the patch endpoint
 *   to calculate total aggregate statistics, saving results to the database and rendering the summary scorecard.
 */