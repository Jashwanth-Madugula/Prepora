"use client";


/**
 * @file src/components/landing/DashboardPreview.tsx
 * @category React UI Component
 *
 * Why this code exists:
 * Renders a visual UI element or widget inside the candidate's application view.
 * 
 *
 * What problem it solves:
 * - Constructs modular, interactive interface components (like forms, buttons, timers, code-editors) keeping state reactive and responsive to candidate interactions.
 *
 * How it works internally:
 * - Implements a TypeScript React function component combining Tailwind CSS styling, React hooks (useState, useEffect, useMemo), animations (framer-motion), and callback events.
 */

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Terminal, Video, FileText, BarChart2, BookOpen, User } from "lucide-react";

export default function DashboardPreview() {
  return (
    <section className="relative py-28 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white overflow-hidden transition-colors duration-200">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-purple-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[45rem] h-[45rem] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header text */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-650 dark:text-blue-500">Workspace Preview</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">The ultimate prep cockpit.</h2>
          <p className="text-zinc-650 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
            Take a look inside Rehearsa AI. A unified space to access assessments, view detailed metrics, and track your career growth automatically.
          </p>
        </div>

        {/* Dashboard Mockup (Browser Style Frame) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          className="relative max-w-5xl mx-auto bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-xl dark:shadow-2xl overflow-hidden backdrop-blur-md"
        >
          {/* Mac-style Window Title Bar */}
          <div className="px-6 py-4 bg-zinc-100 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-zinc-500 font-semibold ml-3 tracking-wide">app.rehearsa.ai/dashboard</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 dark:bg-emerald-500 animate-pulse" />
              SSL Secure Session
            </div>
          </div>

          {/* Inner Interface Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            
            {/* Sidebar Mockup (3 columns on desktop, hidden on mobile) */}
            <div className="hidden md:flex md:col-span-3 bg-zinc-50/50 dark:bg-zinc-950/40 border-r border-zinc-200 dark:border-zinc-800/50 p-6 flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-blue-650 to-indigo-650 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Rehearsa AI</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-zinc-200 dark:bg-zinc-900 text-indigo-750 dark:text-indigo-400 border border-zinc-300 dark:border-zinc-800 font-semibold uppercase">v1.2</span>
                </div>
                
                {/* Nav Links */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                    <BarChart2 className="w-4 h-4" />
                    Overview
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-zinc-200 text-xs font-medium transition cursor-pointer">
                    <FileText className="w-4 h-4" />
                    Resume ATS
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-zinc-200 text-xs font-medium transition cursor-pointer">
                    <Video className="w-4 h-4" />
                    AI Mock Interviews
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-zinc-200 text-xs font-medium transition cursor-pointer">
                    <Terminal className="w-4 h-4" />
                    DSA Coding Round
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-zinc-200 text-xs font-medium transition cursor-pointer">
                    <BookOpen className="w-4 h-4" />
                    Core CS Subjects
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60 hover:text-zinc-950 dark:hover:text-zinc-200 text-xs font-medium transition cursor-pointer">
                    <User className="w-4 h-4" />
                    Candidate Profile
                  </div>
                </div>
              </div>

              {/* Bottom sidebar info */}
              <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-550 leading-relaxed font-light">
                Securely signed in as <br />
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold font-mono">candidate@rehearsa.ai</span>
              </div>
            </div>

            {/* Main Area Mockup (9 columns) */}
            <div className="md:col-span-9 p-6 sm:p-8 space-y-8 bg-white dark:bg-zinc-905">
              
              {/* Header Greeting & Gauge Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Welcome Back, Candidate!</h3>
                  <p className="text-zinc-650 dark:text-zinc-400 text-xs mt-1 font-light">Practice core DSA, review resume metrics, and analyze interview transcripts.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 shadow-inner">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="12" fill="transparent" className="text-zinc-200 dark:text-zinc-800" />
                      <circle cx="50" cy="50" r="40" stroke="#6366f1" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="50.2" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[10px] font-black text-zinc-850 dark:text-white">80%</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Overall Score</span>
                    <span className="text-[11px] font-extrabold text-indigo-650 dark:text-indigo-400">Placement Ready</span>
                  </div>
                </div>
              </div>

              {/* Workspace cards grid inside the mockup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* Mock Card 1 */}
                <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center mb-3">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold">Resume ATS</h4>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[85%]" />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-550 dark:text-zinc-400 mt-1.5 font-semibold">
                    <span>ATS Match</span>
                    <span>85% Score</span>
                  </div>
                </div>

                {/* Mock Card 2 */}
                <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center mb-3">
                    <Video className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-bold">Mock Interviews</h4>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[70%]" />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-555 dark:text-zinc-400 mt-1.5 font-semibold">
                    <span>AI Evaluated</span>
                    <span>70% Score</span>
                  </div>
                </div>

                {/* Mock Card 3 */}
                <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center mb-3">
                    <Terminal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-sm font-bold">AI Coding Mocks</h4>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-1 rounded-full mt-3 overflow-hidden">
                    <div className="bg-amber-500 h-full w-[75%]" />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-555 dark:text-zinc-400 mt-1.5 font-semibold">
                    <span>DSA Challenges</span>
                    <span>75% Score</span>
                  </div>
                </div>

              </div>

              {/* Bottom AI Recommendations mockup panel */}
              <div className="p-4 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800/70 space-y-3">
                <span className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Coach Guidance
                </span>
                <ul className="text-xs text-zinc-650 dark:text-zinc-300 space-y-2 list-disc pl-4 leading-relaxed font-light">
                  <li>Strengthen graph traversal optimization to improve DSA score from 75% to 85%.</li>
                  <li>Inject keywords &quot;System Design&quot; and &quot;Kubernetes&quot; into resume header.</li>
                </ul>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
