"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Sparkles, ArrowRight, Play } from "lucide-react";

interface HeroProps {
  isLoggedIn: boolean;
}

export default function Hero({ isLoggedIn }: HeroProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white select-none transition-colors duration-200">
      
      {/* Background Grid and Radial Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#0c0c0d_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 dark:opacity-40" />
      
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[35rem] h-[35rem] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[30rem] h-[30rem] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-8 relative z-10"
      >
        {/* Animated Badge */}
        <motion.div variants={itemVariants} className="inline-flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-650 dark:text-zinc-300 backdrop-blur-md shadow-sm dark:shadow-inner dark:shadow-white/5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI-Driven Placement Readiness Platform</span>
          </div>
        </motion.div>

        {/* Brand/Product Hero Heading */}
        <motion.h1 
          variants={itemVariants} 
          className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-zinc-950 via-zinc-800 to-zinc-650 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent"
        >
          Master job interviews. <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-650 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500 bg-clip-text text-transparent">
            Practice, Perform & Get Hired.
          </span>
        </motion.h1>

        {/* Short details */}
        <motion.p 
          variants={itemVariants}
          className="max-w-2xl mx-auto text-base sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-light"
        >
          Rehearsa AI evaluates your placement readiness using Gemini AI. Take industry-standard coding rounds, adaptive aptitude mocks, and AI video interviews to identify gaps and secure your dream offer.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
        >
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center gap-2"
            >
              Go to Workspace Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition duration-200" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="group px-8 py-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-lg shadow-xl shadow-black/10 dark:shadow-white/5 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                Get Started for Free
                <ArrowRight className="w-5 h-5 text-white dark:text-zinc-950 group-hover:translate-x-1 transition duration-200" />
              </Link>
              <Link
                href="#assessments"
                className="px-8 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 font-semibold text-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white transition duration-200 backdrop-blur-sm shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-blue-600 dark:text-blue-500 fill-blue-600/10 dark:fill-blue-500/20" />
                Explore Assessments
              </Link>
            </>
          )}
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-zinc-200 dark:border-zinc-900/60 max-w-3xl mx-auto"
        >
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-650 to-indigo-650 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">85%</span>
            <span className="text-xs text-zinc-550 dark:text-zinc-500 uppercase tracking-wider mt-1 font-semibold">ATS Success Rate</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-650 to-purple-650 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">10k+</span>
            <span className="text-xs text-zinc-550 dark:text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Coding Questions Solved</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-650 to-pink-650 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">24/7</span>
            <span className="text-xs text-zinc-550 dark:text-zinc-500 uppercase tracking-wider mt-1 font-semibold">AI Interview Coaches</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-pink-650 to-blue-650 dark:from-pink-400 dark:to-blue-400 bg-clip-text text-transparent">100%</span>
            <span className="text-xs text-zinc-550 dark:text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Unbiased Scoring</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
    </section>
  );
}
