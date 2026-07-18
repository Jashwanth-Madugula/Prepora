"use client";


/**
 * @file src/components/landing/AIRecommendations.tsx
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
import { motion, Variants } from "framer-motion";
import { AlertCircle, Terminal, HelpCircle, CheckCircle2 } from "lucide-react";

const recommendations = [
  {
    category: "Resume & ATS Analysis",
    title: "Inject Core Cloud Technologies",
    feedback: "Your resume lacks keywords corresponding to modern cloud architectures. Add instances of AWS/GCP, Docker, and Kubernetes to align with Senior Backend Roles.",
    priority: "High Priority",
    priorityColor: "bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20",
    icon: HelpCircle,
  },
  {
    category: "Coding & DSA Compiler",
    title: "Optimize Graph Traversals",
    feedback: "Your implementation of Dijkstra's algorithm uses a nested array lookup resulting in O(V²) complexity. Refactor using a Min-Heap / Priority Queue to achieve O(E log V).",
    priority: "Medium Priority",
    priorityColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Terminal,
  },
  {
    category: "AI Mock Interviews",
    title: "Calibrate Speech Cadence",
    feedback: "During the situational behavioral prompt, your speech rate peaked at 172 words per minute (WPM). Slow down to 135-150 WPM and introduce brief pauses after key points.",
    priority: "High Priority",
    priorityColor: "bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20",
    icon: AlertCircle,
  },
];

export default function AIRecommendations() {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <section id="evaluation" className="relative py-28 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white overflow-hidden scroll-mt-20 transition-colors duration-200">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Text Content (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Granular Evaluations</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Personalized AI action plans.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed font-light">
              Rehearsa AI does not just give you a simple grade. Our generative AI engine pinpoints exact conceptual flaws, vocabulary omissions, or algorithmic bottlenecks, generating a customized learning path.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-550/10 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">Gemini-Powered Explanations</h4>
                  <p className="text-xs text-zinc-550 dark:text-zinc-450 leading-relaxed font-light mt-0.5">Step-by-step guidance on how to fix bugs, solve problems, or phrase responses.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-550/10 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-855 dark:text-zinc-200">Priority Weightings</h4>
                  <p className="text-xs text-zinc-555 dark:text-zinc-455 leading-relaxed font-light mt-0.5">Recommendations are flagged by severity so you focus on what moves your score most.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Code/Resume Feedback Cards (7 Columns) */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:col-span-7 space-y-6"
          >
            {recommendations.map((rec) => {
              const Icon = rec.icon;
              return (
                <motion.div
                  key={rec.title}
                  variants={itemVariants}
                  whileHover={{ x: 8 }}
                  className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800 backdrop-blur-sm shadow-md dark:shadow-sm transition-all duration-300 flex gap-5"
                >
                  {/* Category icon */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  {/* Recommendation Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-550 uppercase tracking-wider">
                        {rec.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${rec.priorityColor}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-850 dark:text-zinc-150">
                      {rec.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                      {rec.feedback}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
