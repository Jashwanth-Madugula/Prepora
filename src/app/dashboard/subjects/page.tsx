"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Database,
  Cpu,
  Globe,
  Settings,
  History,
  TrendingUp,
  Award,
  Play,
  Loader2,
  Clock,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { toast } from "sonner";

interface SubjectAttemptInfo {
  _id: string;
  subject: "DBMS" | "OS" | "CN" | "OOPS";
  difficulty: "easy" | "medium" | "hard";
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  status: "in-progress" | "completed";
  createdAt: string;
}

export default function SubjectsDashboardPage() {
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);
  const [attempts, setAttempts] = useState<SubjectAttemptInfo[]>([]);

  // Selection states
  const [selectedSubject, setSelectedSubject] = useState<"DBMS" | "OS" | "CN" | "OOPS" | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/subjects");
        const data = await res.json();
        if (data.success) {
          setAttempts(data.attempts || []);
        } else {
          toast.error("Failed to load subject attempts.");
        }
      } catch (err) {
        console.error("Load subject attempts error:", err);
      } finally {
        setFetching(false);
      }
    }
    loadHistory();
  }, []);

  const handleStartQuiz = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject first.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/subjects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selectedSubject, difficulty }),
      });
      const data = await res.json();
      if (data.success && data.attemptId) {
        toast.success(`${selectedSubject} Quiz initialized!`);
        router.push(`/dashboard/subjects/${data.attemptId}`);
      } else {
        toast.error(data.error || "Failed to initialize quiz.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred starting the quiz.");
    } finally {
      setCreating(false);
    }
  };

  // Compile Stats
  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter((a) => a.status === "completed");
  const averageScore =
    completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((acc, a) => acc + a.score, 0) / completedAttempts.length)
      : 0;

  // Best subject calculation
  const subjectGrades: Record<string, { total: number; sum: number }> = {};
  completedAttempts.forEach((a) => {
    if (!subjectGrades[a.subject]) {
      subjectGrades[a.subject] = { total: 0, sum: 0 };
    }
    subjectGrades[a.subject].total += 1;
    subjectGrades[a.subject].sum += a.score;
  });

  let bestSubject = "None";
  let maxAvg = -1;
  Object.entries(subjectGrades).forEach(([subj, data]) => {
    const avg = data.sum / data.total;
    if (avg > maxAvg) {
      maxAvg = avg;
      bestSubject = subj;
    }
  });

  const subjects = [
    {
      id: "DBMS",
      name: "Database Systems",
      desc: "SQL queries, relational algebra, normalizations, ACID transactions, and indexing structures.",
      gradient: "from-blue-500/10 to-indigo-500/10 border-indigo-500/20 dark:border-indigo-500/10 hover:border-indigo-500/40",
      icon: <Database className="w-5 h-5 text-indigo-500" />,
    },
    {
      id: "OS",
      name: "Operating Systems",
      desc: "Process management, CPU scheduling, thread synchronization, deadlocks, paging, and memory mapping.",
      gradient: "from-purple-500/10 to-pink-500/10 border-pink-500/20 dark:border-pink-500/10 hover:border-pink-500/40",
      icon: <Cpu className="w-5 h-5 text-pink-500" />,
    },
    {
      id: "CN",
      name: "Computer Networks",
      desc: "OSI/TCP-IP models, IP routing, subnetting, TCP flow control, DNS, HTTP, and network security protocols.",
      gradient: "from-emerald-500/10 to-teal-500/10 border-teal-500/20 dark:border-teal-500/10 hover:border-teal-500/40",
      icon: <Globe className="w-5 h-5 text-teal-500" />,
    },
    {
      id: "OOPS",
      name: "Object-Oriented Design",
      desc: "Encapsulation, abstraction, inheritance, polymorphism, design patterns, and solid design principles.",
      gradient: "from-rose-500/10 to-orange-500/10 border-orange-500/20 dark:border-orange-500/10 hover:border-orange-500/40",
      icon: <BookOpen className="w-5 h-5 text-orange-500" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans">
      
      {/* Header */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-purple-650 bg-clip-text text-transparent">
                Subject Core Prep
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full flex flex-col gap-8">
        
        {/* Title Block */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-black to-zinc-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            CS Core Subject assessments
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 mt-1">
            Evaluate your knowledge of Operating Systems, DBMS, Networks, and OOPS with quick, interactive 10-MCQ quizzes.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quizzes Completed</span>
              <h2 className="text-4xl font-extrabold mt-2">{completedAttempts.length}</h2>
            </div>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-4">Successful quiz submissions.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Average Score</span>
              <h2 className="text-4xl font-extrabold mt-2 text-indigo-650 dark:text-indigo-400">{averageScore}%</h2>
            </div>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-4">Mean grade across CS topics.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Best Subject</span>
              <h2 className="text-3xl font-bold mt-2 truncate text-emerald-650 dark:text-emerald-400 capitalize">{bestSubject}</h2>
            </div>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-4">
              {maxAvg >= 0 ? `Highest average accuracy of ${maxAvg}%` : "No attempts recorded."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Exam Format</span>
              <h2 className="text-3xl font-bold mt-2">10 MCQs</h2>
            </div>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-4">20-minute timer per quiz.</p>
          </div>
        </div>

        {/* Configurations grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subjects Selection */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              1. Choose Core Topic
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subj) => {
                const isSelected = selectedSubject === subj.id;
                return (
                  <button
                    key={subj.id}
                    onClick={() => setSelectedSubject(subj.id as any)}
                    className={`text-left p-5 rounded-2xl border transition duration-200 bg-white dark:bg-zinc-900 flex gap-4 ${
                      isSelected
                        ? "border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10"
                        : `border-zinc-200/50 dark:border-zinc-800/50 ${subj.gradient}`
                    }`}
                  >
                    <div className="shrink-0 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl max-h-[48px] flex items-center justify-center">
                      {subj.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{subj.name}</h3>
                      <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                        {subj.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configurator */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                <Settings className="w-5 h-5 text-indigo-500" /> Setup Quiz
              </h2>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Selected Subject</span>
                {selectedSubject ? (
                  <div className="text-sm font-bold text-zinc-950 dark:text-white capitalize">
                    {selectedSubject === "OOPS" ? "Object-Oriented Programming (OOPS)" : selectedSubject}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400">Select a subject from the left panel.</div>
                )}
              </div>

              {/* Difficulty selector */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Difficulty Level</span>
                <div className="flex gap-2 p-1 bg-zinc-150 dark:bg-zinc-950 rounded-xl">
                  {(["easy", "medium", "hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition duration-200 ${
                        difficulty === diff
                          ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rules description */}
              <div className="text-xs text-zinc-550 dark:text-zinc-400 space-y-1.5 border-t border-zinc-100 dark:border-zinc-850 pt-4">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Assessment Details:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Format: 10 MCQ Questions</li>
                  <li>Time Limit: 20 Minutes total</li>
                  <li>No negative marking</li>
                  <li>Immediate solution details after submission</li>
                </ul>
              </div>

              {/* Launch button */}
              <button
                onClick={handleStartQuiz}
                disabled={creating || !selectedSubject}
                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Seeding Questions...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Start Assessment Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quiz attempts history */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm mt-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" /> Quiz History
          </h2>

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Fetching attempts history...</p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-55" />
              <p className="text-sm">No quizzes completed yet. Launch your first assessment above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold text-xs uppercase">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 pr-4">Difficulty</th>
                    <th className="pb-3 pr-4">Grade Score</th>
                    <th className="pb-3 pr-4">Correct Answers</th>
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
                    const status = attempt.status;

                    return (
                      <tr key={attempt._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="py-4 pr-4 text-zinc-500 font-medium whitespace-nowrap">{dateStr}</td>
                        <td className="py-4 pr-4 font-bold text-zinc-850 dark:text-zinc-250 uppercase">{attempt.subject}</td>
                        <td className="py-4 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              attempt.difficulty === "easy"
                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                : attempt.difficulty === "medium"
                                ? "bg-indigo-50 text-indigo-750 dark:bg-indigo-950/30 dark:text-indigo-400"
                                : "bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-400"
                            }`}
                          >
                            {attempt.difficulty}
                          </span>
                        </td>
                        <td className="py-4 pr-4 font-extrabold text-sm">
                          {status === "completed" ? `${attempt.score}%` : "-"}
                        </td>
                        <td className="py-4 pr-4 text-zinc-500 font-medium">
                          {status === "completed" ? `${attempt.correctAnswers}/${attempt.totalQuestions}` : "-"}
                        </td>
                        <td className="py-4 pr-4 whitespace-nowrap">
                          {status === "completed" ? (
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
                          {status === "in-progress" ? (
                            <Link
                              href={`/dashboard/subjects/${attempt._id}`}
                              className="inline-block px-3 py-1.5 rounded-lg text-xs bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold"
                            >
                              Resume
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/subjects/${attempt._id}`}
                              className="inline-block px-3 py-1.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300"
                            >
                              Review Answers
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
