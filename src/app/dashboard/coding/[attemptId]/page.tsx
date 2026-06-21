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
  Clock
} from "lucide-react";
import { toast } from "sonner";

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

/**
 * File Purpose:
 * This page serves as the main Coding Workspace IDE for a specific attempt.
 * It features a split-pane layout:
 * - Left pane: Problem details, constraints, samples, AI reviews, hints, and explanations.
 * - Right pane: Language selector, Monaco Editor, countdown timer, execution console.
 * It manages timer counts relative to the database record's creation time to prevent resets.
 */

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
  timeComplexity: string;
  spaceComplexity: string;
  edgeCasesMissing: string[];
  strengths: string[];
  improvements: string[];
  finalComment: string;
}

interface CodingAttempt {
  _id: string;
  questionId: CodingQuestion;
  language: string;
  code: string;
  score: number;
  passedCases: number;
  totalCases: number;
  timeTaken: number;
  complexity: string;
  status: "in_progress" | "submitted";
  aiReview?: AIReview;
  createdAt: string;
}

export default function CodingWorkspacePage() {
  const router = useRouter();
  const { attemptId } = useParams() as { attemptId: string };

  const [attempt, setAttempt] = useState<CodingAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  // Workspace configuration state
  const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("");
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");

  // Timer logic
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 min default
  const [totalDuration, setTotalDuration] = useState<number>(1800);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Panel navigation tabs
  const [activeTab, setActiveTab] = useState<"problem" | "review" | "hint" | "explain">("problem");

  // Output console details
  const [consoleOpen, setConsoleOpen] = useState<boolean>(true);
  const [runInput, setRunInput] = useState<string>("");
  const [consoleLoading, setConsoleLoading] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<{
    stdout?: string;
    stderr?: string;
    compileError?: string;
    passedCases?: number;
    totalCases?: number;
    testCaseDetails?: any[];
    samplePassed?: boolean;
  } | null>(null);

  // AI Feature responses
  const [hintLoading, setHintLoading] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explanation, setExplanation] = useState<string>("");

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

  // Fetch attempt data on mount
  useEffect(() => {
    async function loadAttempt() {
      try {
        const res = await fetch(`/api/coding/${attemptId}`);
        const data = await res.json();
        if (data.success && data.attempt) {
          const att: CodingAttempt = data.attempt;
          setAttempt(att);
          const defaultLang = att.language || "javascript";
          setSelectedLanguage(defaultLang);
          setCode(att.code || DEFAULT_STARTER_CODE[defaultLang] || "");

          if (att.questionId.examples && att.questionId.examples.length > 0) {
            setRunInput(att.questionId.examples[0].input || "");
          }

          // Calculate time left from database timestamps
          const difficulty = att.questionId.difficulty;
          const allowedSecs = difficulty === "easy" ? 900 : difficulty === "hard" ? 2700 : 1800;
          setTotalDuration(allowedSecs);

          if (att.status === "in_progress") {
            const startTime = new Date(att.createdAt).getTime();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, allowedSecs - elapsed);
            setTimeLeft(remaining);
          } else {
            setTimeLeft(0);
            setActiveTab("review");
          }
        } else {
          toast.error("Failed to load coding attempt details.");
          router.push("/dashboard/coding");
        }
      } catch (err) {
        console.error("Load attempt error:", err);
        toast.error("An error occurred loading the workspace.");
      } finally {
        setLoading(false);
      }
    }
    loadAttempt();
  }, [attemptId, router]);

  // Handle timer ticks
  useEffect(() => {
    if (loading || !attempt || attempt.status !== "in_progress") return;

    if (timeLeft <= 0) {
      toast.warning("Time is up! Submitting your solution...");
      handleSubmit(true);
      return;
    }

    // Trigger toast alerts for time remaining warnings
    if (timeLeft === 300) {
      toast.warning("Warning: 5 minutes left in this coding round!");
    } else if (timeLeft === 60) {
      toast.warning("Warning: 1 minute left!");
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, loading, attempt]);

  // Keep track of unsaved changes before exiting
  const handleBackToDashboard = () => {
    if (attempt?.status === "in_progress") {
      const confirmExit = window.confirm(
        "Are you sure you want to exit? Your code is saved in memory, but the round timer will keep counting down!"
      );
      if (!confirmExit) return;
    }
    router.push("/dashboard/coding");
  };

  // Change editor language skeleton code
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    const skeleton = DEFAULT_STARTER_CODE[lang] || "";
    setCode(skeleton);
  };

  // Reset current code to default starter template
  const handleResetCode = () => {
    if (attempt?.status === "submitted") return;
    const confirmReset = window.confirm("Reset editor to starter code skeleton? Your written draft will be overwritten.");
    if (confirmReset) {
      setCode(DEFAULT_STARTER_CODE[selectedLanguage] || "");
      toast.success("Code reset completed.");
    }
  };

  // Compile and run the code draft using Piston
  const handleRunDraft = async () => {
    setConsoleLoading(true);
    setConsoleOpen(true);
    setConsoleOutput(null);

    try {
      const res = await fetch("/api/coding/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          input: runInput,
          questionId: attempt?.questionId?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConsoleOutput({
          stdout: data.output,
          stderr: data.error,
          samplePassed: data.samplePassed,
        });
      } else {
        setConsoleOutput({
          compileError: data.error || "Failed to execute AI code execution simulation.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to run code. Please verify network access.");
    } finally {
      setConsoleLoading(false);
    }
  };

  // Grade code against hidden cases and compile AI code review
  const handleSubmit = async (isTimeout = false) => {
    setConsoleLoading(true);
    setConsoleOpen(true);
    setConsoleOutput(null);
    if (!isTimeout) {
      toast.info("Submitting and grading code. Calling AI evaluation engines...");
    }

    try {
      const timeTaken = totalDuration - timeLeft;

      const res = await fetch("/api/coding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: attempt?.questionId._id,
          code,
          language: selectedLanguage,
          timeTaken,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setAttempt(data.attempt);
        setConsoleOutput({
          passedCases: data.result.passed,
          totalCases: data.result.total,
          testCaseDetails: data.result.results,
        });

        toast.success(`Submission graded! Score: ${data.score}/100.`);
        setActiveTab("review");
      } else {
        toast.error(data.error || "Failed to grade submission.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during submission grading.");
    } finally {
      setConsoleLoading(false);
    }
  };

  // Get dynamic hint from AI
  const handleGetHint = async () => {
    if (!attempt?.questionId) return;
    setHintLoading(true);
    try {
      const res = await fetch("/api/coding/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: attempt.questionId.description,
          code,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.hint) {
        setHints((prev) => [...prev, data.hint]);
        toast.success("AI Hint generated!");
      } else {
        toast.error("Failed to generate hint.");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI hint retrieval failed.");
    } finally {
      setHintLoading(false);
    }
  };

  // Get code explanations from AI
  const handleExplainSolution = async () => {
    setExplainLoading(true);
    try {
      const res = await fetch("/api/coding/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        setExplanation(data.explanation);
        toast.success("AI Code explanation completed!");
      } else {
        toast.error("Failed to explain solution.");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI explanation failed.");
    } finally {
      setExplainLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Configuring coding workspace sandboxes...</p>
      </div>
    );
  }

  if (!attempt || !attempt.questionId) {
    return (
      <div className="flex-1 flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-red-500">Attempt could not be initialized.</p>
        <button onClick={() => router.push("/dashboard/coding")} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-white text-sm font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const question = attempt.questionId;

  // Format remaining time to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeCritical = timeLeft < 300 && attempt.status === "in_progress"; // < 5 mins

  return (
    <div className="flex-1 flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 overflow-hidden">
      
      {/* Workspace Header */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/90 backdrop-blur-md px-6 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToDashboard}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight">{question.title}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                question.difficulty === "easy" 
                  ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400" 
                  : question.difficulty === "medium" 
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400" 
                  : "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400"
              }`}>
                {question.difficulty}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Placement Assessment • solve using stdin/stdout
            </p>
          </div>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-4">
          {attempt.status === "in_progress" ? (
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-sm border font-bold ${
              isTimeCritical 
                ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse" 
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-700/50"
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-500/30 font-semibold text-xs uppercase flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Complete
            </div>
          )}
        </div>
      </header>

      {/* Main Split Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Question, Review, Hints panels */}
        <div className="w-1/2 flex flex-col border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 overflow-hidden">
          
          {/* Tabs Selector Bar */}
          <div className="flex border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
            <button
              onClick={() => setActiveTab("problem")}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold border-b-2 transition ${
                activeTab === "problem"
                  ? "border-indigo-650 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Problem Description
            </button>

            {(attempt.status === "submitted" || attempt.aiReview) && (
              <button
                onClick={() => setActiveTab("review")}
                className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold border-b-2 transition ${
                  activeTab === "review"
                    ? "border-indigo-650 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-500" /> AI Code Review
              </button>
            )}

            <button
              onClick={() => setActiveTab("hint")}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold border-b-2 transition ${
                activeTab === "hint"
                  ? "border-indigo-650 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> AI Hints
            </button>

            <button
              onClick={() => setActiveTab("explain")}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold border-b-2 transition ${
                activeTab === "explain"
                  ? "border-indigo-650 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Explain Code
            </button>
          </div>

          {/* Panel Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* PROBLEM TAB */}
            {activeTab === "problem" && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded">
                    Topic: {question.topic}
                  </span>
                  <div className="mt-4 prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                    {question.description}
                  </div>
                </div>

                {/* Constraints */}
                {question.constraints && question.constraints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">Constraints</h3>
                    <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                      {question.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Examples */}
                {question.examples && question.examples.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Examples</h3>
                    {question.examples.map((ex, idx) => (
                      <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 rounded-xl p-4 space-y-3">
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Example {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-500 mb-1">Input:</div>
                          <pre className="p-2 bg-zinc-150/55 dark:bg-zinc-950 rounded font-mono text-xs text-indigo-650 dark:text-indigo-400 overflow-x-auto whitespace-pre-wrap">
                            {ex.input}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-500 mb-1">Output:</div>
                          <pre className="p-2 bg-zinc-150/55 dark:bg-zinc-950 rounded font-mono text-xs text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                            {ex.output}
                          </pre>
                        </div>
                        {ex.explanation && (
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            <span className="font-semibold text-zinc-650 dark:text-zinc-400">Explanation: </span>
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI REVIEW TAB */}
            {activeTab === "review" && (
              <div className="space-y-6">
                {!attempt.aiReview ? (
                  <div className="text-center py-10 text-zinc-400 text-sm">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-40 text-amber-500" />
                    Submit your solution to generate a complete AI review dashboard.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Score Bar */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl flex flex-col items-center shadow-sm">
                      <div className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Overall Score</div>
                      <div className="relative flex items-center justify-center">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="56" className="stroke-zinc-150 dark:stroke-zinc-800" strokeWidth="10" fill="transparent" />
                          <circle 
                            cx="64" 
                            cy="64" 
                            r="56" 
                            className="stroke-emerald-500 transition-all duration-1000" 
                            strokeWidth="10" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 56} 
                            strokeDashoffset={2 * Math.PI * 56 * (1 - (attempt.score || 0) / 100)} 
                          />
                        </svg>
                        <span className="absolute text-3xl font-extrabold">{attempt.score}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-4 text-center">
                        Combination of passed test cases (70%) and AI correctness evaluation (30%).
                      </p>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Correctness</span>
                        <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-1">
                          {attempt.aiReview?.correctness || 0}%
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Code Quality</span>
                        <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-1">
                          {attempt.aiReview?.codeQuality || 0}%
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Time Complexity</span>
                        <div className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 mt-1">
                          {attempt.aiReview?.timeComplexity || attempt.complexity || "N/A"}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Space Complexity</span>
                        <div className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 mt-1">
                          {attempt.aiReview?.spaceComplexity || "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Bullet Sections */}
                    {attempt.aiReview?.edgeCasesMissing && attempt.aiReview.edgeCasesMissing.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-red-500 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" /> Edge Cases Missing
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-450 space-y-1">
                          {attempt.aiReview.edgeCasesMissing.map((el, i) => (
                            <li key={i}>{el}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {attempt.aiReview?.strengths && attempt.aiReview.strengths.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Key Strengths
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-450 space-y-1">
                          {attempt.aiReview.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {attempt.aiReview?.improvements && attempt.aiReview.improvements.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Suggested Improvements
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-450 space-y-1">
                          {attempt.aiReview.improvements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {attempt.aiReview?.finalComment && (
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800/70">
                        <h4 className="text-xs uppercase font-extrabold text-zinc-455 mb-2">Interviewer Remarks</h4>
                        <p className="text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed italic">
                          "{attempt.aiReview.finalComment}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI HINTS TAB */}
            {activeTab === "hint" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold">Request AI Hints</h3>
                    <p className="text-xs text-zinc-450 mt-1">Get structural help on logic without showing final code answers.</p>
                  </div>
                  <button
                    onClick={handleGetHint}
                    disabled={hintLoading || attempt.status === "submitted"}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
                  >
                    {hintLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Request Hint
                      </>
                    )}
                  </button>
                </div>

                {hints.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 text-sm">
                    No hints requested yet. Click above to get help.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hints.map((hint, idx) => (
                      <div key={idx} className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-150/40 dark:border-indigo-900/30 rounded-xl p-4">
                        <div className="text-xs font-extrabold text-indigo-500 mb-2 uppercase">Hint {idx + 1}</div>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          {hint}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EXPLAIN SOLUTION TAB */}
            {activeTab === "explain" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold">Line-by-Line Code Explanation</h3>
                    <p className="text-xs text-zinc-450 mt-1">Request AI details explaining logic branches inside your editor.</p>
                  </div>
                  <button
                    onClick={handleExplainSolution}
                    disabled={explainLoading}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
                  >
                    {explainLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-3.5 h-3.5" /> Explain My Code
                      </>
                    )}
                  </button>
                </div>

                {explainLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-zinc-450 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-550" />
                    <p className="text-xs">Analyzing code segments line by line...</p>
                  </div>
                ) : explanation ? (
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 rounded-xl p-5">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-750 dark:text-zinc-300 leading-relaxed">
                      {explanation}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-10 text-zinc-400 text-sm">
                    Click the button above to request a line-by-line explanation of your written solution.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Language select, Monaco Editor, Run and compile outputs */}
        <div className="w-1/2 flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
          
          {/* Controls Bar */}
          <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={attempt.status === "submitted"}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="java">Java (Main class)</option>
              </select>
            </div>

            {attempt.status === "in_progress" && (
              <button
                onClick={handleResetCode}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 border border-zinc-250 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 font-bold transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset Code
              </button>
            )}
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[300px] border-b border-zinc-200/50 dark:border-zinc-800/50 relative">
            <Editor
              height="100%"
              language={selectedLanguage === "cpp" ? "cpp" : selectedLanguage === "java" ? "java" : selectedLanguage}
              theme={editorTheme}
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                readOnly: attempt.status === "submitted",
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Output / Console Panel */}
          <div className={`flex flex-col bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-850 transition-all duration-200 ${
            consoleOpen ? "h-[260px]" : "h-12"
          } shrink-0`}>
            
            {/* Console Header */}
            <div 
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="px-4 h-12 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/25 shrink-0"
            >
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" /> Console & Execution Results
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold">
                {consoleOpen ? "Collapse" : "Expand"}
              </span>
            </div>

            {/* Console Content */}
            {consoleOpen && (
              <div className="flex-1 flex overflow-hidden">
                
                {/* Standard Input tab for tests drafting */}
                {attempt.status === "in_progress" && (
                  <div className="w-1/3 border-r border-zinc-100 dark:border-zinc-850 p-4 flex flex-col gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-450 block">stdin input:</span>
                    <textarea
                      value={runInput}
                      onChange={(e) => setRunInput(e.target.value)}
                      placeholder="Enter test inputs here..."
                      className="flex-1 w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Outputs Panel */}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs bg-zinc-50 dark:bg-zinc-950/20 text-zinc-800 dark:text-zinc-200">
                  {consoleLoading ? (
                    <div className="flex items-center justify-center h-full text-zinc-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-550" /> Simulating compilation & tracing logic in AI sandbox...
                    </div>
                  ) : consoleOutput ? (
                    <div className="space-y-4">
                      {/* Sample Case Status (Run Code) */}
                      {consoleOutput.samplePassed !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Sample Match:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            consoleOutput.samplePassed 
                              ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                          }`}>
                            {consoleOutput.samplePassed ? "PASSED (Matches Expected)" : "FAILED (Does Not Match Expected)"}
                          </span>
                        </div>
                      )}

                      {/* Case Outputs */}
                      {consoleOutput.stdout !== undefined && (
                        <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Standard Output:</div>
                          {consoleOutput.stdout ? (
                            <pre className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl whitespace-pre-wrap">
                              {consoleOutput.stdout}
                            </pre>
                          ) : (
                            <div className="text-zinc-450 italic">No console output recorded.</div>
                          )}
                        </div>
                      )}

                      {/* Stderr Outputs */}
                      {consoleOutput.stderr !== undefined && consoleOutput.stderr && (
                        <div>
                          <div className="text-[10px] font-bold text-red-500 uppercase mb-1">Execution Error (stderr):</div>
                          <pre className="p-3 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/35 rounded-xl text-red-600 dark:text-red-400 whitespace-pre-wrap">
                            {consoleOutput.stderr}
                          </pre>
                        </div>
                      )}

                      {/* Compile Errors */}
                      {consoleOutput.compileError !== undefined && (
                        <div>
                          <div className="text-[10px] font-bold text-red-500 uppercase mb-1">Compilation Failure:</div>
                          <pre className="p-3 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/35 rounded-xl text-red-600 dark:text-red-400 whitespace-pre-wrap">
                            {consoleOutput.compileError}
                          </pre>
                        </div>
                      )}

                      {/* Hidden Submissions Results */}
                      {consoleOutput.passedCases !== undefined && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-455">Grading Output:</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              consoleOutput.passedCases === consoleOutput.totalCases 
                                ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400" 
                                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400"
                            }`}>
                              Passed {consoleOutput.passedCases}/{consoleOutput.totalCases} Hidden Test Cases
                            </span>
                          </div>

                          {/* Grid of details */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {consoleOutput.testCaseDetails?.map((tc, idx) => (
                              <div key={idx} className={`p-3 border rounded-xl flex items-center justify-between ${
                                tc.passed 
                                  ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-400" 
                                  : "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/40 text-red-750 dark:text-red-400"
                              }`}>
                                <span className="font-bold text-xs">Case {idx + 1}</span>
                                {tc.passed ? (
                                  <span className="text-[10px] font-bold uppercase">Pass</span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase flex items-center gap-0.5">
                                    Fail
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-400 text-center py-6 text-sm">
                      {attempt.status === "in_progress" 
                        ? "Run drafting code to verify output against standard inputs, or Submit to grade all cases." 
                        : "Submission results graded. Review AI review feedback on the left panel."
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Code Execution CTA Buttons */}
          {attempt.status === "in_progress" && (
            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center shrink-0">
              <p className="text-xs text-zinc-400 max-w-[280px]">
                Java submissions require <code className="font-bold">class Main</code>. Outputs are compared strictly.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRunDraft}
                  disabled={consoleLoading}
                  className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs transition disabled:opacity-50 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  <Play className="w-3.5 h-3.5" /> Run Code
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={consoleLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-black dark:bg-indigo-500 dark:hover:bg-indigo-600 font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-500/10"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Assessment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}