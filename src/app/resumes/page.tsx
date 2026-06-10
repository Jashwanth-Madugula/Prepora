"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResumeUploader from "@/components/resumes/ResumeUploader";
import EmptyResumeState from "@/components/resumes/EmptyResumeState";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  FileText,
  Trash2,
  Star,
  Plus,
  ArrowRight,
  Search,
  SlidersHorizontal
} from "lucide-react";

import {
  getResumes,
  deleteResume,
  updateResume,
} from "@/services/resume.client";

interface Resume {
  _id: string;
  title: string;
  originalFileName: string;
  fileUrl: string;
  isDefault: boolean;
  status: string;
  atsScore?: number;
  createdAt: string;
  fileSize: number;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "score" | "title" | "size" >("recent");

  async function loadResumes() {
    try {
      setLoading(true);
      const data = await getResumes();
      if (data.success) {
        setResumes(data.resumes || []);
      }
    } catch (error) {
      console.error("Failed to load resumes", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResumes();
  }, []);

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Are you sure you want to delete this resume?");
    if (!confirmDelete) return;
    try {
      const result = await deleteResume(id);
      if (result.success) {
        await loadResumes();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDefault(id: string) {
    try {
      const result = await updateResume(id, {
        isDefault: true,
      });
      if (result.success) {
        await loadResumes();
      }
    } catch (error) {
      console.error(error);
    }
  }

  const filteredAndSortedResumes = resumes
    .filter((resume) =>
      resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resume.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "score") {
        return (b.atsScore || 0) - (a.atsScore || 0);
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "size") {
        return b.fileSize - a.fileSize;
      }
      return 0;
    });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      
      {/* Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="font-bold text-lg tracking-tight bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Prepora
            </Link>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Resumes
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
        
        {/* Banner */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Resumes</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Upload and manage your resumes, run ATS keyword optimization scans, and analyze your placement readiness.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Uploader Column */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-black dark:text-white" />
              Upload New Resume
            </h3>
            <ResumeUploader onSuccess={loadResumes} />
          </div>

          {/* List Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Search and Sort Toolbar */}
            {resumes.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-4 rounded-2xl shadow-sm">
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search resumes by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-450" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 focus:outline-none cursor-pointer appearance-none text-zinc-700 dark:text-zinc-300"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="score">Highest ATS Score</option>
                    <option value="title">A-Z Alphabetical</option>
                    <option value="size">File Size</option>
                  </select>
                </div>

              </div>
            )}

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 4].map((n) => (
                  <div
                    key={n}
                    className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4 animate-pulse"
                  >
                    <div className="flex justify-between items-start">
                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-850 rounded" />
                      <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-850 rounded-full" />
                    </div>
                    <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-850 rounded" />
                    <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-850" />
                        <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-850" />
                      </div>
                      <div className="w-20 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-850" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedResumes.length === 0 ? (
              searchQuery ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-12 rounded-2xl text-center text-zinc-400">
                  No resumes found matching "{searchQuery}"
                </div>
              ) : (
                <EmptyResumeState />
              )
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredAndSortedResumes.map((resume) => {
                  const score = resume.atsScore || 0;
                  const scoreColor = score >= 80 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 border-emerald-500/20" : score >= 60 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-750 dark:text-red-400 border-red-500/20";
                  
                  return (
                    <div
                      key={resume._id}
                      className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Title */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-bold text-base tracking-tight truncate max-w-[170px]" title={resume.title}>
                            {resume.title}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {resume.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900">
                                Default
                              </span>
                            )}
                            {resume.atsScore !== undefined && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${scoreColor}`}>
                                Score: {score}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* File details */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[180px]">{resume.originalFileName}</span>
                          <span>•</span>
                          <span>{((resume.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/50 pt-4 mt-auto">
                        <div className="flex gap-2">
                          {!resume.isDefault && (
                            <button
                              onClick={() => handleDefault(resume._id)}
                              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition duration-200"
                              title="Make Default"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(resume._id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-650 dark:text-red-400 transition duration-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Link
                          href={`/resumes/${resume._id}`}
                          className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs transition duration-200 flex items-center gap-1"
                        >
                          View Report
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}
