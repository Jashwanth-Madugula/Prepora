"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Play,
  Send,
  HelpCircle,
  BookOpen,
  Terminal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  RefreshCw,
  Sparkles,
  Award,
  Cpu,
  Clock,
  Layers,
  Save,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface ExampleCase {
  input: string;
  output: string;
  explanation: string;
}

interface CodingQuestion {
  _id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  constraints: string[];
  examples: ExampleCase[];
  starterCode: Record<string, string>;
  timeLimit: number;
  memoryLimit: number;
}

interface AIReview {
  correctness: number;
  codeQuality: number;
  edgeCasesMissing: string[];
  strengths: string[];
  improvements: string[];
  finalComment: string;
}

interface QuestionAttempt {
  questionId: CodingQuestion;
  code: string;
  language: string;
  score: number;
  passedCases: number;
  totalCases: number;
  samplePassed: boolean;
  aiReview?: AIReview;
}

interface CodingRoundAttempt {
  _id: string;
  userId: string;
  status: "in_progress" | "submitted";
  questions: QuestionAttempt[];
  score: number;
  createdAt: string;
}

const DEFAULT_STARTER_CODE: Record<string, string> = {
  javascript: `// Starter code for JavaScript (Node.js)
// Read from stdin, process, write to stdout
const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    // Write your code here
    
}

solve();`,

  python: `# Starter code for Python 3
# Read from stdin, process, write to stdout
import sys

def solve():
    # Write your code here
    pass

if __name__ == '__main__':
    solve()`,

  cpp: `// Starter code for C++
#include <iostream>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`,

  c: `// Starter code for C
#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`,

  java: `// Starter code for Java
// MUST use class Main
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your code here
        
    }
}`
};

export default function CodingRoundWorkspacePage() {
  const router = useRouter();
  const { roundId } = useParams() as { roundId: string };

  const [attempt, setAttempt] = useState<CodingRoundAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  // Active question index: 0 (Easy), 1 (Medium), 2 (Hard)
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  // Workspace configuration state (indexed by question index)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["javascript", "javascript", "javascript"]);
  const [codes, setCodes] = useState<string[]>(["", "", ""]);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");

  // Timer logic: 1 hour 30 min (5400 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(5400);
  const [totalDuration] = useState<number>(5400);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Left pane sub-tabs (per question)
  const [activeTabs, setActiveTabs] = useState<Array<"problem" | "review" | "hint" | "explain">>(["problem", "problem", "problem"]);

  // Console states
  const [consoleOpen, setConsoleOpen] = useState<boolean>(true);
  const [runInput, setRunInput] = useState<string>("");
  const [consoleLoading, setConsoleLoading] = useState<boolean>(false);
  const [consoleOutputs, setConsoleOutputs] = useState<Array<{
    stdout?: string;
    stderr?: string;
    compileError?: string;
    passedCases?: number;
    totalCases?: number;
    testCaseDetails?: any[];
    samplePassed?: boolean;
  } | null>>([null, null, null]);

  // AI Hint/Explanation caches
  const [hintsLoading, setHintsLoading] = useState<boolean[]>([false, false, false]);
  const [hintsCache, setHintsCache] = useState<string[][]>([[], [], []]);
  const [explainLoading, setExplainLoading] = useState<boolean[]>([false, false, false]);
  const [explainCache, setExplainCache] = useState<string[]>(["", "", ""]);

  // Submit states
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [finalizeLoading, setFinalizeLoading] = useState<boolean>(false);

  // Sync Monaco editor themes with CSS class changes (ThemeToggle)
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setEditorTheme(isDark ? "vs-dark" : "light");

    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      setEditorTheme(dark ? "vs-dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Fetch coding round attempt data on mount
  useEffect(() => {
    async function loadAttempt() {
      try {
        const res = await fetch(`/api/coding/round/${roundId}`);
        const data = await res.json();
        if (data.success && data.attempt) {
          const att: CodingRoundAttempt = data.attempt;
          setAttempt(att);
          
          const defaultLangs = att.questions.map(q => q.language || "javascript");
          setSelectedLanguages(defaultLangs);
          setCodes(att.questions.map((q, idx) => q.code || DEFAULT_STARTER_CODE[defaultLangs[idx]] || ""));

          // Calculate elapsed time from creation
          const start = new Date(att.createdAt).getTime();
          const elapsed = Math.floor((Date.now() - start) / 1000);
          const limit = 5400; // 90 mins
          
          if (att.status === "submitted") {
            setTimeLeft(0);
          } else if (elapsed >= limit) {
            setTimeLeft(0);
            // Auto submit round
            handleAutoSubmit();
          } else {
            setTimeLeft(limit - elapsed);
          }
        } else {
          toast.error(data.error || "Failed to load coding round workspace.");
        }
      } catch (err) {
        console.error("Load attempt workspace error:", err);
        toast.error("Failed to load workspace data.");
      } finally {
        setLoading(false);
      }
    }
    loadAttempt();
  }, [roundId]);

  // Timer tick effect
  useEffect(() => {
    if (loading || !attempt || attempt.status === "submitted" || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, attempt, timeLeft]);

  const activeQuestion = attempt?.questions[activeQuestionIdx]?.questionId;
  const activeTab = activeTabs[activeQuestionIdx];
  const code = codes[activeQuestionIdx];
  const selectedLanguage = selectedLanguages[activeQuestionIdx];
  const consoleOutput = consoleOutputs[activeQuestionIdx];

  const handleLanguageChange = (lang: string) => {
    const nextLangs = [...selectedLanguages];
    nextLangs[activeQuestionIdx] = lang;
    setSelectedLanguages(nextLangs);

    const nextCodes = [...codes];
    // Populate starter code if empty
    if (!nextCodes[activeQuestionIdx] || nextCodes[activeQuestionIdx].trim() === "" || Object.values(DEFAULT_STARTER_CODE).includes(nextCodes[activeQuestionIdx])) {
      nextCodes[activeQuestionIdx] = DEFAULT_STARTER_CODE[lang] || "";
    }
    setCodes(nextCodes);
  };

  const handleCodeChange = (val: string | undefined) => {
    const nextCodes = [...codes];
    nextCodes[activeQuestionIdx] = val || "";
    setCodes(nextCodes);
  };

  const handleSaveDraft = async (silent = false) => {
    if (!attempt || attempt.status === "submitted") return;
    try {
      const res = await fetch(`/api/coding/round/${roundId}/save-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeQuestion?._id,
          code,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (!silent) {
          toast.success("Draft code saved successfully!");
        }
      }
    } catch (err) {
      console.error("Save draft error:", err);
      if (!silent) toast.error("Failed to save draft code.");
    }
  };

  const handleRunCode = async () => {
    if (!activeQuestion) return;
    setConsoleLoading(true);
    setConsoleOpen(true);
    try {
      const res = await fetch("/api/coding/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          input: runInput,
          questionId: activeQuestion._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const nextConsoles = [...consoleOutputs];
        nextConsoles[activeQuestionIdx] = {
          stdout: data.output,
          stderr: data.error,
          samplePassed: data.samplePassed,
        };
        setConsoleOutputs(nextConsoles);
      } else {
        toast.error(data.error || "Failed to execute code run.");
      }
    } catch (err) {
      console.error("Run code error:", err);
      toast.error("Execution failed.");
    } finally {
      setConsoleLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!attempt || !activeQuestion || attempt.status === "submitted") return;
    setSubmitLoading(true);
    setConsoleOpen(true);
    try {
      // First save draft
      await handleSaveDraft(true);

      const res = await fetch(`/api/coding/round/${roundId}/submit-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeQuestion._id,
          code,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Question "${activeQuestion.title}" submitted and AI reviewed!`);
        
        // Update local attempt stats
        const updatedQuestions = [...attempt.questions];
        updatedQuestions[activeQuestionIdx] = {
          ...updatedQuestions[activeQuestionIdx],
          code,
          language: selectedLanguage,
          score: data.score,
          passedCases: data.passed,
          totalCases: data.total,
          aiReview: data.aiReview,
        };
        setAttempt({
          ...attempt,
          questions: updatedQuestions,
        });

        // Set console output
        const nextConsoles = [...consoleOutputs];
        nextConsoles[activeQuestionIdx] = {
          passedCases: data.passed,
          totalCases: data.total,
          testCaseDetails: data.results,
        };
        setConsoleOutputs(nextConsoles);

        // Switch to Review tab
        const nextTabs = [...activeTabs];
        nextTabs[activeQuestionIdx] = "review";
        setActiveTabs(nextTabs);
      } else {
        toast.error(data.error || "Submission failed.");
      }
    } catch (err) {
      console.error("Submit question error:", err);
      toast.error("Failed to submit question.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFinalizeRound = async () => {
    if (!attempt || attempt.status === "submitted") return;
    
    // Warn if some questions have not been submitted
    const unsubmitted = attempt.questions.filter(q => q.score === 0 && q.passedCases === 0);
    if (unsubmitted.length > 0) {
      const confirmSubmit = window.confirm(`You haven't submitted ${unsubmitted.length} question(s). Are you sure you want to finalize the entire coding round?`);
      if (!confirmSubmit) return;
    } else {
      const confirmSubmit = window.confirm("Are you sure you want to finalize and submit the coding round?");
      if (!confirmSubmit) return;
    }

    setFinalizeLoading(true);
    try {
      const res = await fetch(`/api/coding/round/${roundId}/submit-round`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coding Round complete! Overall score: ${data.attempt.score}/100`);
        setAttempt(data.attempt);
        router.push("/dashboard/coding");
      } else {
        toast.error(data.error || "Failed to finalize coding round.");
      }
    } catch (err) {
      console.error("Finalize round error:", err);
      toast.error("Failed to finalize round.");
    } finally {
      setFinalizeLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    toast.warning("Time limit reached! Auto-submitting coding round...");
    try {
      const res = await fetch(`/api/coding/round/${roundId}/submit-round`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coding Round auto-submitted! Score: ${data.attempt.score}/100`);
        router.push("/dashboard/coding");
      }
    } catch (err) {
      console.error("Auto submit error:", err);
    }
  };

  const handleFetchHint = async () => {
    if (!activeQuestion) return;
    const nextLoadings = [...hintsLoading];
    nextLoadings[activeQuestionIdx] = true;
    setHintsLoading(nextLoadings);
    try {
      const res = await fetch("/api/coding/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionDescription: activeQuestion.description,
          codeDraft: code,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.hints) {
        const nextHints = [...hintsCache];
        nextHints[activeQuestionIdx] = data.hints;
        setHintsCache(nextHints);
      }
    } catch (err) {
      console.error("Get hints error:", err);
    } finally {
      const nextLoadings = [...hintsLoading];
      nextLoadings[activeQuestionIdx] = false;
      setHintsLoading(nextLoadings);
    }
  };

  const handleFetchExplanation = async () => {
    if (!activeQuestion) return;
    const nextLoadings = [...explainLoading];
    nextLoadings[activeQuestionIdx] = true;
    setExplainLoading(nextLoadings);
    try {
      const res = await fetch("/api/coding/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionDescription: activeQuestion.description,
          codeDraft: code,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        const nextExplains = [...explainCache];
        nextExplains[activeQuestionIdx] = data.explanation;
        setExplainCache(nextExplains);
      }
    } catch (err) {
      console.error("Get explanation error:", err);
    } finally {
      const nextLoadings = [...explainLoading];
      nextLoadings[activeQuestionIdx] = false;
      setExplainLoading(nextLoadings);
    }
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <Loader2 className="w-10 h-10 stroke-zinc-900 dark:stroke-zinc-100 animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Generating 3-Question Coding Round (Easy, Medium, Hard)...
        </p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Round Workspace Error</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Could not retrieve details for this session.</p>
        <Link href="/dashboard/coding" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold">
          Back to Coding Dashboard
        </Link>
      </div>
    );
  }

  const overallSubmitted = attempt.status === "submitted";

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coding" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Exit Workspace</span>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <div className="flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-indigo-500" />
            <span className="font-bold text-sm bg-gradient-to-r from-indigo-500 to-rose-500 bg-clip-text text-transparent">
              3-Question Assessment Round
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Unified Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/30 dark:border-zinc-750 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-200">
            <Clock className={`w-4 h-4 ${timeLeft < 600 ? "text-red-500 animate-pulse" : "text-zinc-400"}`} />
            <span>{overallSubmitted ? "SUBMITTED" : formatTimer(timeLeft)}</span>
          </div>

          <ThemeToggle />

          {!overallSubmitted && (
            <button
              onClick={handleFinalizeRound}
              disabled={finalizeLoading}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition duration-200 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {finalizeLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Flag className="w-3.5 h-3.5" />
              )}
              Finalize Round
            </button>
          )}
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane (Questions navigation + Problem details) */}
        <div className="w-[45%] border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/30 flex flex-col overflow-hidden">
          
          {/* Question Selector Tabs */}
          <div className="flex items-center border-b border-zinc-150 dark:border-zinc-800/80 p-2.5 gap-2 bg-zinc-50/50 dark:bg-zinc-950/20">
            {attempt.questions.map((q, idx) => {
              const difficulty = q.questionId.difficulty || "easy";
              const diffLabel = difficulty === "easy" ? "Easy" : difficulty === "medium" ? "Medium" : "Hard";
              const diffColor = difficulty === "easy" 
                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                : difficulty === "medium"
                ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20"
                : "bg-purple-500/10 text-purple-750 dark:text-purple-400 border-purple-500/20";
              const isActive = activeQuestionIdx === idx;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveQuestionIdx(idx);
                    setRunInput("");
                  }}
                  className={`flex-1 p-2.5 rounded-xl border text-left transition duration-200 cursor-pointer ${
                    isActive
                      ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 dark:border-indigo-400"
                      : "border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-100/30 dark:hover:bg-zinc-850/20 bg-white dark:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${diffColor}`}>
                      {diffLabel}
                    </span>
                    {q.score > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450">
                        {q.score}% Score
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold truncate text-zinc-850 dark:text-zinc-100">
                    Q{idx + 1}: {q.questionId.title}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Sub-Tabs for Problem/Review/Hint/Explain */}
          <div className="flex border-b border-zinc-150 dark:border-zinc-800/80 px-4 pt-2 gap-4 shrink-0 bg-white dark:bg-zinc-900">
            {[
              { id: "problem", label: "Problem Details", icon: <BookOpen className="w-3.5 h-3.5" /> },
              { id: "review", label: "AI Review", icon: <Award className="w-3.5 h-3.5" /> },
              { id: "hint", label: "AI Hint", icon: <HelpCircle className="w-3.5 h-3.5" /> },
              { id: "explain", label: "AI Explanation", icon: <Sparkles className="w-3.5 h-3.5" /> },
            ].map((tab) => {
              // Hide review tab if user hasn't submitted yet
              const hasSubm = attempt.questions[activeQuestionIdx]?.score > 0 || attempt.questions[activeQuestionIdx]?.passedCases > 0;
              if (tab.id === "review" && !hasSubm) return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    const nextTabs = [...activeTabs];
                    nextTabs[activeQuestionIdx] = tab.id as any;
                    setActiveTabs(nextTabs);
                  }}
                  className={`flex items-center gap-1.5 pb-2 text-[11px] font-bold border-b-2 transition duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === "problem" && activeQuestion && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-2 text-zinc-850 dark:text-zinc-100">{activeQuestion.title}</h2>
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                    <span>Topic: {activeQuestion.topic}</span>
                    <span>•</span>
                    <span>Time Limit: {activeQuestion.timeLimit}s</span>
                    <span>•</span>
                    <span>Memory Limit: {activeQuestion.memoryLimit}MB</span>
                  </div>
                </div>

                <div className="prose prose-zinc dark:prose-invert max-w-none text-xs leading-relaxed text-zinc-650 dark:text-zinc-300 whitespace-pre-wrap">
                  {activeQuestion.description}
                </div>

                {activeQuestion.constraints && activeQuestion.constraints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Constraints</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs font-medium text-zinc-600 dark:text-zinc-450">
                      {activeQuestion.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeQuestion.examples && activeQuestion.examples.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Examples</h4>
                    {activeQuestion.examples.map((ex, i) => (
                      <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-2 text-xs">
                        <div className="font-bold text-zinc-500">Example {i + 1}</div>
                        <div className="font-mono bg-zinc-100 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                          <span className="text-[10px] text-zinc-400 block font-sans font-bold uppercase mb-1">Input</span>
                          <pre className="whitespace-pre-wrap">{ex.input}</pre>
                        </div>
                        <div className="font-mono bg-zinc-100 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                          <span className="text-[10px] text-zinc-400 block font-sans font-bold uppercase mb-1">Output</span>
                          <pre className="whitespace-pre-wrap">{ex.output}</pre>
                        </div>
                        {ex.explanation && (
                          <div className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                            <span className="font-bold text-zinc-500">Explanation:</span> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "review" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold">AI Review Assessment</h3>
                {attempt.questions[activeQuestionIdx]?.aiReview ? (
                  <div className="space-y-5 text-xs">
                    {/* Score indicators */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Correctness</span>
                        <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
                          {attempt.questions[activeQuestionIdx].aiReview?.correctness}%
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Code Quality</span>
                        <div className="text-2xl font-black mt-1 text-indigo-600 dark:text-indigo-400">
                          {attempt.questions[activeQuestionIdx].aiReview?.codeQuality}%
                        </div>
                      </div>
                    </div>

                    {/* Final comment */}
                    {attempt.questions[activeQuestionIdx].aiReview?.finalComment && (
                      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        <span className="font-bold block text-zinc-800 dark:text-zinc-200 mb-1">AI Verdict:</span>
                        {attempt.questions[activeQuestionIdx].aiReview?.finalComment}
                      </div>
                    )}

                    {/* Bullet lists */}
                    {attempt.questions[activeQuestionIdx].aiReview?.strengths && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-zinc-500">Key Strengths:</h4>
                        <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400 font-medium">
                          {attempt.questions[activeQuestionIdx].aiReview?.strengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {attempt.questions[activeQuestionIdx].aiReview?.improvements && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-zinc-500">Suggested Improvements:</h4>
                        <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400 font-medium">
                          {attempt.questions[activeQuestionIdx].aiReview?.improvements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {attempt.questions[activeQuestionIdx].aiReview?.edgeCasesMissing && attempt.questions[activeQuestionIdx].aiReview!.edgeCasesMissing.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-zinc-500">Edge Cases Missed:</h4>
                        <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400 font-medium">
                          {attempt.questions[activeQuestionIdx].aiReview?.edgeCasesMissing.map((ec, i) => (
                            <li key={i}>{ec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-400">
                    AI evaluation is not loaded. Submit this question to trigger grading.
                  </div>
                )}
              </div>
            )}

            {activeTab === "hint" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold">AI Helper Hints</h3>
                  {hintsCache[activeQuestionIdx].length === 0 && (
                    <button
                      onClick={handleFetchHint}
                      disabled={hintsLoading[activeQuestionIdx]}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-black font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                    >
                      {hintsLoading[activeQuestionIdx] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Querying...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Ask AI Hint
                        </>
                      )}
                    </button>
                  )}
                </div>

                {hintsLoading[activeQuestionIdx] && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[11px] font-medium">Llama compiler is drafting hints...</span>
                  </div>
                )}

                {hintsCache[activeQuestionIdx].length > 0 && (
                  <div className="space-y-3">
                    {hintsCache[activeQuestionIdx].map((hint, i) => (
                      <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150/45 dark:border-zinc-850 rounded-2xl flex gap-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 shrink-0 font-bold text-[10px] flex items-center justify-center">
                          {i + 1}
                        </div>
                        <p className="text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium">
                          {hint}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "explain" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold">AI Solution Breakdown</h3>
                  {explainCache[activeQuestionIdx] === "" && (
                    <button
                      onClick={handleFetchExplanation}
                      disabled={explainLoading[activeQuestionIdx]}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-black font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                    >
                      {explainLoading[activeQuestionIdx] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Ask AI Breakdown
                        </>
                      )}
                    </button>
                  )}
                </div>

                {explainLoading[activeQuestionIdx] && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[11px] font-medium">Groq reviewer is analyzing solution complexity...</span>
                  </div>
                )}

                {explainCache[activeQuestionIdx] !== "" && (
                  <div className="p-5 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 rounded-2xl text-xs leading-relaxed text-zinc-650 dark:text-zinc-300 font-medium whitespace-pre-wrap">
                    {explainCache[activeQuestionIdx]}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane (Monaco Editor + Execution Console) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
          
          {/* Controls Bar */}
          <div className="h-11 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={overallSubmitted}
                className="px-2.5 py-1.5 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-300"
              >
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="python">Python (3.x)</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="c">C (GCC)</option>
                <option value="java">Java (OpenJDK)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              {!overallSubmitted && (
                <button
                  onClick={() => handleSaveDraft(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Save Draft Code"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>
              )}
            </div>
          </div>

          {/* Editor Container */}
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              language={selectedLanguage === "cpp" || selectedLanguage === "c" ? "cpp" : selectedLanguage}
              theme={editorTheme}
              value={code}
              onChange={handleCodeChange}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                readOnly: overallSubmitted,
                tabSize: 4,
              }}
            />
          </div>

          {/* Execution Console */}
          <div className={`border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/90 backdrop-blur flex flex-col transition-all duration-300 ${consoleOpen ? "h-[35%]" : "h-10"}`}>
            {/* Console Header */}
            <div className="h-10 border-b border-zinc-105/50 dark:border-zinc-800/40 flex items-center justify-between px-6 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                onClick={() => setConsoleOpen(!consoleOpen)}
                className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-2 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                Execution Console
              </button>

              <div className="flex items-center gap-2.5">
                {!overallSubmitted && (
                  <>
                    <button
                      onClick={handleRunCode}
                      disabled={consoleLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {consoleLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      Run Code
                    </button>
                    <button
                      onClick={handleSubmitQuestion}
                      disabled={submitLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {submitLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Submit Question
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Console Body */}
            {consoleOpen && (
              <div className="flex-1 flex overflow-hidden text-xs">
                {/* Inputs area */}
                <div className="w-[35%] border-r border-zinc-100 dark:border-zinc-850 p-4 flex flex-col gap-2 bg-zinc-50/20 dark:bg-zinc-950/20">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Custom Program Input (stdin)</span>
                  <textarea
                    value={runInput}
                    onChange={(e) => setRunInput(e.target.value)}
                    placeholder="Enter values to feed standard stdin..."
                    className="flex-1 border border-zinc-200 dark:border-zinc-850 bg-white/70 dark:bg-zinc-900/60 p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px] resize-none"
                  />
                </div>

                {/* Outputs area */}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] bg-white dark:bg-zinc-900 flex flex-col gap-2">
                  <span className="text-[10px] font-sans font-bold text-zinc-400 uppercase block">Compiler Outputs</span>
                  
                  {consoleLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-2 text-zinc-400 py-8">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-sans text-[10px] font-semibold text-zinc-450">Executing program code trace...</span>
                    </div>
                  ) : consoleOutput ? (
                    <div className="space-y-3.5">
                      {consoleOutput.compileError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl whitespace-pre-wrap">
                          <span className="font-sans font-bold text-[10px] block uppercase mb-1">Compilation Failure</span>
                          {consoleOutput.compileError}
                        </div>
                      )}

                      {consoleOutput.stderr && (
                        <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl whitespace-pre-wrap">
                          <span className="font-sans font-bold text-[10px] block uppercase mb-1">Runtime Stderr Error</span>
                          {consoleOutput.stderr}
                        </div>
                      )}

                      {consoleOutput.stdout !== undefined && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-850 rounded-xl text-zinc-850 dark:text-zinc-200">
                          <span className="font-sans font-bold text-[10px] text-zinc-450 block uppercase mb-1.5">Program Standard Output (stdout)</span>
                          <pre className="whitespace-pre-wrap leading-relaxed">{consoleOutput.stdout || "(Empty stdout)"}</pre>
                          {consoleOutput.samplePassed !== undefined && (
                            <div className="mt-2.5 font-sans font-bold flex items-center gap-1.5">
                              {consoleOutput.samplePassed ? (
                                <span className="text-emerald-600 dark:text-emerald-450 flex items-center gap-1 text-[10px] uppercase">
                                  <CheckCircle className="w-4 h-4" /> Match Sample Output Success
                                </span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-450 flex items-center gap-1 text-[10px] uppercase">
                                  <XCircle className="w-4 h-4" /> Output Mismatches Sample Expected
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {consoleOutput.passedCases !== undefined && consoleOutput.totalCases !== undefined && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-850 rounded-xl text-zinc-850 dark:text-zinc-200 text-xs font-sans">
                          <span className="font-bold text-[10px] text-zinc-450 block uppercase mb-1.5">Hidden Test Cases Check</span>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg font-black">{consoleOutput.passedCases} / {consoleOutput.totalCases}</span>
                            <span className="text-xs text-zinc-400">Passed</span>
                          </div>
                          
                          {/* Case logs */}
                          {consoleOutput.testCaseDetails && consoleOutput.testCaseDetails.length > 0 && (
                            <div className="space-y-2">
                              {consoleOutput.testCaseDetails.map((tc: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-zinc-250/20 dark:border-zinc-800/40 bg-zinc-100/30 dark:bg-zinc-900/30 text-[11px] font-mono">
                                  <span className="text-zinc-400">Case {i + 1}</span>
                                  {tc.passed ? (
                                    <span className="text-emerald-600 dark:text-emerald-450 font-bold uppercase text-[9px] flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5" /> Pass
                                    </span>
                                  ) : (
                                    <span className="text-red-500 font-bold uppercase text-[9px] flex items-center gap-1">
                                      <XCircle className="w-3.5 h-3.5" /> Fail
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-400 dark:text-zinc-500 font-sans italic text-center py-10">
                      Write code and click "Run Code" or "Submit Question" to inspect evaluation outputs here.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
