import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const metadata = {
  title: "Prepora - AI-Powered Interview Preparation",
  description: "Accelerate your career preparation with AI-driven mock interviews, resume analysis, and coding tests.",
};

async function checkIsLoggedIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return false;
  const decoded = verifyAccessToken<JWTPayload>(token);
  return !!decoded;
}

export default async function LandingPage() {
  const isLoggedIn = await checkIsLoggedIn();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition duration-200">
      
      {/* Header */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-900 bg-white/80 dark:bg-zinc-955/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-black to-zinc-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Prepora
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
              AI Beta
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <ThemeToggle />
            
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 transition duration-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 transition duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-300/20 dark:bg-zinc-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-650 dark:text-zinc-450 mb-4 animate-fade-in shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Empowering Next-Gen Professionals
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent leading-none">
            Master your job interviews with generative AI.
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-zinc-550 dark:text-zinc-450 leading-relaxed">
            Prepora is the ultimate industry-level preparation platform. Simulate realistic interviews, receive structural resume analysis, and boost your success rate.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-8 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-base hover:opacity-90 transition duration-200 shadow-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-base hover:opacity-90 transition duration-200 shadow-lg"
                >
                  Get Started for Free
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 font-semibold text-base hover:bg-zinc-100 dark:hover:bg-zinc-900 transition duration-200 backdrop-blur-sm shadow-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20 w-full relative z-10">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">Full-suite interview toolkit</h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">Everything you need to excel in your placements and competitive interviews.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition duration-300 flex flex-col justify-between group shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold text-white mb-6 group-hover:scale-105 transition duration-350">
                🎙️
              </div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">AI Mock Interviews</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                Experience simulated high-pressure interviews with specialized AI. Receive immediate grading, feedback, and answers.
              </p>
            </div>
            <div className="mt-8 text-xs font-semibold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">Coming soon in Phase 2</div>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition duration-300 flex flex-col justify-between group shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold text-white mb-6 group-hover:scale-105 transition duration-350">
                📄
              </div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">Resume & ATS Analyzer</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                Parse your resume using Gemini AI. Grade it against real industry standards, see missing keywords, and get detailed recommendations.
              </p>
            </div>
            <div className="mt-8 text-xs font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Now
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition duration-300 flex flex-col justify-between group shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold text-white mb-6 group-hover:scale-105 transition duration-350">
                💻
              </div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">Coding Test Practice</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                Practice complex coding tests, data structures, and algorithmic problems with instant unit tests feedback.
              </p>
            </div>
            <div className="mt-8 text-xs font-semibold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">Coming soon in Phase 2</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-900 bg-white dark:bg-zinc-955 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-650">
          <p>© 2026 Prepora. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-zinc-850 dark:hover:text-zinc-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-850 dark:hover:text-zinc-400 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
