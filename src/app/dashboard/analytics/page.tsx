"use client";


/**
 * @file src/app/dashboard/analytics/page.tsx
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
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Video, 
  Brain, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Calendar,
  Loader2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface AnalyticsData {
  resume: {
    totalResumes: number;
    highestAtsScore: number;
    averageAtsScore: number;
    latestResumeTitle: string | null;
    missingKeywords: string[];
    matchedKeywords: string[];
    atsSuggestions: string[];
  };
  interviews: {
    totalInterviews: number;
    averageInterviewScore: number;
    metrics: {
      technicalAccuracy: number;
      communication: number;
      confidence: number;
      completeness: number;
      structure: number;
      clarity: number;
      fluency: number;
    };
  };
  aptitude: {
    totalAptitudeTests: number;
    averageAptitudeScore: number;
    categoryAccuracy: {
      quantitative: number;
      logical: number;
      verbal: number;
      mixed: number;
    };
  };
  recommendations: string[];
}

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "interviews" | "aptitude" | "ats" | "action">("overview");

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setData(payload);
        }
      }
    } catch (err) {
      console.error("Failed to load AI analytics dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <Loader2 className="w-10 h-10 stroke-zinc-900 dark:stroke-zinc-100 animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Compiling unified AI performance metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <p className="text-sm font-medium mb-4 text-zinc-500 dark:text-zinc-400">Could not retrieve analytics data.</p>
        <Link href="/dashboard" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Pure SVG circular progress gauge helper
  const CircularGauge = ({ value, label, icon, colorClass = "stroke-indigo-650 dark:stroke-indigo-500" }: { value: number; label: string; icon: React.ReactNode; colorClass?: string }) => {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl shadow-sm items-center gap-6">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-zinc-100 dark:stroke-zinc-800"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className={`${colorClass} transition-all duration-1000 ease-out`}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-lg font-extrabold">{value}%</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
          </div>
          <h4 className="text-xl font-bold tracking-tight">
            {value >= 80 ? "Excellent Progress" : value >= 60 ? "Steady Growth" : "Focus Required"}
          </h4>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans">
      
      {/* Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                AI Performance Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/profile"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full flex flex-col gap-8">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">AI Career Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            A comprehensive overview of your preparation performance from resumes, aptitude tests, and AI interviews.
          </p>
        </div>

        {/* Highlight Scorecard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CircularGauge 
            value={data.resume.highestAtsScore} 
            label="Resume ATS Score" 
            icon={<FileText className="w-3.5 h-3.5 text-indigo-500" />} 
          />
          <CircularGauge 
            value={data.interviews.averageInterviewScore} 
            label="Interview Skill Average" 
            icon={<Video className="w-3.5 h-3.5 text-emerald-500" />} 
            colorClass="stroke-emerald-650 dark:stroke-emerald-500"
          />
          <CircularGauge 
            value={data.aptitude.averageAptitudeScore} 
            label="Aptitude Test Score" 
            icon={<Brain className="w-3.5 h-3.5 text-purple-500" />} 
            colorClass="stroke-purple-650 dark:stroke-purple-500"
          />
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800/80 gap-6">
          {[
            { id: "overview", label: "Overview", icon: <Compass className="w-4 h-4" /> },
            { id: "interviews", label: "AI Mock Interviews", icon: <Video className="w-4 h-4" /> },
            { id: "aptitude", label: "Aptitude Tests", icon: <Brain className="w-4 h-4" /> },
            { id: "ats", label: "Resume ATS Match", icon: <FileText className="w-4 h-4" /> },
            { id: "action", label: "AI Action Plan", icon: <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-900 dark:border-indigo-550 dark:text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 min-h-[400px]">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Scorecard breakdown */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Preparation Highlights</h3>
                  <div className="space-y-4">
                    
                    {/* Resume Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>ATS Matches & Keywords Strength</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{data.resume.highestAtsScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-550 rounded-full" style={{ width: `${data.resume.highestAtsScore}%` }} />
                      </div>
                    </div>

                    {/* Interview Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Interview Performance Score</span>
                        <span className="text-emerald-650 dark:text-emerald-400">{data.interviews.averageInterviewScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.interviews.averageInterviewScore}%` }} />
                      </div>
                    </div>

                    {/* Aptitude Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Aptitude Average Score</span>
                        <span className="text-purple-650 dark:text-purple-400">{data.aptitude.averageAptitudeScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${data.aptitude.averageAptitudeScore}%` }} />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Main Metrics table summary */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Completed Modules Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-zinc-200/30 dark:border-zinc-800/50 text-center">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1">ATS Resumes</h4>
                      <h2 className="text-2xl font-extrabold">{data.resume.totalResumes}</h2>
                      <p className="text-[10px] text-zinc-500 mt-2">Active Profiles Uploaded</p>
                    </div>
                    <div className="p-4 rounded-xl border border-zinc-200/30 dark:border-zinc-800/50 text-center">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1">Mock Sessions</h4>
                      <h2 className="text-2xl font-extrabold">{data.interviews.totalInterviews}</h2>
                      <p className="text-[10px] text-zinc-500 mt-2">Completed AI Simulations</p>
                    </div>
                    <div className="p-4 rounded-xl border border-zinc-200/30 dark:border-zinc-800/50 text-center">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1">Aptitude Tests</h4>
                      <h2 className="text-2xl font-extrabold">{data.aptitude.totalAptitudeTests}</h2>
                      <p className="text-[10px] text-zinc-500 mt-2">Attempts Evaluation Completed</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action plan preview column */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-none">
                  <h3 className="text-base font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-300 mb-4">
                    <Sparkles className="w-4 h-4 text-indigo-500" /> Top Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {data.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i} className="flex gap-2 p-3.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 text-xs leading-relaxed font-medium">
                        <CheckCircle2 className="w-4 h-4 stroke-indigo-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => setActiveTab("action")}
                    className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    View Full Action Plan <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. INTERVIEWS TAB */}
          {activeTab === "interviews" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl shadow-sm animate-fade-in flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold mb-1">AI Mock Interview Analytics</h3>
                <p className="text-xs text-zinc-500">Breakdown of communication and performance metrics across completed interview sessions.</p>
              </div>

              {data.interviews.totalInterviews === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <Video className="w-10 h-10 text-zinc-350" />
                  <p className="text-sm font-semibold text-zinc-400">No mock interviews completed yet.</p>
                  <Link href="/dashboard/interviews" className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl">
                    Launch Setup Wizard
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Detailed Scores */}
                  <div className="space-y-5">
                    <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Granular Performance Levels</h4>
                    {[
                      { label: "Technical Accuracy", val: data.interviews.metrics.technicalAccuracy, color: "bg-emerald-500" },
                      { label: "Communication Skill", val: data.interviews.metrics.communication, color: "bg-indigo-550" },
                      { label: "Delivery Confidence", val: data.interviews.metrics.confidence, color: "bg-amber-500" },
                      { label: "Completeness (STAR)", val: data.interviews.metrics.completeness, color: "bg-purple-550" },
                      { label: "Answer Structure", val: data.interviews.metrics.structure, color: "bg-rose-500" },
                      { label: "Clarity", val: data.interviews.metrics.clarity, color: "bg-cyan-500" },
                      { label: "Fluency", val: data.interviews.metrics.fluency, color: "bg-violet-500" },
                    ].map((metric, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>{metric.label}</span>
                          <span className="font-extrabold">{metric.val}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${metric.color} rounded-full`} style={{ width: `${metric.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Stats */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-900/50 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-4">Simulator Insights</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between border-b border-zinc-105/50 dark:border-zinc-800/30 pb-2.5">
                          <span className="text-xs text-zinc-500">Sessions Completed</span>
                          <span className="text-sm font-extrabold">{data.interviews.totalInterviews}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-105/50 dark:border-zinc-800/30 pb-2.5">
                          <span className="text-xs text-zinc-500">Overall Accuracy Rate</span>
                          <span className="text-sm font-extrabold text-emerald-650 dark:text-emerald-400">{data.interviews.averageInterviewScore}%</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-105/50 dark:border-zinc-800/30 pb-2.5">
                          <span className="text-xs text-zinc-500">Speech Clarity Evaluation</span>
                          <span className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400">{data.interviews.metrics.clarity}%</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-xs text-zinc-500">Delivery Fluency Rate</span>
                          <span className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400">{data.interviews.metrics.fluency}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-start gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-950 dark:text-emerald-350">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Interview analytics are aggregated dynamically from all completed technical and HR simulation questions. Keep practicing to build high delivery records.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. APTITUDE TAB */}
          {activeTab === "aptitude" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl shadow-sm animate-fade-in flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold mb-1">Aptitude Category Matrix</h3>
                <p className="text-xs text-zinc-500">Average accuracy and completion count across core reasoning categories.</p>
              </div>

              {data.aptitude.totalAptitudeTests === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <Brain className="w-10 h-10 text-zinc-350" />
                  <p className="text-sm font-semibold text-zinc-400">No aptitude assessments submitted yet.</p>
                  <Link href="/dashboard/aptitude" className="px-4 py-2 bg-purple-650 hover:bg-purple-750 text-white text-xs font-semibold rounded-xl">
                    Open Aptitude Prep
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Category Breakdown */}
                  <div className="space-y-5">
                    <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Aptitude Skill Accuracy</h4>
                    {[
                      { name: "Quantitative Reasoning", val: data.aptitude.categoryAccuracy.quantitative, color: "bg-purple-500" },
                      { name: "Logical Deduction", val: data.aptitude.categoryAccuracy.logical, color: "bg-indigo-600" },
                      { name: "Verbal Capability", val: data.aptitude.categoryAccuracy.verbal, color: "bg-cyan-500" },
                      { name: "Mixed Assessments", val: data.aptitude.categoryAccuracy.mixed, color: "bg-amber-500" },
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>{item.name}</span>
                          <span className="font-extrabold">{item.val > 0 ? `${item.val}%` : "No attempts"}</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Block */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-900/50 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-4">Exam Summary</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between border-b border-zinc-105/50 dark:border-zinc-800/30 pb-2.5">
                          <span className="text-xs text-zinc-500">Assessments Submitted</span>
                          <span className="text-sm font-extrabold">{data.aptitude.totalAptitudeTests}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-105/50 dark:border-zinc-800/30 pb-2.5">
                          <span className="text-xs text-zinc-500">Overall Accuracy Rate</span>
                          <span className="text-sm font-extrabold text-purple-650 dark:text-purple-400">{data.aptitude.averageAptitudeScore}%</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-105/50 dark:border-zinc-800/30 pb-2.5">
                          <span className="text-xs text-zinc-500">Quantitative Strength</span>
                          <span className="text-sm font-extrabold">{data.aptitude.categoryAccuracy.quantitative}%</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-xs text-zinc-500">Logical Reasoning Strength</span>
                          <span className="text-sm font-extrabold">{data.aptitude.categoryAccuracy.logical}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-start gap-2 text-xs bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-purple-950 dark:text-purple-350">
                      <Compass className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <span>Adaptive and company prep challenges dynamically scale metrics here. Make sure to complete a diagnostic mock to update baseline metrics.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. RESUME ATS TAB */}
          {activeTab === "ats" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl shadow-sm animate-fade-in flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold mb-1">ATS Scanner Evaluation</h3>
                <p className="text-xs text-zinc-500">Core metrics, keyword density, and recommendations for target recruitment templates.</p>
              </div>

              {data.resume.totalResumes === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <FileText className="w-10 h-10 text-zinc-350" />
                  <p className="text-sm font-semibold text-zinc-400">No resumes uploaded yet.</p>
                  <Link href="/resumes" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-xl">
                    Upload Resume
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left stats */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150/30 dark:border-zinc-850/50">
                      <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-4">ATS Profile</h4>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-0.5">LATEST RESUME FILE</span>
                          <span className="text-xs font-bold truncate max-w-full block">{data.resume.latestResumeTitle || "Untitled Profile"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-0.5">MAX ATS SCORE LEVEL</span>
                          <span className="text-base font-extrabold text-indigo-650 dark:text-indigo-400">{data.resume.highestAtsScore}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-0.5">AVERAGE ATS RATING</span>
                          <span className="text-sm font-bold">{data.resume.averageAtsScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                      <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-2">Resume Optimization Tip</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                        Make sure to re-evaluate your ATS match after modifying your resume text to match targeted recruiters. Ideal matches hover above 75%.
                      </p>
                    </div>
                  </div>

                  {/* Keywords lists */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-3">Target Missing Keywords</h4>
                      {data.resume.missingKeywords.length === 0 ? (
                        <p className="text-xs text-zinc-400">No missing keywords detected! Your profile aligns cleanly with standard targets.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {data.resume.missingKeywords.map((kw, i) => (
                            <span key={i} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-3">Matched Skills & Keywords</h4>
                      {data.resume.matchedKeywords.length === 0 ? (
                        <p className="text-xs text-zinc-400">No matching keyword records detected yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {data.resume.matchedKeywords.map((kw, i) => (
                            <span key={i} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {data.resume.atsSuggestions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-3">Optimization Checklist</h4>
                        <ul className="space-y-2">
                          {data.resume.atsSuggestions.map((sug, i) => (
                            <li key={i} className="flex gap-2 text-xs text-zinc-550 dark:text-zinc-400 items-start">
                              <AlertCircle className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                              <span>{sug}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>
          )}

          {/* 5. AI ACTION PLAN TAB */}
          {activeTab === "action" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-2xl shadow-sm animate-fade-in flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold">Personalized Preparation Blueprint</h3>
                  <p className="text-xs text-zinc-500">Cross-module recommendations generated by AI based on your overall placement strength levels.</p>
                </div>
              </div>

              <div className="space-y-4">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150/30 dark:border-zinc-850/50 hover:shadow-sm transition duration-200">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold mb-1">Recommended Action</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                        {rec}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-5 rounded-2xl bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md shadow-indigo-600/10">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 shrink-0 text-white" />
                  <div>
                    <h4 className="text-sm font-bold">Ready to push your scores higher?</h4>
                    <p className="text-xs text-indigo-100 mt-0.5">Attempt dynamic adaptive exams or prepare targeting specific top product/service companies.</p>
                  </div>
                </div>
                <Link 
                  href="/dashboard/aptitude" 
                  className="px-5 py-2.5 bg-white text-indigo-650 hover:bg-zinc-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  Configure Aptitude Challenge <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
