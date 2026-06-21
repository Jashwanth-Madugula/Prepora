"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  React.useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.status === 404) {
          router.push("/complete-profile");
          return;
        }
        if (!response.ok && response.status === 401) {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setCheckingProfile(false);
      }
    };
    checkProfile();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      {/* Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Prepora
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard/coding"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Coding
            </Link>
            <Link
              href="/dashboard/analytics"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Analytics
            </Link>
            <Link
              href="/profile"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-850 transition duration-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full flex flex-col gap-8">
        <div className="mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome Back!</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Access your interview workspace, practice aptitude tests, track career analytics, and optimize resumes.
          </p>
        </div>

        {/* Workspace Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Resume Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg mb-4">
                📄
              </div>
              <h3 className="text-xl font-bold tracking-tight">Resume Management & ATS Engine</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Upload your resumes, parse them using Gemini, evaluate your overall ATS match score, and discover missing target keywords.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/resumes"
                className="inline-block px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 transition duration-200"
              >
                Manage Resumes
              </Link>
            </div>
          </div>

          {/* AI Mock Interview Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between border-t-2 border-t-indigo-500 dark:border-t-indigo-400">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
                🚀
              </div>
              <h3 className="text-xl font-bold tracking-tight">AI Mock Interviews</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Practice resume-based, technical, or HR questions. Receive instantaneous evaluation and detailed grades on 5 core metrics.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/interviews"
                className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold transition duration-200"
              >
                Start Mock Interview
              </Link>
            </div>
          </div>

          {/* Aptitude Prep Workspace Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between border-t-2 border-t-purple-500 dark:border-t-purple-400">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-500 dark:text-purple-400 flex items-center justify-center font-bold text-lg mb-4">
                🧠
              </div>
              <h3 className="text-xl font-bold tracking-tight">Aptitude Prep Workspace</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Strengthen quantitative, logical, and verbal capabilities. Take adaptive tests or prepare using specific company exam mocks.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/aptitude"
                className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white text-sm font-semibold transition duration-200"
              >
                Open Workspace
              </Link>
            </div>
          </div>

          {/* AI Coding Rounds Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between border-t-2 border-t-amber-500 dark:border-t-amber-400">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-955/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
                💻
              </div>
              <h3 className="text-xl font-bold tracking-tight">AI Coding Rounds</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Practice quantitative and logical coding rounds. Solve dynamic programming, string, or graph challenges with immediate compiler outputs and AI logic grading.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/coding"
                className="inline-block px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-705 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-sm font-semibold transition duration-200"
              >
                Start Coding Practice
              </Link>
            </div>
          </div>

          {/* AI Career Analytics Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between border-t-2 border-t-emerald-500 dark:border-t-emerald-400">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
                📈
              </div>
              <h3 className="text-xl font-bold tracking-tight">AI Career Analytics</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Analyze your performance scores across resumes, mock interviews, and aptitude. Review strengths and personalized action plan suggestions.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/analytics"
                className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-sm font-semibold transition duration-200"
              >
                View Analytics
              </Link>
            </div>
          </div>

          {/* Profile Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg mb-4">
                👤
              </div>
              <h3 className="text-xl font-bold tracking-tight">Placement Profile Dashboard</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Customize your academic details (CGPA, degree, graduation year), add target companies, skills list, and edit your GitHub or LinkedIn social URLs.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/profile"
                className="inline-block px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-semibold transition duration-200"
              >
                Update Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Security & System Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-8 mt-4">
          <div className="p-5 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/30 shadow-none flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Session Status</span>
              <h4 className="text-sm font-bold mt-1">Active & Secured</h4>
            </div>
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/30 shadow-none">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Auth Middleware</span>
            <h4 className="text-sm font-bold mt-1">Proxy-Guarded Gateway</h4>
          </div>

          <div className="p-5 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/30 shadow-none">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Theme Engine</span>
            <h4 className="text-sm font-bold mt-1">Light / Dark Adaptive</h4>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * FILE PURPOSE & HELP:
 * This is the candidate dashboard landing page page component. It acts as the principal panel for
 * navigating the platform. We have updated it to add a prominent action card for the "AI Mock Interviews"
 * features. Users can view stats or immediately launch a new resume-based, technical, or HR interview session
 * which directs them to the mock interview landing dashboard.
 */

