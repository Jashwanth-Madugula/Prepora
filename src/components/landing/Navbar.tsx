"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface NavbarProps {
  isLoggedIn: boolean;
}

export default function Navbar({ isLoggedIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Product Preview", href: "#product-preview" },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src={isDark ? "/logo.png" : "/logo-light.png"}
            alt="Rehearsa AI Logo"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs font-semibold text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition duration-200"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Buttons & Theme Controls */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition duration-200"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold border border-zinc-300 dark:border-zinc-800 transition duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-zinc-500 hover:text-zinc-850 dark:hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 px-6 py-5 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-1.5"
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
