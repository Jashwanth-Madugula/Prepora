"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Terminal, Video, FileText, BarChart2, BookOpen, User, Sparkles } from "lucide-react";

interface HeroProps {
  isLoggedIn: boolean;
}

export default function Hero({ isLoggedIn }: HeroProps) {
  return (
    <section className="bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white px-6 pt-20 pb-20 transition-colors duration-200 border-b border-zinc-150 dark:border-zinc-900">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        
        {/* Simplified Header */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
          Master job interviews. <br />
          <span className="text-indigo-600 dark:text-indigo-400">Practice, Perform & Get Hired.</span>
        </h1>

        {/* Short Description */}
        <p className="max-w-2xl mx-auto text-base text-zinc-650 dark:text-zinc-400 leading-relaxed font-normal">
          Rehearsa AI evaluates your placement readiness using AI. Take industry-standard coding rounds, adaptive aptitude mocks, and AI video interviews to identify gaps and secure your dream offer.
        </p>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition duration-200 flex items-center gap-2"
            >
              Go to Workspace Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-sm transition duration-200 flex items-center gap-2 border border-zinc-200 dark:border-zinc-800"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Embedded Browser Product Preview */}
        <div id="product-preview" className="pt-12">
          <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-md overflow-hidden text-left">
            
            {/* Browser window top bar */}
            <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/70 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-[10px] text-zinc-400 font-semibold ml-3 tracking-wide select-none">app.rehearsa.ai/dashboard</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[8px] text-zinc-500 font-mono select-none">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                SSL Secure
              </div>
            </div>

            {/* Browser mockup body */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-zinc-50 dark:bg-zinc-950/20">
              
              {/* Sidebar mockup */}
              <div className="md:col-span-3 bg-white dark:bg-zinc-950 p-4 border-r border-zinc-200 dark:border-zinc-900 flex flex-col justify-between hidden md:flex">
                <div className="space-y-4">
                  <div className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-200">Rehearsa AI</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold">
                      <BarChart2 className="w-3.5 h-3.5" />
                      Overview
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-zinc-500 dark:text-zinc-400 text-[11px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
                      <FileText className="w-3.5 h-3.5" />
                      Resume ATS
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-zinc-500 dark:text-zinc-400 text-[11px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
                      <Video className="w-3.5 h-3.5" />
                      Mock Interviews
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-zinc-500 dark:text-zinc-400 text-[11px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
                      <Terminal className="w-3.5 h-3.5" />
                      DSA Coding
                    </div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-[9px] text-zinc-450 border border-zinc-150 dark:border-zinc-800 font-mono">
                  candidate@rehearsa.ai
                </div>
              </div>

              {/* Main dashboard mockup page */}
              <div className="md:col-span-9 p-5 space-y-6 bg-white dark:bg-zinc-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Welcome Back, Candidate!</h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Practice core DSA, review resume metrics, and analyze transcripts.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Overall Score:</span>
                    <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">80% Ready</span>
                  </div>
                </div>

                {/* Dashboard mockup grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <h4 className="text-xs font-bold">Resume ATS</h4>
                    <div className="flex justify-between text-[9px] text-zinc-500 mt-2 font-medium">
                      <span>ATS Match</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">85%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                    <Video className="w-4 h-4 text-indigo-650 dark:text-indigo-400 mb-2" />
                    <h4 className="text-xs font-bold">Mock Interviews</h4>
                    <div className="flex justify-between text-[9px] text-zinc-500 mt-2 font-medium">
                      <span>Completed</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">70% Score</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                    <Terminal className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-2" />
                    <h4 className="text-xs font-bold">DSA Mocks</h4>
                    <div className="flex justify-between text-[9px] text-zinc-500 mt-2 font-medium">
                      <span>Logic Check</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">75% Score</span>
                    </div>
                  </div>
                </div>

                {/* AI Guidance snippet */}
                <div className="p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-850/80 space-y-1.5">
                  <span className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1 select-none">
                    <Sparkles className="w-3 h-3" />
                    AI Coach Guidance
                  </span>
                  <ul className="text-[10px] text-zinc-650 dark:text-zinc-300 space-y-1 list-disc pl-3">
                    <li>Strengthen graph traversal optimization to improve DSA score.</li>
                    <li>Inject keywords &quot;System Design&quot; and &quot;Kubernetes&quot; into resume header.</li>
                  </ul>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
