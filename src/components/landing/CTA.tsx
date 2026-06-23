"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTAProps {
  isLoggedIn: boolean;
}

export default function CTA({ isLoggedIn }: CTAProps) {
  return (
    <section className="relative py-28 bg-zinc-50 dark:bg-zinc-950 text-zinc-955 dark:text-white overflow-hidden transition-colors duration-200">
      
      {/* Decorative glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Banner Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          className="relative rounded-3xl bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-900/80 dark:via-zinc-900/50 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/80 p-8 sm:p-16 text-center backdrop-blur-md overflow-hidden shadow-lg dark:shadow-2xl"
        >
          {/* Subtle glow border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-30 pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            {/* Tagline Badge */}
            <div className="inline-flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                Practice. Perform. Get Hired.
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Ready to land your <br />
              <span className="bg-gradient-to-r from-blue-650 via-indigo-650 to-purple-650 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500 bg-clip-text text-transparent">
                dream software role?
              </span>
            </h2>

            {/* Description */}
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed font-light">
              Join thousands of candidates using Rehearsa AI to identify their skill gaps, raise their ATS resume score, compile optimal DSA code, and secure job offers.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-lg shadow-indigo-500/20 transition-all duration-300"
                >
                  Enter Your Dashboard Workspace
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group px-8 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-base shadow-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Start Assessments Now
                    <ArrowRight className="w-4 h-4 text-white dark:text-zinc-950 group-hover:translate-x-1 transition duration-200" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 font-semibold text-base hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white transition duration-200 backdrop-blur-sm shadow-sm"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
