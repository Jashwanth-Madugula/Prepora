"use client";


/**
 * @file src/app/(auth)/reset-password/page.tsx
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

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordInput } from "@/lib/validations/auth";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setError("Reset token is missing. Please request a new password reset link.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      let resData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        resData = await response.json();
      } else {
        throw new Error("Unable to connect to the server. Please try again later.");
      }

      if (!response.ok) {
        throw new Error(resData?.message || "Failed to reset password");
      }

      setSuccess("Your password has been successfully reset!");
    } catch (err: any) {
      setError(err.message || "Something went wrong. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✕
        </div>
        <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-2">Invalid Reset Link</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
          The password reset token is missing or invalid. Please request a new password reset link.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm transition duration-200"
        >
          Request Reset Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-2">Password Reset Successful</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
          {success}
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm transition duration-200"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl">
      <div className="flex flex-col mb-6">
        <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Reset password</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Enter a secure new password for your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200"
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-6 bg-gradient-to-br from-zinc-50 to-zinc-150 dark:from-zinc-950 dark:to-zinc-900">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl text-center">
          <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-2">Loading</h2>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
