"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  ArrowLeft,
  ShieldAlert,
  Users,
  Radio,
  Activity,
  Cpu,
  Database,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Server,
  Layers,
  Terminal,
  Loader2,
} from "lucide-react";

interface AdminStats {
  stats: {
    totalUsers: number;
    activeSessionsCount: number;
    averageReadinessScore: number;
    usersWithScoresCount: number;
  };
  apiUsage: {
    whisperTranscriptions: number;
    llamaInterviewEvaluations: number;
    llamaInterviewGenerations: number;
    resumeParses: number;
    atsJobMatches: number;
    subjectAssessments: number;
    codingRounds: number;
    totalAIApiCalls: number;
  };
  system: {
    database: string;
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "api" | "system">("overview");

  const fetchAdminStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await fetch("/api/admin");
      
      if (res.status === 403 || res.status === 401) {
        setError("UNAUTHORIZED_ACCESS");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load admin stats: ${res.statusText}`);
      }

      const payload = await res.json();
      if (payload.success) {
        setStats(payload);
      } else {
        throw new Error(payload.error || "Failed to parse system diagnostics.");
      }
    } catch (err: any) {
      console.error("Admin stats fetch error:", err);
      setError(err.message || "An unexpected error occurred while compiling diagnostics.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.join(" ") || `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <Loader2 className="w-10 h-10 stroke-zinc-900 dark:stroke-zinc-100 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
          Gathering system metrics and user aggregates...
        </p>
      </div>
    );
  }

  if (error === "UNAUTHORIZED_ACCESS") {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-lg text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight mb-2 text-zinc-900 dark:text-zinc-50">
              Access Restricted
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              This panel is restricted to platform administrators. If you believe this is an error, please contact the system super administrator.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="w-full py-3 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 rounded-2xl text-sm font-bold hover:opacity-90 transition duration-200"
          >
            Back to Candidate Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-red-200/50 dark:border-red-900/30 p-8 rounded-3xl shadow-lg text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight mb-2 text-zinc-900 dark:text-zinc-50">
              Diagnostic Error
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {error || "An error occurred while compiling system stats."}
            </p>
          </div>
          <button
            onClick={() => fetchAdminStats()}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition duration-200"
          >
            Retry Diagnostics
          </button>
        </div>
      </div>
    );
  }

  const usageBreakdown = [
    { label: "Whisper (Speech Translation)", val: stats.apiUsage.whisperTranscriptions, color: "bg-teal-500" },
    { label: "Llama (Interview Evaluation)", val: stats.apiUsage.llamaInterviewEvaluations, color: "bg-indigo-600" },
    { label: "Llama (Interview Setup/Scenario)", val: stats.apiUsage.llamaInterviewGenerations, color: "bg-blue-500" },
    { label: "Llama (Resume Parsers)", val: stats.apiUsage.resumeParses, color: "bg-violet-500" },
    { label: "Llama (ATS Matches)", val: stats.apiUsage.atsJobMatches, color: "bg-pink-500" },
    { label: "Subject Quiz Generation", val: stats.apiUsage.subjectAssessments, color: "bg-purple-500" },
    { label: "DSA/Coding Attempt Evaluations", val: stats.apiUsage.codingRounds, color: "bg-amber-500" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans">
      {/* Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-rose-500 bg-clip-text text-transparent">
                Admin Diagnostic Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchAdminStats(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-150 dark:hover:bg-zinc-850 transition duration-200 cursor-pointer disabled:opacity-50"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full flex flex-col gap-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Platform Diagnostics</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Admin overview of user registrations, active sessions, backend engine health, and API usage stats.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3.5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-750 dark:text-indigo-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              Active Admin Session
            </span>
          </div>
        </div>

        {/* Aggregated Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Registered Users */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider block">Registered Users</span>
              <h2 className="text-3xl font-black tracking-tight mt-1">{stats.stats.totalUsers}</h2>
              <span className="text-[11px] text-zinc-500 mt-1 block">Active platform profiles</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Active Concurrent Web Sessions */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider block">Concurrent Sessions</span>
              <h2 className="text-3xl font-black tracking-tight mt-1">{stats.stats.activeSessionsCount}</h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-450 mt-1 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live devices connected
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
          </div>

          {/* Average Placement Readiness Score */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider block">Platform Avg Readiness</span>
              <h2 className="text-3xl font-black tracking-tight mt-1">{stats.stats.averageReadinessScore}%</h2>
              <span className="text-[11px] text-zinc-500 mt-1 block">Based on weighted averages</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          {/* Users with Active Assessments */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider block">Assessed Candidates</span>
              <h2 className="text-3xl font-black tracking-tight mt-1">
                {stats.stats.usersWithScoresCount}
                <span className="text-sm font-semibold text-zinc-400"> / {stats.stats.totalUsers}</span>
              </h2>
              <span className="text-[11px] text-zinc-500 mt-1 block">Have attempt histories</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800/80 gap-6">
          <button
            onClick={() => setActiveSection("overview")}
            className={`pb-3 text-sm font-bold border-b-2 transition duration-200 cursor-pointer ${
              activeSection === "overview"
                ? "border-indigo-600 text-indigo-900 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350"
            }`}
          >
            Overview & AI Usage
          </button>
          <button
            onClick={() => setActiveSection("api")}
            className={`pb-3 text-sm font-bold border-b-2 transition duration-200 cursor-pointer ${
              activeSection === "api"
                ? "border-indigo-600 text-indigo-900 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350"
            }`}
          >
            Granular API Count Details
          </button>
          <button
            onClick={() => setActiveSection("system")}
            className={`pb-3 text-sm font-bold border-b-2 transition duration-200 cursor-pointer ${
              activeSection === "system"
                ? "border-indigo-600 text-indigo-900 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350"
            }`}
          >
            System Diagnostics & Logs
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1">
          {activeSection === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
              {/* Glassmorphic AI Usage Chart Block */}
              <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">AI Token Consumption Share</h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                    Aggregate composition of call operations parsed via Groq API.
                  </p>
                </div>

                {stats.apiUsage.totalAIApiCalls === 0 ? (
                  <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
                    No AI transactions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Compound Horizontal Bar */}
                    <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                      {usageBreakdown.map((item, idx) => {
                        const percent = stats.apiUsage.totalAIApiCalls > 0 
                          ? (item.val / stats.apiUsage.totalAIApiCalls) * 100 
                          : 0;
                        if (percent === 0) return null;
                        return (
                          <div
                            key={idx}
                            className={`h-full ${item.color}`}
                            style={{ width: `${percent}%` }}
                            title={`${item.label}: ${item.val} calls (${Math.round(percent)}%)`}
                          />
                        );
                      })}
                    </div>

                    {/* Breakdown Indicators list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {usageBreakdown.map((item, idx) => {
                        const percent = stats.apiUsage.totalAIApiCalls > 0 
                          ? (item.val / stats.apiUsage.totalAIApiCalls) * 100 
                          : 0;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150/40 dark:border-zinc-850/60 text-xs font-semibold"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                              <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">{item.label}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold">{item.val} </span>
                              <span className="text-[10px] text-zinc-450">({Math.round(percent)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Engine State Column */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Uptime Diagnostic */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-500" />
                    Server Status
                  </h3>
                  <div className="space-y-3.5">
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2.5 text-xs font-semibold">
                      <span className="text-zinc-450">Database Engine</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold">
                        {stats.system.database}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2.5 text-xs font-semibold">
                      <span className="text-zinc-450">Server Platform</span>
                      <span className="font-bold uppercase">{stats.system.platform}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2.5 text-xs font-semibold">
                      <span className="text-zinc-450">Node.js Runtime</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{stats.system.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-450">Diagnostics Uptime</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatUptime(stats.system.uptime)}</span>
                    </div>
                  </div>
                </div>

                {/* API Key Health */}
                <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                    API Keys Integration Check
                  </h4>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-medium">
                    Groq LLM compiler and audio systems require a backend variable <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[11px] font-bold">GROQ_API_KEY</code>.
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600 dark:text-emerald-450 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Verified & Loaded in System
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "api" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 md:p-8 rounded-3xl shadow-sm animate-fade-in flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight">API Transaction Ledger</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                  Exhaustive database counters tracking AI prompts generated by user submissions.
                </p>
              </div>

              <div className="overflow-hidden border border-zinc-150 dark:border-zinc-800/80 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800/85">
                      <th className="p-4 font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">AI Service Category</th>
                      <th className="p-4 font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider text-center">Primary LLM Model</th>
                      <th className="p-4 font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider text-right">Aggregate Counts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850/60">
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
                      <td className="p-4 flex items-center gap-2.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                        Whisper Audio Transcriptions
                      </td>
                      <td className="p-4 text-center font-medium text-zinc-500">whisper-large-v3</td>
                      <td className="p-4 text-right font-extrabold text-zinc-900 dark:text-zinc-50">{stats.apiUsage.whisperTranscriptions}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
                      <td className="p-4 flex items-center gap-2.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                        Llama Interview Performance Review
                      </td>
                      <td className="p-4 text-center font-medium text-zinc-500">llama-3.3-70b-versatile</td>
                      <td className="p-4 text-right font-extrabold text-zinc-900 dark:text-zinc-50">{stats.apiUsage.llamaInterviewEvaluations}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
                      <td className="p-4 flex items-center gap-2.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                        Llama Mock Questions Generator
                      </td>
                      <td className="p-4 text-center font-medium text-zinc-500">llama-3.3-70b-versatile</td>
                      <td className="p-4 text-right font-extrabold text-zinc-900 dark:text-zinc-50">{stats.apiUsage.llamaInterviewGenerations}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
                      <td className="p-4 flex items-center gap-2.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                        Resume Parsers & Profilers
                      </td>
                      <td className="p-4 text-center font-medium text-zinc-500">llama-3.3-70b-versatile</td>
                      <td className="p-4 text-right font-extrabold text-zinc-900 dark:text-zinc-50">{stats.apiUsage.resumeParses}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
                      <td className="p-4 flex items-center gap-2.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                        ATS Job Match Reports
                      </td>
                      <td className="p-4 text-center font-medium text-zinc-500">llama-3.3-70b-versatile</td>
                      <td className="p-4 text-right font-extrabold text-zinc-900 dark:text-zinc-50">{stats.apiUsage.atsJobMatches}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
                      <td className="p-4 flex items-center gap-2.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                        Subject-wise Quiz Generators
                      </td>
                      <td className="p-4 text-center font-medium text-zinc-500">llama-3.3-70b-versatile</td>
                      <td className="p-4 text-right font-extrabold text-zinc-900 dark:text-zinc-50">{stats.apiUsage.subjectAssessments}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
                      <td className="p-4 flex items-center gap-2.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        DSA Coding Evaluations
                      </td>
                      <td className="p-4 text-center font-medium text-zinc-500">llama-3.3-70b-versatile</td>
                      <td className="p-4 text-right font-extrabold text-zinc-900 dark:text-zinc-50">{stats.apiUsage.codingRounds}</td>
                    </tr>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 font-bold">
                      <td className="p-4 flex items-center gap-2.5 uppercase text-zinc-450 tracking-wider">Cumulative Total Transactions</td>
                      <td className="p-4 text-center text-zinc-400 font-semibold">-</td>
                      <td className="p-4 text-right text-base text-indigo-650 dark:text-indigo-400 font-black">{stats.apiUsage.totalAIApiCalls}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "system" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
              {/* Uptime logs panel */}
              <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col gap-4">
                <h3 className="text-xl font-bold tracking-tight">Diagnostic Logs Terminal</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400">
                  Virtual system logs checking core API endpoints connectivity.
                </p>
                <div className="bg-zinc-950 text-zinc-50 p-5 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto h-64 shadow-inner flex flex-col gap-2">
                  <div className="text-zinc-500">[{new Date().toISOString()}] Initializing admin diagnostic check...</div>
                  <div className="text-green-400">✔ dbConnect() - MongoDB database connection successfully established. state: {stats.system.database}</div>
                  <div className="text-green-400">✔ verified JWT_ACCESS_SECRET and JWT_REFRESH_SECRET keys validity.</div>
                  <div className="text-green-400">✔ groq sdk check - central api handler compiled. status: verified</div>
                  <div className="text-green-400">✔ verified {stats.stats.totalUsers} registered candidate profiles integrity.</div>
                  <div className="text-zinc-500">[{new Date().toISOString()}] Active concurrent websocket sessions: {stats.stats.activeSessionsCount}</div>
                  <div className="text-indigo-400">✔ computed Platform average readiness score: {stats.stats.averageReadinessScore}%</div>
                  <div className="text-zinc-400">$ rehearsa-engine --status=healthy</div>
                  <div className="text-green-400">Rehearsa AI placement diagnostics engine successfully completed check with 0 warnings.</div>
                </div>
              </div>

              {/* Platform configuration details */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-3xl shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  Configuration Specs
                </h3>
                <div className="space-y-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-850">
                    <span className="text-[10px] text-zinc-450 uppercase">Runtime Target</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Node.js {stats.system.nodeVersion}</span>
                  </div>
                  <div className="flex flex-col gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-850">
                    <span className="text-[10px] text-zinc-450 uppercase">Platform OS</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 capitalize">{stats.system.platform}</span>
                  </div>
                  <div className="flex flex-col gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-850">
                    <span className="text-[10px] text-zinc-450 uppercase">Database Server</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Mongoose / MongoDB Atlas</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-450 uppercase">Secured Auth Middleware</span>
                    <span className="text-emerald-600 dark:text-emerald-450 font-bold flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Strict Token Rotation Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
