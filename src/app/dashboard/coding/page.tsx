"use client";


/**
 * @file src/app/dashboard/coding/page.tsx
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

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Code, CheckCircle, Clock, Award, Loader2, Sparkles, BookOpen, Layers } from "lucide-react";
import { toast } from "sonner";

/**
 * File Purpose:
 * This page serves as the main Landing Dashboard for Prepora's Coding Round Module.
 * It provides stats regarding candidate progress, explains difficulty levels (Easy, Medium, Hard),
 * starts new AI coding rounds, lists past attempt histories, and redirects to draft editors or AI reviews.
 */

interface CodingAttemptInfo {
  _id: string;
  questionId: {
    _id: string;
    title: string;
    difficulty: "easy" | "medium" | "hard";
    topic: string;
    timeLimit: number;
  } | null;
  language: string;
  score: number;
  passedCases: number;
  totalCases: number;
  status: "in_progress" | "submitted";
  createdAt: string;
}

export default function CodingDashboardPage() {
  const router = useRouter();
  const [loadingDifficulty, setLoadingDifficulty] = useState<string | null>(null);
  const [loadingRound2, setLoadingRound2] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<CodingAttemptInfo[]>([]);
  const [roundAttempts, setRoundAttempts] = useState<any[]>([]);
  const [historyTab, setHistoryTab] = useState<"single" | "round">("single");
  const [fetching, setFetching] = useState(true);

  // Fetch attempt history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/coding");
        const data = await res.json();
        if (data.success) {
          setAttempts(data.attempts || []);
          setRoundAttempts(data.roundAttempts || []);
        } else {
          toast.error("Failed to load attempts history.");
        }
      } catch (err) {
        console.error("Load history error:", err);
      } finally {
        setFetching(false);
      }
    }
    loadHistory();
  }, []);

  const handleStartRound = async (difficulty: "easy" | "medium" | "hard") => {
    setLoadingDifficulty(difficulty);
    try {
      // 1. Generate coding question via AI
      const genRes = await fetch("/api/coding/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      const genData = await genRes.json();

      if (!genData.success || !genData.question) {
        throw new Error(genData.message || "Failed to generate question");
      }

      // 2. Start a Coding Attempt referencing this question
      const startRes = await fetch("/api/coding/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: genData.question._id }),
      });
      const startData = await startRes.json();

      if (!startData.success || !startData.attempt) {
        throw new Error(startData.error || "Failed to start coding round attempt");
      }

      toast.success("Coding round generated! Starting timer...");
      router.push(`/dashboard/coding/${startData.attempt._id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to start coding round. Please try again.");
    } finally {
      setLoadingDifficulty(null);
    }
  };

  const handleStartRound2 = async () => {
    setLoadingRound2(true);
    try {
      const startRes = await fetch("/api/coding/round/start", {
        method: "POST",
      });
      const startData = await startRes.json();

      if (!startData.success || !startData.attempt) {
        throw new Error(startData.error || "Failed to start 3-question placement coding round");
      }

      toast.success("3-Question Placement Coding Round generated! Starting 90-minute timer...");
      router.push(`/dashboard/coding/round/${startData.attempt._id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to start coding round. Please try again.");
    } finally {
      setLoadingRound2(false);
    }
  };

  // Compile statistics
  const totalAttempts = attempts.length;
  const submittedAttempts = attempts.filter((a) => a.status === "submitted");
  const averageScore =
    submittedAttempts.length > 0
      ? Math.round(submittedAttempts.reduce((acc, a) => acc + a.score, 0) / submittedAttempts.length)
      : 0;

  const easySolved = attempts.filter((a) => a.status === "submitted" && a.questionId?.difficulty === "easy").length;
  const mediumSolved = attempts.filter((a) => a.status === "submitted" && a.questionId?.difficulty === "medium").length;
  const hardSolved = attempts.filter((a) => a.status === "submitted" && a.questionId?.difficulty === "hard").length;

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            AI Coding Rounds
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Simulate technical placement assessments, write code in multiple languages, and receive instant FAANG AI evaluations.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Rounds Practiced</span>
            <span className="text-2xl font-bold">{totalAttempts}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Average AI Score</span>
            <span className="text-2xl font-bold">{averageScore}/100</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Problems Solved</span>
            <span className="text-2xl font-bold">
              {easySolved + mediumSolved + hardSolved}{" "}
              <span className="text-xs font-normal text-zinc-400">
                (E:{easySolved} M:{mediumSolved} H:{hardSolved})
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Time Commitment</span>
            <span className="text-sm font-semibold">15 - 45 Mins / Round</span>
          </div>
        </div>
      </div>

      {/* 3-Question Placement Coding Round */}
      <div className="mb-10 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
              Corporate Simulation
            </span>
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-450" /> 1 Hour 30 Mins
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">AI Placement Coding Round (3 Questions)</h2>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Test your complete coding readiness. Simulates a standard 3-problem online assessment round typical of companies like Google, Amazon, and Microsoft. Solve one easy, one medium, and one hard problem under a combined 90-minute timer.
          </p>
        </div>
        <button
          onClick={handleStartRound2}
          disabled={loadingRound2 || loadingDifficulty !== null}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-650/10 transition duration-200 flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {loadingRound2 ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating Round...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Start Full Placement Round
            </>
          )}
        </button>
      </div>

      {/* Select Difficulty Cards */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" /> Start a New Topic-Wise / Single Question Assessment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Easy Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition duration-200">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                  Easy
                </span>
                <span className="text-sm font-medium text-zinc-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 15 Mins
                </span>
              </div>
              <h3 className="text-lg font-bold">Beginner Round</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Simple algorithms, basic string manipulations, and integer iterations. Perfect for warm-up and testing environment.
              </p>
            </div>
            <button
              onClick={() => handleStartRound("easy")}
              disabled={loadingDifficulty !== null}
              className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 text-sm font-bold cursor-pointer"
            >
              {loadingDifficulty === "easy" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Start Assessment
                </>
              )}
            </button>
          </div>

          {/* Medium Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition duration-200 border-t-2 border-t-indigo-500 dark:border-t-indigo-400">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Medium
                </span>
                <span className="text-sm font-medium text-zinc-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 30 Mins
                </span>
              </div>
              <h3 className="text-lg font-bold">Standard Interview Round</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                FAANG interview baseline: hash maps, trees, sliding windows, recursion, and search. Designed to test optimal time/space solutioning.
              </p>
            </div>
            <button
              onClick={() => handleStartRound("medium")}
              disabled={loadingDifficulty !== null}
              className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-sm font-bold cursor-pointer"
            >
              {loadingDifficulty === "medium" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Start Assessment
                </>
              )}
            </button>
          </div>

          {/* Hard Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition duration-200 border-t-2 border-t-purple-500 dark:border-t-purple-400">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Hard
                </span>
                <span className="text-sm font-medium text-zinc-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 45 Mins
                </span>
              </div>
              <h3 className="text-lg font-bold">Advanced placement Round</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Graph structures, hard DP, trie representations, or complex string manipulations. Geared towards high-performance candidates.
              </p>
            </div>
            <button
              onClick={() => handleStartRound("hard")}
              disabled={loadingDifficulty !== null}
              className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 text-sm font-bold cursor-pointer"
            >
              {loadingDifficulty === "hard" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Start Assessment
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* History attempts list */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-zinc-150 dark:border-zinc-800/80 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-zinc-500" /> Assessment History
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setHistoryTab("single")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                historyTab === "single"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-250/50 dark:hover:bg-zinc-700"
              }`}
            >
              Single Problems ({attempts.length})
            </button>
            <button
              onClick={() => setHistoryTab("round")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                historyTab === "round"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-250/50 dark:hover:bg-zinc-700"
              }`}
            >
              3-Question Rounds ({roundAttempts.length})
            </button>
          </div>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Fetching attempts history...</p>
          </div>
        ) : historyTab === "single" ? (
          attempts.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <Code className="w-12 h-12 mx-auto mb-3 opacity-55" />
              <p className="text-sm">No coding attempts recorded yet. Launch your first round above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold text-xs uppercase">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Question Title</th>
                    <th className="pb-3 pr-4">Difficulty</th>
                    <th className="pb-3 pr-4">Language</th>
                    <th className="pb-3 pr-4">Score</th>
                    <th className="pb-3 pr-4">Pass Rate</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                  {attempts.map((attempt) => {
                    const dateStr = new Date(attempt.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const title = attempt.questionId?.title || "Unknown Question";
                    const difficulty = attempt.questionId?.difficulty || "medium";
                    const status = attempt.status;

                    return (
                      <tr key={attempt._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="py-4 pr-4 text-zinc-500 font-medium whitespace-nowrap">{dateStr}</td>
                        <td className="py-4 pr-4 font-semibold text-zinc-850 dark:text-zinc-200">{title}</td>
                        <td className="py-4 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              difficulty === "easy"
                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                : difficulty === "medium"
                                ? "bg-indigo-50 text-indigo-750 dark:bg-indigo-950/30 dark:text-indigo-400"
                                : "bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-400"
                            }`}
                          >
                            {difficulty}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-zinc-650 dark:text-zinc-350 capitalize whitespace-nowrap">
                          {attempt.language || "-"}
                        </td>
                        <td className="py-4 pr-4 font-bold">
                          {status === "submitted" ? `${attempt.score}/100` : "-"}
                        </td>
                        <td className="py-4 pr-4 text-zinc-500 font-medium">
                          {status === "submitted" ? (
                            <span>
                              {attempt.passedCases}/{attempt.totalCases} cases
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-4 pr-4 whitespace-nowrap">
                          {status === "submitted" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right whitespace-nowrap">
                          {status === "in_progress" ? (
                            <Link
                              href={`/dashboard/coding/${attempt._id}`}
                              className="inline-block px-3 py-1.5 rounded-lg text-xs bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold cursor-pointer"
                            >
                              Resume
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/coding/${attempt._id}`}
                              className="inline-block px-3 py-1.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                            >
                              Review AI Feedback
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          roundAttempts.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-55" />
              <p className="text-sm">No 3-question placement rounds recorded yet. Click "Start Full Placement Round" above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold text-xs uppercase">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Questions Checked</th>
                    <th className="pb-3 pr-4">Overall Score</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                  {roundAttempts.map((attempt) => {
                    const dateStr = new Date(attempt.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const status = attempt.status;
                    return (
                      <tr key={attempt._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="py-4 pr-4 text-zinc-500 font-medium whitespace-nowrap">{dateStr}</td>
                        <td className="py-4 pr-4 font-semibold text-zinc-850 dark:text-zinc-200">
                          <div className="flex flex-col gap-0.5">
                            {attempt.questions.map((q: any, i: number) => (
                              <span key={i} className="text-xs">
                                • {q.questionId?.title || "Unknown"} ({q.questionId?.difficulty || "easy"})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 pr-4 font-bold text-sm">
                          {status === "submitted" ? `${attempt.score}/100` : "-"}
                        </td>
                        <td className="py-4 pr-4 whitespace-nowrap">
                          {status === "submitted" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right whitespace-nowrap">
                          {status === "in_progress" ? (
                            <Link
                              href={`/dashboard/coding/round/${attempt._id}`}
                              className="inline-block px-3 py-1.5 rounded-lg text-xs bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold cursor-pointer"
                            >
                              Resume Round
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/coding/round/${attempt._id}`}
                              className="inline-block px-3 py-1.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                            >
                              Review Round
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}