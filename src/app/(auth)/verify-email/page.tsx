"use client";


/**
 * @file src/app/(auth)/verify-email/page.tsx
 * @category Utility / Helper
 *
 * Why this code exists:
 * 
 * 
 *
 * What problem it solves:
 * - 
 *
 * How it works internally:
 * - 
 */

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const hasVerified = useRef(false);

  const verify = async (tokenToVerify: string) => {
    try {
      setStatus("loading");
      setMessage("Verifying your email...");

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error("Unable to connect to the server. Please try again later.");
      }

      if (!response.ok) {
        throw new Error(data?.message || "Verification failed");
      }

      setStatus("success");
      setMessage(data?.message || "Your email has been verified successfully!");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to verify email. The link may have expired.");
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token in the URL.");
      return;
    }

    if (hasVerified.current) {
      return;
    }
    hasVerified.current = true;

    verify(token);
  }, [token]);

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-2">Verifying Email</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-2">Verification Success</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{message}</p>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm transition duration-200"
          >
            Sign In
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-2">Verification Failed</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {token && (
              <button
                onClick={() => verify(token)}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-semibold transition duration-200"
              >
                Try Again
              </button>
            )}
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm transition duration-200"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-6 bg-gradient-to-br from-zinc-50 to-zinc-150 dark:from-zinc-950 dark:to-zinc-900">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl text-center">
          <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-2">Loading</h2>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
