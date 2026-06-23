import React from "react";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create Account - Rehearsa AI",
  description: "Create a new Rehearsa AI account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-6 bg-gradient-to-br from-zinc-50 to-zinc-150 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full flex justify-center py-4">
        <RegisterForm />
      </div>
    </div>
  );
}
