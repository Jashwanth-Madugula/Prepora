"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Brain, 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Loader2,
  AlertTriangle,
  HelpCircle
} from "lucide-react";

/**
 * File Purpose:
 * This component runs the active Aptitude Test session for the candidate.
 * Features:
 * 1. Timer: Counts down based on duration. Transitions to orange (< 5 min) and flashing red (< 2 min).
 * 2. Question Layout: Interactive card display of question text and options with hover/active styles.
 * 3. Nav Grid (Right Column): Renders a status grid of all questions (Gray=Unvisited, Blue=Answered, Orange=Flagged).
 * 4. Flagging System: Allows candidates to tag questions for review and easily return to them.
 * 5. Submission Guard: An interactive confirmation modal showing remaining questions before submitting.
 * 6. Auto-Submit: Submits answers automatically when the countdown timer hits 0.
 */

// Define typescript interface for Question objects returned by the API.
interface Question {
  _id: string;
  question: string;
  options: string[];
}

// Define typescript interface for the parent Test configuration.
interface TestDetails {
  title: string;
  category: string;
  difficulty: string;
  duration: number;
  totalQuestions: number;
}

export default function AptitudeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  // State managers.
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState<TestDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Tracks selected answers: Key is questionId, Value is selected option string.
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Tracks flagged status for questions: Key is questionId, Value is boolean.
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Timer state in seconds.
  const [timeLeft, setTimeLeft] = useState(600); // Default to 10 mins, overwritten by API

  // Modal display controllers.
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [fetchingNext, setFetchingNext] = useState(false);

  // Adaptive testing next question handler
  const handleAdaptiveNext = async () => {
    const activeQ = questions[currentIdx];
    const selectedAns = answers[activeQ._id];

    if (!selectedAns) {
      alert("Please select an option before proceeding.");
      return;
    }

    try {
      setFetchingNext(true);
      const response = await fetch(`/api/aptitude/${testId}/adaptive-next`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: activeQ._id,
          selectedAnswer: selectedAns,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch next question");
      }

      const data = await response.json();
      if (data.success && data.question) {
        // Append the new question to the questions array
        setQuestions((prev) => [...prev, data.question]);
        // Transition to it
        setCurrentIdx((prev) => prev + 1);
      } else {
        throw new Error(data.error || "Failed to load next challenge");
      }
    } catch (err: any) {
      console.error("Adaptive next error:", err);
      alert(err.message || "Something went wrong fetching the next question.");
    } finally {
      setFetchingNext(false);
    }
  };

  // Fetch test configurations and questions on load.
  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  // Main countdown timer ticker.
  useEffect(() => {
    if (loading || submitting) return;

    if (timeLeft <= 0) {
      // Auto-submit when time runs out.
      console.warn("Time expired! Auto-submitting test.");
      executeSubmission();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, submitting]);

  // Load questions and set timer based on the fetched test configuration.
  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/aptitude/${testId}`);
      if (!response.ok) {
        throw new Error("Could not fetch test configurations");
      }
      
      const data = await response.json();
      if (data.success) {
        setTest(data.test);
        setQuestions(data.questions);
        
        // Use test duration in seconds (test.duration is in minutes, convert to seconds).
        const allocatedSeconds = (data.test.duration || 20) * 60;
        setTimeLeft(allocatedSeconds);
      } else {
        router.push("/dashboard/aptitude");
      }
    } catch (error) {
      console.error("Failed to load test details:", error);
      router.push("/dashboard/aptitude");
    } finally {
      setLoading(false);
    }
  };

  // Record selected option in state.
  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  // Toggle flagged for review status for the current question.
  const toggleFlagQuestion = (questionId: string) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Prepares submission payload and sends it to evaluation endpoint.
  const executeSubmission = async () => {
    try {
      setSubmitting(true);
      setShowSubmitModal(false);

      const payload = {
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedAnswer: answers[q._id] || "", // Submit blank if not answered
        })),
      };

      const response = await fetch(`/api/aptitude/${testId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success && data.attemptId) {
        router.push(`/dashboard/aptitude/result/${data.attemptId}`);
      } else {
        throw new Error("Submission evaluation error");
      }
    } catch (error) {
      console.error("Test submission failed:", error);
      setSubmitting(false);
    }
  };

  // Show loading template.
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading test questions...</p>
      </div>
    );
  }

  // Active question variables.
  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Style helper based on remaining time.
  const getTimerStyles = () => {
    if (timeLeft < 120) {
      // Less than 2 minutes: Red, bold, flashing alert.
      return "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 animate-pulse font-extrabold";
    }
    if (timeLeft < 300) {
      // Less than 5 minutes: Amber warning color.
      return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold";
    }
    // Normal state.
    return "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold";
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans">
      
      {/* Test Control Header */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 sticky top-0 z-10 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-indigo-500" />
            <div>
              <h2 className="font-extrabold text-base tracking-tight leading-tight">{test?.title}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {test?.difficulty} Difficulty • {test?.category}
              </span>
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all duration-300 ${getTimerStyles()}`}>
            <Clock className="w-4 h-4" />
            <span>
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>

        </div>
      </header>

      {/* Main Splitscreen Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Question and Options Panel (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Question Index Progress Tracker */}
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 px-1">
            <span>QUESTION {currentIdx + 1} OF {totalQuestions}</span>
            <span>{Math.round(((currentIdx + 1) / totalQuestions) * 100)}% COMPLETED</span>
          </div>

          {/* Question Presentation Card */}
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex-1 flex flex-col justify-between min-h-[350px]">
            <div>
              {/* Question Text */}
              <h3 className="text-xl font-bold leading-relaxed mb-8 text-zinc-800 dark:text-zinc-100">
                {currentQuestion?.question}
              </h3>

              {/* Options selection stack */}
              <div className="space-y-3">
                {currentQuestion?.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion._id] === option;
                  const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D...
                  
                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectOption(currentQuestion._id, option)}
                      className={`w-full p-4 rounded-xl border text-left transition duration-150 flex items-center gap-4 cursor-pointer group ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-semibold"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                      }`}
                    >
                      {/* Circle Letter label */}
                      <span className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white dark:bg-indigo-500"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-750"
                      }`}>
                        {optionLabel}
                      </span>
                      <span className="text-sm">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>            {/* Bottom Actions of Left Panel (Flag, Prev, Next) */}
            <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800/50 pt-6 flex justify-between items-center">
              
              {/* Flag for review toggle button */}
              {test?.difficulty !== "adaptive" ? (
                <button
                  onClick={() => toggleFlagQuestion(currentQuestion._id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    flagged[currentQuestion._id]
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      : "border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500"
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${flagged[currentQuestion._id] ? "fill-amber-500" : ""}`} />
                  {flagged[currentQuestion._id] ? "Flagged for Review" : "Flag Question"}
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                {/* Previous Button */}
                {test?.difficulty !== "adaptive" && (
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => prev - 1)}
                    className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-sm font-semibold transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                )}

                {/* Next/Submit Button */}
                {test?.difficulty === "adaptive" ? (
                  currentIdx === (test?.totalQuestions || 10) - 1 ? (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-green-600/10"
                    >
                      Submit Test <Send className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      disabled={fetchingNext}
                      onClick={handleAdaptiveNext}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm shadow-indigo-600/10 disabled:opacity-50"
                    >
                      {fetchingNext ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          Confirm & Next <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  )
                ) : currentIdx === totalQuestions - 1 ? (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-green-600/10"
                  >
                    Submit Test <Send className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIdx((prev) => prev + 1)}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm shadow-indigo-600/10"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Question Navigation Matrix (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-5">
              Question Navigator
            </h3>

            {/* Grid display of question numbers */}
            <div className="grid grid-cols-5 gap-2.5">
              {Array.from({ length: test?.totalQuestions || 10 }).map((_, idx) => {
                const isCurrent = idx === currentIdx;
                const isGenerated = idx < questions.length;
                const qId = isGenerated ? questions[idx]._id : `locked-${idx}`;
                const isAnswered = isGenerated && !!answers[qId];
                const isFlagged = isGenerated && flagged[qId];

                // Determine styling class based on state hierarchy.
                let stateClass = "border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-850/50";
                
                if (test?.difficulty === "adaptive") {
                  if (idx === currentIdx) {
                    stateClass = "border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400 ring-1 ring-indigo-500/20";
                  } else if (idx < questions.length) {
                    stateClass = "bg-indigo-600 text-white border-transparent dark:bg-indigo-500";
                  } else {
                    stateClass = "border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20 cursor-not-allowed";
                  }
                } else {
                  if (isFlagged) {
                    stateClass = "bg-amber-500 text-white border-transparent hover:bg-amber-600";
                  } else if (isAnswered) {
                    stateClass = "bg-indigo-600 text-white border-transparent dark:bg-indigo-500 hover:bg-indigo-750";
                  } else {
                    stateClass = "border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-850/50";
                  }
                }

                // If active/focused, draw a thick halo around it.
                const focusClass = isCurrent 
                  ? "ring-2 ring-indigo-600 ring-offset-2 dark:ring-indigo-400 dark:ring-offset-zinc-900 font-extrabold scale-105" 
                  : "font-semibold";

                return (
                  <button
                    key={idx}
                    disabled={test?.difficulty === "adaptive" || !isGenerated}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-full aspect-square rounded-xl border text-sm flex items-center justify-center transition cursor-pointer ${stateClass} ${focusClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Color key legends */}
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 space-y-2.5">
              <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 dark:bg-indigo-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              {test?.difficulty !== "adaptive" && (
                <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-500" />
                  <span>Flagged for Review ({Object.values(flagged).filter(Boolean).length})</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                <span className="w-3.5 h-3.5 rounded-md border border-zinc-200 dark:border-zinc-800" />
                <span>Unvisited / Unanswered ({unansweredCount})</span>
              </div>
            </div>

            {/* Quick Submit block */}
            <div className="mt-8">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-sm font-bold transition cursor-pointer"
              >
                Submit Attempt
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* CONFIRMATION SUBMIT DIALOG MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl transform scale-100 transition duration-300">
            
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Submit Test Attempt?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Are you sure you want to end your aptitude test? Please review your status before finalizing:
                </p>
              </div>
            </div>

            {/* Mini stats table inside modal */}
            <div className="grid grid-cols-2 gap-3 py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-100 dark:border-zinc-800 text-xs font-semibold mb-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-400">Total Questions</span>
                <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{totalQuestions}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-400">Answered Questions</span>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{answeredCount}</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-zinc-400">Unanswered Items</span>
                <span className={`text-sm font-extrabold ${unansweredCount > 0 ? "text-amber-500 animate-pulse" : "text-zinc-500"}`}>
                  {unansweredCount}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-zinc-400">Remaining Time</span>
                <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                  {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
              >
                Back to Test
              </button>
              <button
                onClick={executeSubmission}
                disabled={submitting}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-green-600/10"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Confirm & Submit
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}