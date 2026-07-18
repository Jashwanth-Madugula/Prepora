"use client";


/**
 * @file src/app/resumes/[id]/page.tsx
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

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PdfViewer from "@/components/resumes/PdfViewer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Award,
  Briefcase,
  GraduationCap,
  Trash2,
  Check,
  Edit2,
  Target,
  Download,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

import {
  getResume,
  deleteResume,
  updateResume,
} from "@/services/resume.client";

export default function ResumeDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [resume, setResume] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ats" | "details" | "pdf">("ats");
  const [jdInput, setJdInput] = useState("");
  const [comparing, setComparing] = useState(false);

  async function loadResume() {
    try {
      setLoading(true);
      const data = await getResume(params.id as string);
      if (data.success && data.resume) {
        setResume(data.resume);
        setTitle(data.resume.title);
        setJdInput(data.resume.jdText || "");
      } else {
        router.push("/resumes");
      }
    } catch (error) {
      console.error("Failed to load resume", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJDCompare() {
    if (!jdInput.trim()) {
      toast.error("Please enter a job description.");
      return;
    }
    setComparing(true);
    try {
      const res = await fetch("/api/resumes/ats-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume._id, jobDescription: jdInput }),
      });
      const data = await res.json();
      if (data.success && data.resume) {
        setResume(data.resume);
        toast.success("Job description match analysis updated!");
      } else {
        toast.error(data.error || "Failed to compare resume.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to compare resume.");
    } finally {
      setComparing(false);
    }
  }

  useEffect(() => {
    loadResume();
  }, []);

  async function handleRename() {
    if (!title.trim()) return;
    try {
      await updateResume(resume._id, { title });
      setIsEditingTitle(false);
      await loadResume();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDefault() {
    try {
      await updateResume(resume._id, { isDefault: true });
      await loadResume();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete() {
    const confirmDelete = window.confirm("Are you sure you want to delete this resume?");
    if (!confirmDelete) return;
    try {
      await deleteResume(resume._id);
      router.push("/resumes");
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading analysis data...</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <p className="text-sm font-semibold mb-4">Resume not found</p>
        <Link href="/resumes" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold">
          Back to Resumes
        </Link>
      </div>
    );
  }

  const score = resume.atsScore || 0;
  const rating = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Needs Improvement";
  const ratingColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : score >= 40 ? "text-orange-500" : "text-red-500";
  const strokeColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      
      {/* Top Banner Navigation */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/resumes"
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                  <button
                    onClick={handleRename}
                    className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-80 transition duration-200"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">{resume.title}</h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 hover:text-zinc-500 transition duration-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {resume.isDefault && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                  Default
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!resume.isDefault && (
              <button
                onClick={handleDefault}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-200"
              >
                Make Default
              </button>
            )}
            <a
              href={resume.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-200"
              title="Download Resume"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl border border-red-200/50 dark:border-red-900/50 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition duration-200"
              title="Delete Resume"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full flex flex-col gap-6">
        
        {/* Sub-Header / Summary Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Original File</span>
              <p className="text-sm font-semibold truncate max-w-[180px] mt-0.5">{resume.originalFileName}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">File Size</span>
              <p className="text-sm font-semibold mt-0.5">{(resume.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Parse Status</span>
              <p className="text-sm font-semibold mt-0.5 capitalize flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {resume.status}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Uploaded On</span>
              <p className="text-sm font-semibold mt-0.5">{new Date(resume.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab("ats")}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition duration-200 ${
                activeTab === "ats"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
              }`}
            >
              ATS Analyzer
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition duration-200 ${
                activeTab === "details"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
              }`}
            >
              Parsed Resume Details
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition duration-200 ${
                activeTab === "pdf"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
              }`}
            >
              PDF Document
            </button>
          </div>
        </div>

        {/* TAB 1: ATS ANALYZER */}
        {activeTab === "ats" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Score Card Column */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* ATS Gauge Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-6">ATS Match Score</span>
                
                {/* SVG Radial Gauge */}
                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-zinc-100 dark:text-zinc-800"
                    />
                    {/* Foreground Score Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={strokeColor}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * score) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black tracking-tight">{score}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">of 100</span>
                  </div>
                </div>

                <h3 className={`text-lg font-bold ${ratingColor} mt-2`}>{rating}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-[220px]">
                  Your resume has been analyzed against standard ATS criteria.
                </p>
              </div>

              {/* Keyword Density Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 block">Keyword Density</span>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold">AI Assessment</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {resume.atsKeywordDensity || "Keyword matching and optimization analysis is active."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Description Matcher Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Job Match Analysis</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Compare your resume against a specific job description to find missing keywords and see your matching score.
                  </p>
                </div>
                <textarea
                  value={jdInput}
                  onChange={(e) => setJdInput(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={6}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none text-zinc-800 dark:text-zinc-200"
                />
                <button
                  onClick={handleJDCompare}
                  disabled={comparing}
                  className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {comparing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing Match...
                    </>
                  ) : (
                    "Run JD Comparison"
                  )}
                </button>
              </div>
            </div>

            {/* Keyword and Suggestions Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Improvement Suggestions */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Critical Suggestions for Improvement
                </h3>

                {resume.atsSuggestions && resume.atsSuggestions.length > 0 ? (
                  <div className="space-y-3">
                    {resume.atsSuggestions.map((suggestion: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 flex gap-3 items-start"
                      >
                        <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs leading-relaxed font-medium text-zinc-700 dark:text-zinc-300">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-400 text-sm">
                    No suggestions. Your resume looks highly optimized!
                  </div>
                )}
              </div>

              {/* Keyword Analysis */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  ATS Keyword Analysis
                </h3>

                <div className="space-y-6">
                  {/* Matched Keywords */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                      Matched Keywords ({resume.atsKeywordsMatched?.length || 0})
                    </h4>
                    {resume.atsKeywordsMatched && resume.atsKeywordsMatched.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {resume.atsKeywordsMatched.map((keyword: string) => (
                          <span
                            key={keyword}
                            className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-450 text-xs font-semibold"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">No matched keywords extracted.</p>
                    )}
                  </div>

                  {/* Missing Keywords */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-450 mb-3">
                      Missing Recommended Keywords ({resume.atsKeywordsMissing?.length || 0})
                    </h4>
                    {resume.atsKeywordsMissing && resume.atsKeywordsMissing.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {resume.atsKeywordsMissing.map((keyword: string) => (
                          <span
                            key={keyword}
                            className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">No missing keywords recommended.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Match Report Card */}
              {resume.jdText && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-500" />
                      Job Match Analysis Report
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-455">Match Rate:</span>
                      <span className={`text-lg font-black ${
                        (resume.jdMatchPercentage || 0) >= 80 ? "text-emerald-500" :
                        (resume.jdMatchPercentage || 0) >= 60 ? "text-amber-500" :
                        (resume.jdMatchPercentage || 0) >= 40 ? "text-orange-500" : "text-red-500"
                      }`}>
                        {resume.jdMatchPercentage || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Key Strengths for this JD
                      </h4>
                      {resume.jdStrengths && resume.jdStrengths.length > 0 ? (
                        <ul className="space-y-2">
                          {resume.jdStrengths.map((str: string, i: number) => (
                            <li key={i} className="text-xs text-zinc-600 dark:text-zinc-300 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 leading-relaxed font-medium">
                              {str}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-zinc-400">No specific match strengths calculated.</p>
                      )}
                    </div>

                    {/* Suggestions */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> AI Match Recommendations
                      </h4>
                      {resume.jdSuggestions && resume.jdSuggestions.length > 0 ? (
                        <ul className="space-y-2">
                          {resume.jdSuggestions.map((sug: string, i: number) => (
                            <li key={i} className="text-xs text-zinc-600 dark:text-zinc-300 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 leading-relaxed font-medium">
                              {sug}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-zinc-400">No suggestions needed.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-150 dark:border-zinc-800">
                    {/* Missing Skills */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Missing Technical Skills
                      </h4>
                      {resume.jdMissingSkills && resume.jdMissingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {resume.jdMissingSkills.map((sk: string) => (
                            <span key={sk} className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                              {sk}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-550 dark:text-zinc-400">All required skills matched!</p>
                      )}
                    </div>

                    {/* Missing Keywords */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        Missing Keywords
                      </h4>
                      {resume.jdMissingKeywords && resume.jdMissingKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {resume.jdMissingKeywords.map((kw: string) => (
                            <span key={kw} className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-semibold">
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-550 dark:text-zinc-400">No missing keywords found.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: PARSED RESUME DETAILS */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Contact Details & Skills (Left Side) */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Contact Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-4">Contact Information</span>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase block">Name</span>
                    <p className="text-sm font-bold mt-0.5">{resume.parsedData?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase block">Email Address</span>
                    <p className="text-sm font-bold mt-0.5">{resume.parsedData?.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase block">Phone</span>
                    <p className="text-sm font-bold mt-0.5">{resume.parsedData?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Skills Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-4">Skills Extracted</span>
                {resume.parsedData?.skills && resume.parsedData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {resume.parsedData.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-750"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No skills identified.</p>
                )}
              </div>

            </div>

            {/* Experience, Projects & Education (Right Side) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Experience Timeline */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  Work Experience
                </h3>
                {resume.parsedData?.experience && resume.parsedData.experience.length > 0 ? (
                  <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 pl-6 space-y-6">
                    {resume.parsedData.experience.map((exp: string, idx: number) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-white dark:bg-zinc-900 border-2 border-blue-500 flex items-center justify-center" />
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                          {exp}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 py-2">No work experience sections parsed.</p>
                )}
              </div>

              {/* Projects Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Academic & Personal Projects
                </h3>
                {resume.parsedData?.projects && resume.parsedData.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resume.parsedData.projects.map((project: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed"
                      >
                        {project}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No project details parsed.</p>
                )}
              </div>

              {/* Education Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-500" />
                  Education
                </h3>
                {resume.parsedData?.education && resume.parsedData.education.length > 0 ? (
                  <div className="space-y-4">
                    {resume.parsedData.education.map((edu: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        {edu}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No education background parsed.</p>
                )}
              </div>

              {/* Certifications and Achievements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Certifications */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-amber-500" />
                    Certifications
                  </h3>
                  {resume.parsedData?.certifications && resume.parsedData.certifications.length > 0 ? (
                    <ul className="list-disc list-inside text-xs font-medium space-y-2 text-zinc-700 dark:text-zinc-300">
                      {resume.parsedData.certifications.map((cert: string, idx: number) => (
                        <li key={idx}>{cert}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400">None parsed.</p>
                  )}
                </div>

                {/* Achievements */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-rose-500" />
                    Achievements
                  </h3>
                  {resume.parsedData?.achievements && resume.parsedData.achievements.length > 0 ? (
                    <ul className="list-disc list-inside text-xs font-medium space-y-2 text-zinc-700 dark:text-zinc-300">
                      {resume.parsedData.achievements.map((ach: string, idx: number) => (
                        <li key={idx}>{ach}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400">None parsed.</p>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 3: PDF DOCUMENT */}
        {activeTab === "pdf" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm flex justify-center overflow-auto max-h-[800px]">
            <PdfViewer fileUrl={resume.fileUrl} />
          </div>
        )}

      </main>
    </div>
  );
}