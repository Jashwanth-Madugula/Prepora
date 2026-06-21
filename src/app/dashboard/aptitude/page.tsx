"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { 
  Brain, 
  Award, 
  TrendingUp, 
  History, 
  BookOpen, 
  AlertCircle, 
  ArrowRight, 
  Play, 
  ChevronRight, 
  Sparkles,
  ArrowLeft,
  Loader2
} from "lucide-react";

/**
 * File Purpose:
 * This component renders the main dashboard for the Aptitude module.
 * It serves as the primary workspace for:
 * 1. Visualizing performance metrics (Average score, Total tests, Category accuracy).
 * 2. Configuring and launching new aptitude tests (Category, Difficulty, Questions count).
 * 3. Inspecting detected weaknesses and executing AI recommended practice sessions.
 * 4. Checking the history of recent attempts with scores and direct review shortcuts.
 */

// Define typescript interface for attempt history records.
interface Attempt {
  _id: string;
  testId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  category: string;
  difficulty: string;
  submittedAt: string;
}

// Define typescript interface for aggregated performance analytics.
interface Analytics {
  totalTests: number;
  averageScore: number;
  categoryAccuracy: {
    quantitative: number;
    logical: number;
    verbal: number;
    mixed: number;
  };
  weaknesses: string[];
  recommendations: {
    category: string;
    text: string;
    action: string;
  }[];
}

export default function AptitudeDashboard() {
  const router = useRouter();

  // State management for loading indicators and data arrays.
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Form states for creating a new custom practice test.
  const [category, setCategory] = useState("mixed");
  const [difficulty, setDifficulty] = useState("easy");
  const [questions, setQuestions] = useState(10);

  // New configuration options for Adaptive and Company-Specific tests
  const [testMode, setTestMode] = useState<"standard" | "adaptive" | "company">("standard");
  const [selectedCompany, setSelectedCompany] = useState("Google");

  // Load the history and analytics on component mount.
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // API call to fetch attempts and computed analytics.
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/aptitude");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttempts(data.attempts);
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error("Failed to load aptitude dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Triggers creation of a new test via API and redirects user to the test page.
  const startTest = async (customCategory?: string, customDifficulty?: string, customCompany?: string) => {
    try {
      setCreating(true);
      
      // Allow overriding default form states for recommendations quick-starts.
      const targetCategory = customCategory || category;
      
      let targetDifficulty = customDifficulty || difficulty;
      if (testMode === "adaptive" && !customDifficulty) {
        targetDifficulty = "adaptive";
      }

      const targetCompany = customCompany || (testMode === "company" ? selectedCompany : undefined);

      const response = await fetch("/api/aptitude/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: targetCategory,
          difficulty: targetDifficulty,
          totalQuestions: questions,
          company: targetCompany,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize test session");
      }

      const data = await response.json();
      if (data.success && data.testId) {
        router.push(`/dashboard/aptitude/test/${data.testId}`);
      }
    } catch (error) {
      console.error("Error launching practice session:", error);
      setCreating(false);
    }
  };

  // Loading state placeholder with nice animated spinners.
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <Loader2 className="w-10 h-10 stroke-zinc-900 dark:stroke-zinc-100 animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Compiling aptitude dashboard stats...</p>
      </div>
    );
  }

  // Calculate some helper statistics.
  const overallAccuracy = analytics ? analytics.averageScore : 0;
  const totalTests = analytics ? analytics.totalTests : 0;

  // Find the category with the highest accuracy.
  let bestCategoryName = "None";
  let bestAccuracy = -1;
  if (analytics) {
    Object.entries(analytics.categoryAccuracy).forEach(([name, acc]) => {
      if (acc > bestAccuracy && name !== "mixed") {
        bestAccuracy = acc;
        bestCategoryName = name;
      }
    });
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans">
      {/* Premium Header */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Aptitude Prep
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/profile"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full flex flex-col gap-8">
        
        {/* Title and Subtitle Block */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Aptitude Workspace</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Strengthen your quantitative, logical, and verbal aptitude with smart AI evaluations.
          </p>
        </div>

        {/* Analytics & Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Card 1: Overall Average Accuracy */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Overall Accuracy</span>
              <h2 className="text-4xl font-extrabold mt-2 text-indigo-600 dark:text-indigo-400">{overallAccuracy}%</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">Average across all test attempts.</p>
          </div>

          {/* Card 2: Total Tests Completed */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Completed Sessions</span>
              <h2 className="text-4xl font-extrabold mt-2">{totalTests}</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">Practice tests successfully submitted.</p>
          </div>

          {/* Card 3: Best Performing Category */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Strength Area</span>
              <h2 className="text-3xl font-bold mt-2 truncate capitalize text-emerald-600 dark:text-emerald-400">
                {bestCategoryName !== "None" ? bestCategoryName : "N/A"}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
              {bestAccuracy >= 0 ? `Highest accuracy of ${bestAccuracy}%` : "Complete tests to identify."}
            </p>
          </div>

          {/* Card 4: Weakness Detection Summary */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Weakness Alerts</span>
              <h2 className={`text-4xl font-extrabold mt-2 ${analytics?.weaknesses.length && analytics.weaknesses.length > 0 ? "text-amber-500" : "text-zinc-600 dark:text-zinc-400"}`}>
                {analytics ? analytics.weaknesses.length : 0}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">Categories needing practice (&lt;70%).</p>
          </div>
        </div>

        {/* Primary Interactive Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Test Configuration Panel (8 Columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm animate-fade-in">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Configure Practice Session
              </h3>

              {/* Mode Selector Tabs */}
              <div className="flex border-b border-zinc-150 dark:border-zinc-800 mb-6 gap-4">
                {[
                  { id: "standard", label: "Standard Mode" },
                  { id: "adaptive", label: "Adaptive CAT" },
                  { id: "company", label: "Company Challenge" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTestMode(mode.id as any)}
                    className={`pb-3 text-sm font-semibold border-b-2 transition duration-200 px-1 cursor-pointer ${
                      testMode === mode.id
                        ? "border-indigo-650 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Adaptive Callout Info */}
              {testMode === "adaptive" && (
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-6 text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-indigo-500 inline mr-1.5 align-text-bottom animate-pulse" />
                  <strong>Computer Adaptive Testing (CAT) Active:</strong> The test dynamically adjusts its difficulty based on your correctness. Correct answers lead to harder questions, while incorrect answers adjust the level downward to find your exact skill level. Backtracking is disabled.
                </div>
              )}

              {/* Company Selection Panel */}
              {testMode === "company" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">Choose Target Company</label>
                  <div className="grid grid-cols-5 gap-2">
                    {["Google", "Amazon", "TCS", "Accenture", "Infosys"].map((comp) => (
                      <button
                        key={comp}
                        onClick={() => setSelectedCompany(comp)}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-bold text-center transition cursor-pointer ${
                          selectedCompany === comp
                            ? "border-indigo-600 bg-indigo-55/50 dark:border-indigo-500 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-300"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category selector utilizing beautiful card layouts */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">Choose Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "mixed", label: "Mixed Diagnostic", desc: "Covers all topics" },
                    { id: "quantitative", label: "Quantitative", desc: "Math, ratios, profit & loss" },
                    { id: "logical", label: "Logical Reasoning", desc: "Puzzles, series, relations" },
                    { id: "verbal", label: "Verbal Ability", desc: "Grammar, analogies, vocab" },
                  ].map((catItem) => (
                    <button
                      key={catItem.id}
                      onClick={() => setCategory(catItem.id)}
                      className={`p-4 rounded-xl border text-left transition duration-200 flex flex-col gap-1 cursor-pointer ${
                        category === catItem.id
                          ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-medium"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                      }`}
                    >
                      <span className="text-sm font-semibold">{catItem.label}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{catItem.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty selector with beautiful active pills (only shown for standard mode) */}
              {testMode === "standard" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">Select Difficulty</label>
                  <div className="flex gap-3">
                    {[
                      { id: "easy", label: "Easy", color: "bg-emerald-500 text-white" },
                      { id: "medium", label: "Medium", color: "bg-amber-500 text-white" },
                      { id: "hard", label: "Hard", color: "bg-red-500 text-white" },
                    ].map((diff) => (
                      <button
                        key={diff.id}
                        onClick={() => setDifficulty(diff.id)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition duration-200 cursor-pointer ${
                          difficulty === diff.id
                            ? `${diff.color} border-transparent shadow-sm shadow-black/10`
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                        }`}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Slider selecting question count */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold">Number of Questions</label>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{questions} Questions</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="5"
                  value={questions}
                  onChange={(e) => setQuestions(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>5 Questions</span>
                  <span>10 Questions</span>
                  <span>15 Questions</span>
                  <span>20 Questions</span>
                </div>
              </div>

              {/* Glow animation launcher button */}
              <button
                onClick={() => startTest()}
                disabled={creating}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating AI Questions...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    {testMode === "standard" && "Launch Practice Session"}
                    {testMode === "adaptive" && "Start Adaptive Exam"}
                    {testMode === "company" && `Start ${selectedCompany} Prep Challenge`}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: AI Recommendations & Category Breakdown (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* AI Recommendations Panel */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-none">
              <h3 className="text-base font-bold flex items-center gap-2 text-indigo-905 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-500" /> AI Recommendations
              </h3>
              
              <div className="mt-4 flex flex-col gap-4">
                {analytics?.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col justify-between gap-3">
                    <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium">
                      {rec.text}
                    </p>
                    <button
                      onClick={() => startTest(rec.category, "easy")}
                      disabled={creating}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 self-start transition cursor-pointer"
                    >
                      {rec.action} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" /> Category Breakdown
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Quantitative", val: analytics?.categoryAccuracy.quantitative || 0 },
                  { name: "Logical Reasoning", val: analytics?.categoryAccuracy.logical || 0 },
                  { name: "Verbal Ability", val: analytics?.categoryAccuracy.verbal || 0 },
                  { name: "Mixed (Diagnostic)", val: analytics?.categoryAccuracy.mixed || 0 },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="capitalize">{item.name}</span>
                      <span className={`${item.val >= 70 ? "text-emerald-500" : item.val > 0 ? "text-amber-500" : "text-zinc-400"}`}>
                        {item.val > 0 ? `${item.val}%` : "No attempts"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.val >= 70
                            ? "bg-emerald-500"
                            : item.val > 0
                            ? "bg-amber-500"
                            : "bg-zinc-200 dark:bg-zinc-750"
                        }`}
                        style={{ width: `${item.val || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* SECTION: Recent Attempts History */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm mt-4">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-indigo-500" /> Attempt History
          </h3>

          {attempts.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-400">No practice tests completed yet. Set up your first session above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-xs uppercase font-bold">
                    <th className="py-3 font-semibold">Date Completed</th>
                    <th className="py-3 font-semibold">Test Category</th>
                    <th className="py-3 font-semibold">Difficulty</th>
                    <th className="py-3 font-semibold">Score</th>
                    <th className="py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {attempts.map((attempt) => {
                    const statusColor = attempt.score >= 70 ? "text-emerald-500" : "text-amber-500";
                    return (
                      <tr key={attempt._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition">
                        <td className="py-4 font-medium text-zinc-500 dark:text-zinc-400">
                          {new Date(attempt.submittedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 font-bold capitalize">{attempt.category}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            attempt.difficulty === "easy" 
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                              : attempt.difficulty === "medium"
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                              : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                          }`}>
                            {attempt.difficulty}
                          </span>
                        </td>
                        <td className="py-4 font-extrabold text-base">
                          <span className={statusColor}>{attempt.score}%</span>
                          <span className="text-[10px] text-zinc-400 font-semibold ml-2">
                            ({attempt.correctAnswers}/{attempt.totalQuestions})
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/dashboard/aptitude/result/${attempt._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition duration-150"
                          >
                            Review Results <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}