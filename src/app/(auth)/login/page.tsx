import React from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In - Rehearsa AI",
  description: "Sign in to your Rehearsa AI account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-6 bg-gradient-to-br from-zinc-50 to-zinc-150 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full flex justify-center py-4">
        <LoginForm />
      </div>
    </div>
  );
}
