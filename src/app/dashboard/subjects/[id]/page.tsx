"use client";


/**
 * @file src/app/dashboard/subjects/[id]/page.tsx
 * @category Utility / Helper
 *
 * Why this code exists:
 * 
 * 
 *
 * What problem it solves:
 * - 
 *
 * How it works internally:
 * - 
 */

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Award,
  AlertCircle,
  HelpCircle,
  XCircle,
  Sparkles
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { toast } from "sonner";

interface Question {
  question: string;
  options: string[];
  selected?: string;
  correct?: string;
  isCorrect?: boolean;
  explanation?: string;
}

interface Attempt {
  _id: string;
  subject: "DBMS" | "OS" | "CN" | "OOPS";
  difficulty: "easy" | "medium" | "hard";
  status: "in-progress" | "completed";
  questions: Question[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
  submittedAt?: string;
}

export default function SubjectQuizPlayPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  // Active quiz states
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Ref to hold selectedAnswers so the auto-submit interval can access the latest state
  const answersRef = useRef<string[]>([]);
  useEffect(() => {
    answersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  async function loadAttempt() {
    try {
      setLoading(true);
      const res = await fetch(`/api/subjects/${params.id}`);
      const data = await res.json();
      if (data.success && data.attempt) {
        setAttempt(data.attempt);
        
        // Initialize user answers state
        const questionsList: Question[] = data.attempt.questions || [];
        const initialAnswers = questionsList.map((q) => q.selected || "");
        setSelectedAnswers(initialAnswers);

        // If in-progress, calculate remaining time based on createdAt
        if (data.attempt.status === "in-progress") {
          const createdAtTime = new Date(data.attempt.createdAt).getTime();
          const elapsedSeconds = Math.floor((Date.now() - createdAtTime) / 1000);
          const totalDurationSeconds = 1200; // 20 mins
          const remaining = Math.max(0, totalDurationSeconds - elapsedSeconds);
          setTimeLeft(remaining);

          if (remaining === 0) {
            // Automatically submit if elapsed time is already over 20 minutes
            handleAutoSubmit(initialAnswers);
          }
        }
      } else {
        toast.error("Failed to load assessment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred loading the assessment details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttempt();
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (!attempt || attempt.status !== "in-progress" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning("Time limit reached! Submitting answers automatically...");
          handleAutoSubmit(answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, timeLeft]);

  const handleSelectAnswer = (option: string) => {
    if (!attempt || attempt.status === "completed") return;
    const updated = [...selectedAnswers];
    updated[activeQuestionIdx] = option;
    setSelectedAnswers(updated);
  };

  async function handleAutoSubmit(answersToSubmit: string[]) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/subjects/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersToSubmit }),
      });
      const data = await res.json();
      if (data.success && data.attempt) {
        setAttempt(data.attempt);
        toast.success("Assessment submitted successfully!");
      } else {
        toast.error(data.error || "Submission failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during submission.");
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  }

  const handleSubmitQuiz = () => {
    handleAutoSubmit(selectedAnswers);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <Loader2 className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading quiz content...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <p className="text-sm font-semibold mb-4">Quiz attempt not found</p>
        <Link href="/dashboard/subjects" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isCompleted = attempt.status === "completed";
  const currentQuestion = attempt.questions[activeQuestionIdx];

  // Grade metrics
  const score = attempt.score || 0;
  const gradeColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-indigo-500" : score >= 40 ? "text-orange-500" : "text-red-500";
  const strokeColor = score >= 80 ? "#10b981" : score >= 60 ? "#6366f1" : score >= 40 ? "#f97316" : "#ef4444";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      
      {/* Top Header */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/subjects"
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-sm md:text-base tracking-tight capitalize">
                {attempt.subject} Quiz - {attempt.difficulty}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isCompleted && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold">
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full flex flex-col gap-6">
        
        {/* IN-PROGRESS ACTIVE QUIZ */}
        {!isCompleted && currentQuestion && (
          <div className="flex flex-col gap-6">
            {/* Progress indicators */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                <span>QUESTION {activeQuestionIdx + 1} OF 10</span>
                <span>{Math.round((selectedAnswers.filter(Boolean).length / 10) * 100)}% Answered</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${((activeQuestionIdx + 1) / 10) * 100}%` }}
                />
              </div>
              
              {/* Question Navigation Grid */}
              <div className="flex flex-wrap gap-2 pt-2">
                {attempt.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center border ${
                      activeQuestionIdx === idx
                        ? "bg-black dark:bg-white text-white dark:text-black border-transparent"
                        : selectedAnswers[idx]
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-550 hover:border-zinc-400"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Play Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-base md:text-lg font-bold leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Radio Select Options */}
              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[activeQuestionIdx] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(option)}
                      className={`text-left p-4 rounded-xl border text-sm font-semibold transition duration-200 flex items-center justify-between ${
                        isSelected
                          ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-800/40 ring-1 ring-black/10 dark:ring-white/10"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span>{option}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-black dark:border-white bg-black dark:bg-white" : "border-zinc-300 dark:border-zinc-700"
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Play Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                disabled={activeQuestionIdx === 0}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-800 text-xs font-bold transition disabled:opacity-40"
              >
                Previous
              </button>

              {activeQuestionIdx < 9 ? (
                <button
                  onClick={() => setActiveQuestionIdx((prev) => Math.min(9, prev + 1))}
                  className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Submit Assessment
                </button>
              )}
            </div>
          </div>
        )}

        {/* COMPLETED RESULTS DASHBOARD */}
        {isCompleted && (
          <div className="flex flex-col gap-8">
            
            {/* Radial score board and stats */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-around gap-6">
              
              {/* Radial Score Ring */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative w-36 h-36 flex items-center justify-center mb-2">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="7"
                      fill="transparent"
                      className="text-zinc-100 dark:text-zinc-800"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={strokeColor}
                      strokeWidth="7"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * score) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black tracking-tight">{score}%</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Grade Score</span>
                  </div>
                </div>
              </div>

              {/* Assessment summary text */}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                    Assessment Summary
                  </span>
                  <h2 className="text-xl font-bold mt-2">
                    {score >= 80 ? "Superb Performance!" : score >= 60 ? "Good Job!" : "Room for Improvement"}
                  </h2>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed max-w-md">
                    You answered {attempt.correctAnswers} out of {attempt.totalQuestions} questions correctly. 
                    Review the step-by-step AI explanation details below to debug mistakes and master core concepts.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase">Topic</span>
                    <p className="text-sm font-bold mt-0.5 uppercase">{attempt.subject}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase">Difficulty</span>
                    <p className="text-sm font-bold mt-0.5 capitalize">{attempt.difficulty}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase">Completed</span>
                    <p className="text-sm font-bold mt-0.5">
                      {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* List of graded questions and explanations */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" /> Question-by-Question Review
              </h2>

              {attempt.questions.map((q, idx) => {
                const isCorrect = q.isCorrect;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Header bar */}
                    <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                          {isCorrect ? "Correct" : q.selected ? "Incorrect" : "Skipped"}
                        </span>
                      </div>
                      
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : q.selected ? (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>

                    {/* Question body */}
                    <div className="p-6 flex flex-col gap-4">
                      <h4 className="text-sm font-bold leading-relaxed">{q.question}</h4>

                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((option, optIdx) => {
                          const isOptionSelected = q.selected === option;
                          const isOptionCorrect = q.correct === option;
                          
                          let cardStyle = "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300";
                          if (isOptionCorrect) {
                            cardStyle = "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 font-semibold";
                          } else if (isOptionSelected) {
                            cardStyle = "border-rose-500 bg-rose-500/5 text-rose-700 dark:text-rose-400 font-semibold";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border text-xs flex justify-between items-center ${cardStyle}`}
                            >
                              <span>{option}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isOptionCorrect && <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500">Correct</span>}
                                {isOptionSelected && !isOptionCorrect && <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-500">Your Choice</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {q.explanation && (
                        <div className="mt-2 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3 items-start">
                          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">AI Concept Explanation</span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed mt-1 font-medium whitespace-pre-line">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back button container */}
            <div className="flex justify-center pt-2">
              <Link
                href="/dashboard/subjects"
                className="px-6 py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:opacity-90 transition"
              >
                Back to Subjects Dashboard
              </Link>
            </div>
          </div>
        )}

      </main>

      {/* CONFIRM SUBMISSION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirm Quiz Submission</h3>
            </div>
            
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to submit your assessment quiz answers? You have answered{" "}
              <strong>{selectedAnswers.filter(Boolean).length} of 10</strong> questions. 
              Once submitted, you will immediately see your final score and detailed explanations.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
