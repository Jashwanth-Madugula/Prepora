"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Footer() {
  const [isDark, setIsDark] = useState(true);

  // Monitor theme changes on documentElement
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900/80 py-16 text-zinc-650 dark:text-zinc-400 text-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
        
        {/* Brand Column (4 columns) */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <img 
              src={isDark ? "/logo.png" : "/logo-light.png"} 
              alt="Rehearsa AI Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed font-light">
            AI-driven interview prep, resume analysis, CS core subject mocks, aptitude workspace, and real-time placement readiness scoring.
          </p>
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-650 uppercase tracking-widest">
            Practice. Perform. Get Hired.
          </div>
        </div>

        {/* Links Columns (8 columns total) */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
          
          {/* Column 1 - Product */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#features" className="hover:text-black dark:hover:text-white transition">Features</Link></li>
              <li><Link href="#assessments" className="hover:text-black dark:hover:text-white transition">Assessments</Link></li>
              <li><Link href="#readiness" className="hover:text-black dark:hover:text-white transition">Readiness Score</Link></li>
              <li><Link href="#evaluation" className="hover:text-black dark:hover:text-white transition">AI Coaching</Link></li>
            </ul>
          </div>

          {/* Column 2 - Resources */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Documentation</span></li>
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Sample Coding Mocks</span></li>
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Speech Calibration Tips</span></li>
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">System Status</span></li>
            </ul>
          </div>

          {/* Column 3 - Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">About Us</span></li>
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Careers</span></li>
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Privacy & Data</span></li>
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Security</span></li>
            </ul>
          </div>

          {/* Column 4 - Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-black dark:hover:text-white transition cursor-pointer">Cookie Settings</span></li>
            </ul>
          </div>

        </div>

      </div>

      {/* Bottom Border & Copyright */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-550">
        <p>© {new Date().getFullYear()} Rehearsa AI. All rights reserved.</p>
        <div className="flex gap-4">
          <span className="hover:text-black dark:hover:text-zinc-400 transition cursor-pointer">GitHub</span>
          <span className="hover:text-black dark:hover:text-zinc-400 transition cursor-pointer">LinkedIn</span>
          <span className="hover:text-black dark:hover:text-zinc-400 transition cursor-pointer">Twitter</span>
        </div>
      </div>
    </footer>
  );
}
