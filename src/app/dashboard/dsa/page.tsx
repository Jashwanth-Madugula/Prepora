"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code,
  Sparkles,
  ChevronRight,
  BookOpen,
  Building,
  Sliders,
  Play,
  Loader2,
  Brain,
  Layers,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

interface DSATopic {
  name: string;
  description: string;
  gradient: string;
  icon: React.ReactNode;
}

interface Company {
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export default function DSADashboardPage() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);

  const topics: DSATopic[] = [
    {
      name: "Arrays",
      description: "Subarrays, rotations, sliding window, two pointers, and multi-dimensional matrices.",
      gradient: "from-red-500/10 to-orange-500/10 border-orange-500/20 dark:border-orange-500/10 hover:border-orange-500/40",
      icon: <Layers className="w-5 h-5 text-orange-500" />,
    },
    {
      name: "Strings",
      description: "Anagrams, palindromes, substring searches, conversions, and pattern matching algorithms.",
      gradient: "from-emerald-500/10 to-teal-500/10 border-teal-500/20 dark:border-teal-500/10 hover:border-teal-500/40",
      icon: <Code className="w-5 h-5 text-teal-500" />,
    },
    {
      name: "Linked Lists",
      description: "Single, double, and circular lists. Reversals, loop detection, and merging techniques.",
      gradient: "from-blue-500/10 to-indigo-500/10 border-indigo-500/20 dark:border-indigo-500/10 hover:border-indigo-500/40",
      icon: <ChevronRight className="w-5 h-5 text-indigo-500" />,
    },
    {
      name: "Stack & Queue",
      description: "Monotonic stacks, circular queues, infix/postfix expressions, and design problems.",
      gradient: "from-purple-500/10 to-pink-500/10 border-pink-500/20 dark:border-pink-500/10 hover:border-pink-500/40",
      icon: <Layers className="w-5 h-5 text-pink-500" />,
    },
    {
      name: "Trees & BST",
      description: "Binary tree traversals, height-balanced checks, lowest common ancestors, and BST structures.",
      gradient: "from-rose-500/10 to-red-500/10 border-rose-500/20 dark:border-rose-500/10 hover:border-rose-500/40",
      icon: <Brain className="w-5 h-5 text-rose-500" />,
    },
    {
      name: "Graphs",
      description: "BFS, DFS traversals, cycle detection, shortest paths (Dijkstra), and minimum spanning trees.",
      gradient: "from-amber-500/10 to-yellow-500/10 border-amber-500/20 dark:border-amber-500/10 hover:border-amber-500/40",
      icon: <HelpCircle className="w-5 h-5 text-amber-500" />,
    },
    {
      name: "Dynamic Programming",
      description: "Memoization, tabulation, knapsack variants, subsequence problems, and coin change solutions.",
      gradient: "from-violet-500/10 to-purple-500/10 border-purple-500/20 dark:border-purple-500/10 hover:border-purple-500/40",
      icon: <BookOpen className="w-5 h-5 text-purple-500" />,
    },
    {
      name: "Recursion & Backtracking",
      description: "Permutations, combinations, N-Queens problem, and subset generation strategies.",
      gradient: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20 dark:border-cyan-500/10 hover:border-cyan-500/40",
      icon: <Sliders className="w-5 h-5 text-cyan-500" />,
    },
  ];

  const companies: Company[] = [
    { name: "TCS", description: "Tata Consultancy Services NQT and technical interview questions.", difficulty: "Easy" },
    { name: "Accenture", description: "Accenture cognitive and coding assessment rounds.", difficulty: "Easy" },
    { name: "Infosys", description: "Infosys InfyTQ and system engineer technical rounds.", difficulty: "Easy" },
    { name: "Wipro", description: "Wipro Elite National Talent Hunt interview standard.", difficulty: "Easy" },
    { name: "Amazon", description: "Amazon Online Assessment (OA) and technical phone screen.", difficulty: "Medium" },
    { name: "Google", description: "Google Software Engineer coding round interview questions.", difficulty: "Hard" },
    { name: "Microsoft", description: "Microsoft Codility assessment and design/DSA rounds.", difficulty: "Medium" },
    { name: "Meta", description: "Meta production engineer and generalist coding interviews.", difficulty: "Hard" },
  ];

  const handleStartRound = async () => {
    if (!selectedTopic && !selectedCompany) {
      toast.error("Please select a DSA topic or a target company first.");
      return;
    }

    setLoading(true);
    try {
      // 1. Generate coding question via AI
      const genRes = await fetch("/api/coding/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          topic: selectedTopic || undefined,
          company: selectedCompany || undefined,
        }),
      });
      const genData = await genRes.json();

      if (!genData.success || !genData.question) {
        throw new Error(genData.message || "Failed to generate question");
      }

      // 2. Start a Coding Attempt referencing this question
      const startRes = await fetch("/api/coding/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: genData.question._id }),
      });
      const startData = await startRes.json();

      if (!startData.success || !startData.attempt) {
        throw new Error(startData.error || "Failed to start coding round attempt");
      }

      toast.success("DSA Assessment generated! Directing to workspace...");
      router.push(`/dashboard/coding/${startData.attempt._id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to start coding round. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-black to-zinc-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          Topic-Wise DSA Assessments
        </h1>
        <p className="text-zinc-550 dark:text-zinc-400 mt-1">
          Select a Data Structures and Algorithms category or a company template to launch a tailored AI coding round.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Topics and Companies selector */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* DSA Topics */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              1. Select DSA Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topics.map((topic) => {
                const isSelected = selectedTopic === topic.name;
                return (
                  <button
                    key={topic.name}
                    onClick={() => {
                      setSelectedTopic(isSelected ? null : topic.name);
                      setSelectedCompany(null); // Clear company if topic selected
                    }}
                    className={`text-left p-5 rounded-2xl border transition duration-200 bg-white dark:bg-zinc-900 flex gap-4 ${
                      isSelected
                        ? "border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10"
                        : `border-zinc-200/50 dark:border-zinc-800/50 ${topic.gradient}`
                    }`}
                  >
                    <div className="shrink-0 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl max-h-[48px] flex items-center justify-center">
                      {topic.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{topic.name}</h3>
                      <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                        {topic.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Templates */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-teal-500" />
              2. Target Company Rounds
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {companies.map((company) => {
                const isSelected = selectedCompany === company.name;
                return (
                  <button
                    key={company.name}
                    onClick={() => {
                      setSelectedCompany(isSelected ? null : company.name);
                      setSelectedTopic(null); // Clear topic if company selected
                    }}
                    className={`text-left p-4 rounded-xl border transition duration-200 bg-white dark:bg-zinc-900 flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10"
                        : "border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{company.name}</h3>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-2">
                        {company.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        company.difficulty === "Easy"
                          ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                          : company.difficulty === "Medium"
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                      }`}>
                        {company.difficulty}
                      </span>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Custom Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm sticky top-24 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <Sliders className="w-5 h-5 text-indigo-500" />
                Assessment Setup
              </h2>
            </div>

            {/* Selected Target Info */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target Goal</span>
              {selectedTopic ? (
                <div>
                  <h3 className="font-bold text-sm text-zinc-850 dark:text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    DSA Topic: {selectedTopic}
                  </h3>
                  <p className="text-xs text-zinc-550 mt-1">Topic-focused assessment generated by AI.</p>
                </div>
              ) : selectedCompany ? (
                <div>
                  <h3 className="font-bold text-sm text-zinc-850 dark:text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    Company Round: {selectedCompany}
                  </h3>
                  <p className="text-xs text-zinc-550 mt-1">Mock test matching {selectedCompany} standards.</p>
                </div>
              ) : (
                <div className="text-zinc-400 text-xs py-2 text-center">
                  Select a category or company from the left panels to configure your coding round.
                </div>
              )}
            </div>

            {/* Difficulty Selector */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Select Difficulty</span>
              <div className="flex gap-2 p-1 bg-zinc-150 dark:bg-zinc-950 rounded-xl">
                {(["easy", "medium", "hard"] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition duration-200 ${
                      difficulty === diff
                        ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Assessment rules details */}
            <div className="text-xs text-zinc-550 dark:text-zinc-400 space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Rules & Time Limits:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Easy: 15 minutes limit</li>
                <li>Medium: 30 minutes limit</li>
                <li>Hard: 45 minutes limit</li>
                <li>Write code in JS, Python, C++, C, or Java</li>
                <li>Immediate compilation & detailed AI feedback</li>
              </ul>
            </div>

            {/* Action button */}
            <button
              onClick={handleStartRound}
              disabled={loading || (!selectedTopic && !selectedCompany)}
              className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Workspace...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Start Coding Assessment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
