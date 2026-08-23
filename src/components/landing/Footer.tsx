"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 py-8 text-zinc-500 dark:text-zinc-400 text-xs transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Logo & Copyright */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-900 dark:text-white select-none">Rehearsa AI</span>
          <span className="text-zinc-300 dark:text-zinc-800">|</span>
          <p>© {new Date().getFullYear()} Rehearsa AI. All rights reserved.</p>
        </div>

        {/* Right Side: Simple Links */}
        <div className="flex gap-6">
          <Link href="#features" className="hover:text-zinc-800 dark:hover:text-white transition">Features</Link>
          <Link href="#product-preview" className="hover:text-zinc-800 dark:hover:text-white transition">Preview</Link>
          <span className="hover:text-zinc-800 dark:hover:text-white transition cursor-pointer">Privacy</span>
          <span className="hover:text-zinc-800 dark:hover:text-white transition cursor-pointer">Terms</span>
        </div>

      </div>
    </footer>
  );
}
