"use client";

import React from "react";
import Link from "next/link";

interface CTAProps {
  isLoggedIn: boolean;
}

export default function CTA({ isLoggedIn }: CTAProps) {
  return (
    <section className="bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white py-20 px-6 transition-colors duration-200 border-t border-zinc-200 dark:border-zinc-900">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        
        {/* Short Heading */}
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Ready to land your dream software role?
        </h2>

        {/* Short Description */}
        <p className="max-w-lg mx-auto text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
          Join candidates using Rehearsa AI to identify skill gaps, raise ATS resume scores, compile DSA code, and secure job offers.
        </p>

        {/* Single CTA Button */}
        <div className="pt-2">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition duration-200"
            >
              Enter Your Dashboard Workspace
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-block px-6 py-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition duration-200 border border-zinc-300 dark:border-zinc-800"
            >
              Start Assessments Now
            </Link>
          )}
        </div>

      </div>
    </section>
  );
}
