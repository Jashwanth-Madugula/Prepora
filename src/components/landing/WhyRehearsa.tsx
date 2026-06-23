"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Clock, Scale, ShieldAlert, Award } from "lucide-react";

const features = [
  {
    title: "24/7 Unlimited Mock Practice",
    description: "No more booking schedules or waiting for human interviewers. Start specialized HR or technical mock interview rounds on-demand, day or night.",
    icon: Clock,
  },
  {
    title: "100% Unbiased Evaluations",
    description: "Traditional interviews can be prone to human subjectivity. Our AI analyzes structure, syntax, semantics, and cadence objectively, ensuring fair benchmarks.",
    icon: Scale,
  },
  {
    title: "Targeted Placement Metrics",
    description: "Consolidate coding tests, aptitude scores, core CS subjects, and resume ATS analyses. Track everything in a unified dashboard.",
    icon: Award,
  },
  {
    title: "Enterprise Grade Security",
    description: "Your resumes, profile parameters, and interview video streams are encrypted and processed securely, ensuring absolute data privacy at all times.",
    icon: ShieldAlert,
  },
];

export default function WhyRehearsa() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="relative py-28 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white overflow-hidden transition-colors duration-200">
      {/* Decorative gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-650 dark:text-indigo-400">Key Differentiators</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Why choose Rehearsa AI?</h2>
          <p className="text-zinc-650 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
            The platform is built to optimize the recruitment journey, helping you analyze shortcomings, focus your prep, and land offers quickly.
          </p>
        </div>

        {/* Feature Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={itemVariants}
                className="p-8 rounded-3xl bg-white dark:bg-zinc-900/30 border border-zinc-250 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800 backdrop-blur-sm hover:bg-zinc-100/55 dark:hover:bg-zinc-900/40 shadow-md transition duration-300 flex gap-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-150">{f.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">{f.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
