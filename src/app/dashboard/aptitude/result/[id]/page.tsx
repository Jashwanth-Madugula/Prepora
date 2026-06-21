"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  ArrowLeft,
  Loader2,
  Calendar,
  Layers,
  Zap
} from "lucide-react";

/**
 * File Purpose:
 * This component displays the detailed results page for an Aptitude Test attempt.
 * Features:
 * 1. Score Circle: Renders a high-fidelity visual summary of accuracy and statistics (correct/wrong/total).
 * 2. Questions Review List: Displays every test question, highlighting what option the candidate
 *    selected (correct=green, incorrect=red) and highlighting the actual correct answer.
 * 3. AI Explanations Accordion: Provides an accordion drawer under each question revealing
 *    the step-by-step mathematical or logical solution.
 * 4. Navigation: Simple path back to the main Aptitude Dashboard.
 */

// Define typescript interface for answers saved on the attempt document.
interface EvaluatedAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

// Define typescript interface for attempt details from API.
interface AttemptDetails {
  _id: string;
  testId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  category: string;
  difficulty: string;
  submittedAt: string;
  answers: EvaluatedAnswer[];
}

// Define typescript interface for associated questions from API.
interface QuestionDetails {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  // State managers.
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
  const [questions, setQuestions] = useState<QuestionDetails[]>([]);
  
  // Tracks which question's explanation drawer is open: Key is index, Value is boolean.
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Fetch results on mount.
  useEffect(() => {
    fetchResultDetails();
  }, [attemptId]);

  // Load attempt evaluation data and question details.
  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/aptitude/result/${attemptId}`);
      if (!response.ok) {
        throw new Error("Could not load result metrics");
      }

      const data = await response.json();
      if (data.success) {
        setAttempt(data.attempt);
        setQuestions(data.questions);
      } else {
        router.push("/dashboard/aptitude");
      }
    } catch (error) {
      console.error("Failed to load result statistics:", error);
      router.push("/dashboard/aptitude");
    } finally {
      setLoading(false);
    }
  };

  // Toggle state of explanation accordion drawer.
  const toggleExplanation = (index: number) => {
    setExpanded((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Open all explanation accordion drawers for quick review.
  const expandAllExplanations = () => {
    const nextExpanded: Record<number, boolean> = {};
    questions.forEach((_, idx) => {
      nextExpanded[idx] = true;
    });
    setExpanded(nextExpanded);
  };

  // Loading indicator template.
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading attempt metrics...</p>
      </div>
    );
  }

  // Calculate wrong answers count.
  const correctCount = attempt?.correctAnswers || 0;
  const totalCount = attempt?.totalQuestions || 0;
  const wrongCount = totalCount - correctCount;
  const accuracyScore = attempt?.score || 0;

  // Formulate a performance grade message based on final score.
  const getPerformanceFeedback = (score: number) => {
    if (score >= 90) return { title: "Outstanding Performance!", desc: "Excellent understanding! You have mastered this category.", color: "text-emerald-500" };
    if (score >= 70) return { title: "Good Job!", desc: "You performed well! Keep practicing to push for perfection.", color: "text-indigo-500" };
    if (score >= 40) return { title: "Room to Grow", desc: "A decent effort. Review the explanations below and try again to improve your score.", color: "text-amber-500" };
    return { title: "Focus & Review Needed", desc: "Your accuracy is low. Spend time reviewing the step-by-step solutions to address concept gaps.", color: "text-red-500" };
  };

  const feedback = getPerformanceFeedback(accuracyScore);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans">
      
      {/* Header bar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <Link href="/dashboard/aptitude" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Aptitude Dashboard</span>
          </Link>
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg capitalize">
            {attempt?.category} Test Complete
          </span>
        </div>
      </header>

      {/* Main Results Dashboard */}
      <main className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full flex flex-col gap-8">
        
        {/* Overview Stats Block */}
        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col md:flex-row items-center gap-8">
          
          {/* Radial score ring */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-zinc-100 dark:text-zinc-800"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * accuracyScore) / 100}
                className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold">{accuracyScore}%</span>
              <span className="block text-[10px] text-zinc-400 font-bold uppercase mt-0.5">Accuracy</span>
            </div>
          </div>

          {/* Feedback details */}
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Evaluation Report</span>
            <h1 className={`text-2xl font-black mt-1 ${feedback.color}`}>{feedback.title}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              {feedback.desc}
            </p>

            {/* Minor stats lists */}
            <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 dark:border-zinc-800/60 pt-5 mt-5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold leading-none uppercase">Correct</span>
                  <span className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300 mt-1 block">{correctCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold leading-none uppercase">Incorrect</span>
                  <span className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300 mt-1 block">{wrongCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold leading-none uppercase">Total Qs</span>
                  <span className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300 mt-1 block">{totalCount}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* System parameters section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-zinc-500">
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/30">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>Attempted on {attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "N/A"}</span>
          </div>
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/30">
            <Zap className="w-4 h-4 text-zinc-400" />
            <span className="capitalize">Test Settings: {attempt?.difficulty} Difficulty • {attempt?.category} Mode</span>
          </div>
        </div>

        {/* REVIEW SECTION HEADER */}
        <div className="flex justify-between items-center mt-4 border-b border-zinc-250 dark:border-zinc-800/80 pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" /> Questions Review
          </h2>
          <button
            onClick={expandAllExplanations}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Expand All Solutions
          </button>
        </div>

        {/* QUESTIONS EVALUATION REVIEW LIST */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            // Find corresponding answer submitted by the user.
            const userAnsObj = attempt?.answers.find(
              (a) => a.questionId === question._id
            );
            const userAns = userAnsObj?.selectedAnswer || "";
            const isCorrect = userAnsObj?.isCorrect || false;

            const isExpanded = !!expanded[index];

            return (
              <div
                key={question._id}
                className={`p-6 rounded-2xl bg-white dark:bg-zinc-900 border transition duration-200 ${
                  isCorrect
                    ? "border-emerald-500/20 dark:border-emerald-500/10 shadow-emerald-500/5"
                    : userAns === ""
                    ? "border-zinc-200 dark:border-zinc-800 shadow-sm"
                    : "border-red-500/20 dark:border-red-500/10 shadow-red-500/5"
                }`}
              >
                
                {/* Question index and correctness badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-md">
                    QUESTION {index + 1}
                  </span>
                  
                  {/* Status Indicator */}
                  {userAns === "" ? (
                    <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase">
                      Skipped Question
                    </span>
                  ) : isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                      <CheckCircle className="w-3.5 h-3.5 fill-emerald-500 stroke-emerald-50 dark:stroke-zinc-900" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-extrabold uppercase">
                      <XCircle className="w-3.5 h-3.5 fill-red-500 stroke-red-50 dark:stroke-zinc-900" /> Incorrect
                    </span>
                  )}
                </div>

                {/* Question text */}
                <h4 className="text-base font-bold text-zinc-850 dark:text-zinc-100 mb-5 leading-relaxed">
                  {question.question}
                </h4>

                {/* Question Option list */}
                <div className="space-y-2 mb-4">
                  {question.options.map((option, idx) => {
                    const optionLetter = String.fromCharCode(65 + idx);
                    
                    const isCorrectAnswer = option === question.correctAnswer;
                    const isUserSelected = option === userAns;

                    // Option color styling logic.
                    let optClass = "border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-350";
                    let checkIcon = null;

                    if (isCorrectAnswer) {
                      // Highlight correct option in emerald green.
                      optClass = "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold";
                      checkIcon = <CheckCircle className="w-4 h-4 stroke-emerald-500 shrink-0 ml-auto" />;
                    } else if (isUserSelected && !isCorrect) {
                      // Highlight incorrect user selection in light red.
                      optClass = "border-red-500 bg-red-500/10 text-red-800 dark:text-red-300 font-semibold";
                      checkIcon = <XCircle className="w-4 h-4 stroke-red-500 shrink-0 ml-auto" />;
                    }

                    return (
                      <div
                        key={option}
                        className={`p-3.5 rounded-xl border text-sm flex items-center gap-3 ${optClass}`}
                      >
                        <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
                          isCorrectAnswer 
                            ? "bg-emerald-500 text-white" 
                            : isUserSelected
                            ? "bg-red-500 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-550"
                        }`}>
                          {optionLetter}
                        </span>
                        <span>{option}</span>
                        {checkIcon}
                      </div>
                    );
                  })}
                </div>

                {/* Accordion toggle for AI Explanations */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                  <button
                    onClick={() => toggleExplanation(index)}
                    className="w-full flex justify-between items-center py-2 text-xs font-extrabold text-zinc-550 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      {isExpanded ? "Hide Explanation" : "View Step-by-Step Explanation"}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Accordion content */}
                  {isExpanded && (
                    <div className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed font-medium">
                      <p className="font-semibold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">AI Solution Details:</p>
                      {question.explanation || "No explanation detail compiled."}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Back navigation shortcut */}
        <div className="mt-4 flex justify-center">
          <Link
            href="/dashboard/aptitude"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-600/10"
          >
            Return to Dashboard
          </Link>
        </div>

      </main>
    </div>
  );
}