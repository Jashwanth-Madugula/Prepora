import React from "react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password - Prepora",
  description: "Request a password reset link for your Prepora account",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-6 bg-gradient-to-br from-zinc-50 to-zinc-150 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full flex justify-center py-4">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
