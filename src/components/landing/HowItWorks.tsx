"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { UserPlus, Compass, Cpu, GraduationCap } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Create Profile & Upload Resume",
    description: "Fill in academic details, target companies, and upload your resume. Our Gemini parser immediately calculates your initial ATS matching score and extracts keywords.",
    icon: UserPlus,
    color: "text-blue-650 dark:text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    step: "02",
    title: "Take Diverse Mocks & Tests",
    description: "Engage in coding rounds, mock interviews, CS fundamental quizzes, or quant aptitude assessments tailored specifically for your target companies.",
    icon: Compass,
    color: "text-indigo-650 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  {
    step: "03",
    title: "Instant AI Evaluation",
    description: "Our advanced evaluation engine grades your speech cadence, grammar, DSA code correctness, execution time, and correctness of core concepts instantly.",
    icon: Cpu,
    color: "text-purple-650 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    step: "04",
    title: "Unlock Placement Readiness",
    description: "Receive an aggregate Placement Readiness Score, customized learning targets, and a detailed list of actionable suggestions to secure your job offers.",
    icon: GraduationCap,
    color: "text-pink-650 dark:text-pink-400",
    bgColor: "bg-pink-500/10",
  },
];

export default function HowItWorks() {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const stepVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 100, damping: 12 },
    },
  };

  return (
    <section id="how-it-works" className="relative py-28 bg-zinc-50 dark:bg-zinc-950 text-zinc-955 dark:text-white overflow-hidden scroll-mt-20 transition-colors duration-200">
      
      {/* Decorative vertical gradient strip */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-800 to-transparent pointer-events-none hidden lg:block" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-24 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-650 dark:text-indigo-400">Workflow Roadmap</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">How Rehearsa AI works.</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
            Four simple steps to go from practice mocks to placement readiness. Start taking assessments, iterate on feedback, and land high-paying roles.
          </p>
        </div>

        {/* Steps Timeline Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16"
        >
          {steps.map((s, index) => {
            const Icon = s.icon;
            // Determine alignment styles to create zig-zag pattern on desktop
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={s.step}
                variants={stepVariants}
                className={`relative flex gap-6 p-8 rounded-3xl bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-900/80 backdrop-blur-sm hover:border-zinc-300 dark:hover:border-zinc-800 transition duration-300 ${
                  isEven ? "lg:translate-y-4" : "lg:-translate-y-4"
                }`}
              >
                {/* Timeline connector circle for desktop */}
                <div className={`absolute top-1/2 w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 hidden lg:block ${
                  isEven ? "-right-[29px]" : "-left-[29px]"
                } -translate-y-1/2 z-20`} />

                {/* Step number badge */}
                <div className="flex flex-col items-center">
                  <span className={`text-4xl font-black ${s.color} tracking-tight opacity-40`}>
                    {s.step}
                  </span>
                  <div className={`w-12 h-12 rounded-xl ${s.bgColor} ${s.color} flex items-center justify-center mt-3 shadow-inner`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-850 dark:text-zinc-100">
                    {s.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                    {s.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
