"use client";


/**
 * @file src/components/landing/ReadinessScore.tsx
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

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sliders, Sparkles, CheckCircle2 } from "lucide-react";

export default function ReadinessScore() {
  // Slider states (0 - 100)
  const [resumeScore, setResumeScore] = useState(70);
  const [codingScore, setCodingScore] = useState(65);
  const [interviewScore, setInterviewScore] = useState(55);
  const [csScore, setCsScore] = useState(60);
  const [aptitudeScore, setAptitudeScore] = useState(75);
  
  const [readinessScore, setReadinessScore] = useState(0);

  // Compute weight-adjusted readiness score
  // Weights: Resume=20%, Coding=25%, Interview=25%, CS Core=15%, Aptitude=15%
  useEffect(() => {
    const computed = 
      (resumeScore * 0.20) + 
      (codingScore * 0.25) + 
      (interviewScore * 0.25) + 
      (csScore * 0.15) + 
      (aptitudeScore * 0.15);
    setReadinessScore(Math.round(computed));
  }, [resumeScore, codingScore, interviewScore, csScore, aptitudeScore]);

  // Determine classification and color based on score
  const getClassification = (score: number) => {
    if (score >= 85) return { text: "Elite Candidate", color: "text-emerald-600 dark:text-emerald-450", stroke: "#10b981", desc: "Top 5% of candidates. Immediate hiring recommendation." };
    if (score >= 70) return { text: "Placement Ready", color: "text-indigo-650 dark:text-indigo-400", stroke: "#6366f1", desc: "Solid overall performance. Ready for premium engineering roles." };
    if (score >= 50) return { text: "Moderate Prep", color: "text-amber-600 dark:text-amber-400", stroke: "#f59e0b", desc: "Good foundation. Focus on mock interviews and DSA to level up." };
    return { text: "Needs Practice", color: "text-rose-600 dark:text-rose-500", stroke: "#ef4444", desc: "Requires targeted focus in multiple modules. Keep practicing!" };
  };

  const status = getClassification(readinessScore);
  const strokeDashoffset = 251.2 - (251.2 * readinessScore) / 100;

  return (
    <section id="readiness" className="relative py-28 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white overflow-hidden scroll-mt-20 transition-colors duration-200">
      
      {/* Glow shapes */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-650 dark:text-blue-500">Placement Readiness Engine</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">AI Placement Readiness Score.</h2>
          <p className="text-zinc-650 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
            Rehearsa AI consolidates all your assessment marks into a single, standardized Placement Readiness Score. Try the simulator below to see how it works!
          </p>
        </div>

        {/* Interactive Gauge Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-lg dark:shadow-2xl items-center">
          
          {/* Gauge Widget (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800/80 pb-10 lg:pb-0 lg:pr-10">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550 mb-6 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-650 dark:text-indigo-400" />
              Dynamic Readiness Gauge
            </span>
            
            {/* Radial SVG gauge */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  className="text-zinc-200 dark:text-zinc-800"
                />
                {/* Foreground value circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={status.stroke}
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{readinessScore}%</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${status.color}`}>
                  {status.text}
                </span>
              </div>
            </div>

            {/* Score Classification text */}
            <div className="mt-6 max-w-xs">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{status.text} Status</h4>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 mt-1.5 leading-relaxed font-light">
                {status.desc}
              </p>
            </div>
            
            <div className="mt-8 flex flex-col gap-2.5 w-full max-w-[260px] text-left text-xs bg-zinc-100 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 font-light">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-500 shrink-0" />
                <span>Adjust inputs to simulate mock metrics</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-500 shrink-0" />
                <span>Weighted according to recruiter criteria</span>
              </div>
            </div>
          </div>

          {/* Interactive Sliders (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col gap-8 lg:pl-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-2 text-zinc-850 dark:text-white">
                <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Readiness Score Simulator
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
                Drag the sliders to update the scores of each individual module. See how improving target sections pushes your readiness into the hiring-ready zones.
              </p>
            </div>

            {/* Slider List */}
            <div className="space-y-6">
              
              {/* Resume Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-550 dark:text-zinc-450">Resume ATS Match Score</span>
                  <span className="text-zinc-850 dark:text-zinc-200">{resumeScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={resumeScore}
                  onChange={(e) => setResumeScore(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 outline-none"
                />
              </div>

              {/* Coding Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-550 dark:text-zinc-450">Coding & DSA Performance</span>
                  <span className="text-zinc-855 dark:text-zinc-200">{codingScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={codingScore}
                  onChange={(e) => setCodingScore(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-650 dark:accent-indigo-500 outline-none"
                />
              </div>

              {/* Mock Interview Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-550 dark:text-zinc-450">AI Mock Interview Evaluation</span>
                  <span className="text-zinc-855 dark:text-zinc-200">{interviewScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={interviewScore}
                  onChange={(e) => setInterviewScore(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-650 dark:accent-purple-500 outline-none"
                />
              </div>

              {/* CS Subjects Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-555 dark:text-zinc-455">CS Core Subjects Quizzes</span>
                  <span className="text-zinc-855 dark:text-zinc-200">{csScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={csScore}
                  onChange={(e) => setCsScore(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-650 dark:accent-pink-500 outline-none"
                />
              </div>

              {/* Aptitude Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-555 dark:text-zinc-455">Quantitative & Logical Aptitude</span>
                  <span className="text-zinc-855 dark:text-zinc-200">{aptitudeScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aptitudeScore}
                  onChange={(e) => setAptitudeScore(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-650 dark:accent-cyan-500 outline-none"
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
