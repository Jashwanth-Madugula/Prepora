import React from "react";
import { Video, Terminal, FileText } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Video,
      title: "Technical Mock Interviews",
      description: "Practice real-time audio and video interviews. Get instant evaluation on communication, confidence, and answer relevance backed by Gemini AI.",
    },
    {
      icon: Terminal,
      title: "DSA Coding Workspace",
      description: "Solve topic-wise DSA problems in our integrated IDE. Run, compile, and optimize code with instant logic checks and time complexity feedback.",
    },
    {
      icon: FileText,
      title: "Resume ATS Matcher",
      description: "Upload your resume and analyze it against any target job description. Identify missing keywords, experience alignment, and get ATS optimization tips.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white dark:bg-zinc-950 transition-colors duration-200 border-t border-zinc-200 dark:border-zinc-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
            Core Modules
          </h2>
          <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Designed to help you practice under realistic conditions.
          </p>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-base leading-relaxed">
            Skip the generic advice and start practicing with the actual assessment formats used by top tech companies.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex flex-col p-8 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-all duration-200 shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 mb-6">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
