"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      {/* Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Prepora
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back!</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            This is your workspace. All features are configured and ready.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</span>
              <h3 className="text-lg font-bold mt-2">Active Session</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Your authentication tokens are active and verified.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">Online</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Security</span>
            <h3 className="text-lg font-bold mt-2">Route Protection</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Middleware is guarding `/dashboard` and sub-routes securely.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Theme</span>
            <h3 className="text-lg font-bold mt-2">Responsive Styling</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Optimized for both light and dark systems natively.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
