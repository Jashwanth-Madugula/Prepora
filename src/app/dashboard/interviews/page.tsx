"use client";


/**
 * @file src/app/dashboard/interviews/page.tsx
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

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Award,
  Activity,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import ThemeToggle from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function InterviewsDashboardPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Form states for starting new interview
  const [type, setType] = useState<"resume" | "technical" | "hr">("resume");
  const [resumeId, setResumeId] = useState("");
  const [role, setRole] = useState("Frontend");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  async function fetchInterviews() {
    try {
      const res = await fetch("/api/interviews");
      const data = await res.json();
      if (data.success) {
        setInterviews(data.interviews || []);
      } else {
        toast.error(data.message || "Failed to load interviews");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching interviews");
    } finally {
      setLoading(false);
    }
  }

  async function fetchResumes() {
    try {
      const res = await fetch("/api/resumes");
      const data = await res.json();
      if (data.success) {
        setResumes(data.resumes || []);
        if (data.resumes?.length > 0) {
          // Default to the first (usually default) resume
          setResumeId(data.resumes[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchInterviews();
    fetchResumes();
  }, []);

  async function handleStartInterview(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);

    try {
      const payload: any = { type };
      if (type === "resume") {
        payload.resumeId = resumeId;
      } else if (type === "technical") {
        payload.role = role;
        payload.difficulty = difficulty;
      }

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Interview session initialized!");
        setIsOpen(false);
        router.push(`/dashboard/interviews/${data.interview._id}`);
      } else {
        toast.error(data.message || "Failed to create interview");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error starting interview session");
    } finally {
      setIsCreating(false);
    }
  }

  // Calculate statistics
  const completedInterviews = interviews.filter((i) => i.status === "completed");
  const avgScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) /
            completedInterviews.length
        )
      : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      {/* Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="font-bold text-lg tracking-tight bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent hover:opacity-80 transition duration-150"
            >
              Rehearsa AI
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Mock Interviews
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full flex flex-col gap-10">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              AI Mock Interview Simulator
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Conduct high-fidelity practice interviews tailored to your resume, specific technical topics, or behavioral HR scenarios.
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold shadow-md transition cursor-pointer">
                <Plus className="w-5 h-5" />
                Start Mock Interview
              </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Configure Interview Session
                </DialogTitle>
                <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                  Select your practice parameters. The AI will generate 5 targeted questions with follow-ups.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleStartInterview} className="space-y-6 mt-4">
                {/* Interview Type Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Interview Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "resume", label: "Resume-Based", emoji: "📄" },
                      { id: "technical", label: "Technical", emoji: "💻" },
                      { id: "hr", label: "HR Behavioral", emoji: "🤝" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setType(opt.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center cursor-pointer ${
                          type === opt.id
                            ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <span className="text-lg mb-1">{opt.emoji}</span>
                        <span className="text-[11px] leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Fields based on selection */}
                {type === "resume" && (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Select Parsed Resume
                    </label>
                    {resumes.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          No parsed resumes found. Please upload and analyze a resume first in{" "}
                          <Link href="/resumes" className="underline font-semibold">
                            Resume Manager
                          </Link>
                          .
                        </span>
                      </div>
                    ) : (
                      <select
                        value={resumeId}
                        onChange={(e) => setResumeId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {resumes.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.title} ({r.originalFileName})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {type === "technical" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Technical Subject
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {[
                          "Frontend",
                          "Backend",
                          "Full Stack",
                          "Java",
                          "Python",
                          "Data Science",
                          "DevOps & Cloud",
                          "System Design",
                          "TCS Technical Round",
                          "Infosys Technical Round",
                          "Accenture Technical Round",
                          "Amazon SDE Round",
                          "Google SDE Round",
                        ].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Difficulty
                      </label>
                      <div className="flex gap-2">
                        {["easy", "medium", "hard"].map((diff) => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setDifficulty(diff as any)}
                            className={`flex-1 py-2 rounded-lg text-xs capitalize border transition cursor-pointer ${
                              difficulty === diff
                                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white font-semibold"
                                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {type === "hr" && (
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1 animate-fadeIn">
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Standard HR Topics Covered:
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Introduction & self-presentation, strengths and weaknesses, situational conflict resolution, leadership traits, and cultural alignment.
                    </p>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-zinc-150 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || (type === "resume" && resumes.length === 0)}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition disabled:opacity-50 cursor-pointer"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      "Start Simulator"
                    )}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Total Sessions
              </span>
              <h3 className="text-2xl font-black mt-0.5">{interviews.length}</h3>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-500 dark:text-green-400 flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Completed
              </span>
              <h3 className="text-2xl font-black mt-0.5">{completedInterviews.length}</h3>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Average Score
              </span>
              <h3 className="text-2xl font-black mt-0.5">
                {completedInterviews.length > 0 ? `${avgScore}%` : "N/A"}
              </h3>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-lg">Interview Sessions</h3>
            <span className="text-xs text-zinc-400">History of your practices</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm">Loading interview history...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-6">
              <Briefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                No Interview Sessions Found
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                You haven't conducted any mock interviews yet. Click "Start Mock Interview" to test your knowledge!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-850 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="text-xs uppercase font-bold text-zinc-400 bg-zinc-50/20 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-6 py-4">Role / Topic</th>
                    <th className="px-6 py-4">Mode</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                  {interviews.map((item) => {
                    const isCompleted = item.status === "completed";
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {item.role || "General"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              item.type === "resume"
                                ? "bg-blue-50 border-blue-150 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400"
                                : item.type === "technical"
                                ? "bg-indigo-50 border-indigo-150 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400"
                                : "bg-purple-50 border-purple-150 text-purple-600 dark:bg-purple-950/20 dark:border-purple-900/50 dark:text-purple-400"
                            }`}
                          >
                            {item.type === "resume"
                              ? "Resume-Based"
                              : item.type === "technical"
                              ? "Technical"
                              : "HR Behavioral"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(item.startedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                              isCompleted
                                ? "text-green-600 dark:text-green-400"
                                : "text-amber-500 dark:text-amber-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCompleted ? "bg-green-600" : "bg-amber-500 animate-pulse"
                              }`}
                            />
                            {isCompleted ? "Completed" : "In Progress"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                          {isCompleted ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                              {item.score}%
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/interviews/${item._id}`}
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                              isCompleted
                                ? "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                            }`}
                          >
                            {isCompleted ? "View Report" : "Resume"}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
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

/**
 * FILE PURPOSE & HELP:
 * This component implements the main Mock Interviews dashboard page. It handles:
 * 1. Fetching all past mock interview sessions for the authenticated user and displaying them in a table.
 * 2. Visualising key stats: total mock sessions, total completed, and average score.
 * 3. A beautiful Radix UI-based Dialog trigger which pops up the selection wizard.
 *    - In the wizard, candidates can select to launch a Resume-Based (linked to parsed resumes),
 *      Technical (with customizable fields and difficulty levels), or HR interview.
 *    - Initializing triggers AI question generation and redirects the user immediately to the live interview screen.
 */
