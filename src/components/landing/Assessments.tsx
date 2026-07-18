"use client";


/**
 * @file src/components/landing/Assessments.tsx
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
import { Video, FileText, Code2, BookOpen, BrainCircuit } from "lucide-react";

const categories = [
  {
    title: "AI Mock Interviews",
    description: "Simulate high-pressure video & audio interviews. Receive real-time transcript evaluations, scoring across 5 key metrics, and model answer guides.",
    icon: Video,
    color: "from-blue-500/20 to-indigo-500/10",
    borderColor: "group-hover:border-blue-500/50",
    glowColor: "group-hover:shadow-blue-500/10",
    badge: "Voice & Video AI",
  },
  {
    title: "Resume & ATS Analyzer",
    description: "Upload your resume to calculate your exact ATS match score. Get immediate Gemini-backed analysis on layout structure, missing keywords, and readability.",
    icon: FileText,
    color: "from-indigo-500/20 to-purple-500/10",
    borderColor: "group-hover:border-indigo-500/50",
    glowColor: "group-hover:shadow-indigo-500/10",
    badge: "ATS Rank Engine",
  },
  {
    title: "Topic-Wise DSA assessments",
    description: "Practice specialized coding assessments on Arrays, Strings, Stacks, Trees, BSTs, Dynamic Programming, and Graphs. Compile code with instant unit tests.",
    icon: Code2,
    color: "from-purple-500/20 to-pink-500/10",
    borderColor: "group-hover:border-purple-500/50",
    glowColor: "group-hover:shadow-purple-500/10",
    badge: "Integrated Compiler",
  },
  {
    title: "Core Subjects Assessments",
    description: "Excel in placements by mastering CS fundamentals. Take targeted MCQ quizzes in Operating Systems (OS), DBMS, Computer Networks, and OOPS.",
    icon: BookOpen,
    color: "from-pink-500/20 to-red-500/10",
    borderColor: "group-hover:border-pink-500/50",
    glowColor: "group-hover:shadow-pink-500/10",
    badge: "Computer Science Mocks",
  },
  {
    title: "Aptitude Prep Workspace",
    description: "Enhance your quantitative, logical, and verbal capabilities. Take adaptive tests mimicking real hiring exams of top consulting and tech firms.",
    icon: BrainCircuit,
    color: "from-cyan-500/20 to-blue-500/10",
    borderColor: "group-hover:border-cyan-500/50",
    glowColor: "group-hover:shadow-cyan-500/10",
    badge: "Cognitive Prep",
  },
];

export default function Assessments() {
  return (
    <section id="assessments" className="relative py-28 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white overflow-hidden scroll-mt-20 transition-colors duration-200">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold uppercase tracking-widest text-blue-650 dark:text-blue-500"
          >
            Assessments Catalog
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent"
          >
            Targeted evaluation templates.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed"
          >
            Rehearsa AI assessments match the latest standards of Fortune 500 tech companies and recruiters. Practice, analyze your scores, and excel.
          </motion.p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative p-8 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 backdrop-blur-md hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 shadow-md dark:shadow-2xl hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Glowing border container */}
                <div className={`absolute inset-0 rounded-3xl border border-transparent transition-all duration-300 ${cat.borderColor} pointer-events-none`} />
                <div className={`absolute inset-0 rounded-3xl shadow-lg transition-all duration-300 ${cat.glowColor} pointer-events-none`} />

                <div>
                  {/* Badge */}
                  <div className="flex justify-between items-center mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center border border-zinc-200 dark:border-zinc-800/80 group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-550 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight mb-3 text-zinc-850 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition duration-200">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-900/50 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition duration-200">
                  <span>Explore Practice Mode</span>
                  <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
