"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileInput } from "@/lib/validations/profile";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ChevronRight, ChevronLeft, Save } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      experienceLevel: "student",
      skills: [],
      targetCompanies: [],
      placementGoal: "Product",
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof ProfileInput)[] = [];
    if (step === 1) {
      fieldsToValidate = ["headline", "experienceLevel", "phone", "location", "targetRole"];
    } else if (step === 2) {
      fieldsToValidate = ["college", "degree", "branch", "cgpa", "graduationYear"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const prevStep = () => {
    setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = skillInput.trim().replace(/,$/, "");
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCompanyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = companyInput.trim().replace(/,$/, "");
      if (val && !targetCompanies.includes(val)) {
        setTargetCompanies([...targetCompanies, val]);
      }
      setCompanyInput("");
    }
  };

  const removeCompany = (indexToRemove: number) => {
    setTargetCompanies(targetCompanies.filter((_, idx) => idx !== indexToRemove));
  };

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    setError(null);

    const payload = {
      ...data,
      skills,
      targetCompanies,
    };

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to create profile");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while creating your profile.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition duration-200 justify-center items-center p-6 relative">
      
      {/* Theme Toggle Positioned in Top Corner */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-350/20 dark:bg-zinc-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-8 shadow-xl dark:shadow-2xl relative z-10">
        <div className="flex flex-col mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-zinc-950 to-zinc-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Complete your profile
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
            Let's customize Rehearsa AI to match your background and career goals.
          </p>
        </div>

        {/* Stepper Header */}
        <div className="flex justify-between items-center mb-8 border-b border-zinc-200/50 dark:border-zinc-900 pb-4 max-w-md mx-auto sm:mx-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? "bg-black text-white dark:bg-white dark:text-black" : "bg-zinc-200 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-455"
              }`}
            >
              1
            </span>
            <span className={`text-xs font-semibold ${step === 1 ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-zinc-550"}`}>
              Professional
            </span>
          </div>
          <div className="w-8 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 ? "bg-black text-white dark:bg-white dark:text-black" : "bg-zinc-200 dark:bg-zinc-855 text-zinc-500 dark:text-zinc-455"
              }`}
            >
              2
            </span>
            <span className={`text-xs font-semibold ${step === 2 ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-zinc-550"}`}>
              Education
            </span>
          </div>
          <div className="w-8 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 3 ? "bg-black text-white dark:bg-white dark:text-black" : "bg-zinc-200 dark:bg-zinc-855 text-zinc-500 dark:text-zinc-455"
              }`}
            >
              3
            </span>
            <span className={`text-xs font-semibold ${step === 3 ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-zinc-555"}`}>
              Preferences
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* STEP 1: Professional Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="Aspiring Software Engineer / Final Year CSE Student"
                  {...register("headline")}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                />
                {errors.headline && <p className="text-xs text-red-500 mt-1">{errors.headline.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    {...register("experienceLevel")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm appearance-none cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="fresher">Fresher / Graduate</option>
                    <option value="experienced">Experienced Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Target Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineer, Data Scientist"
                    {...register("targetRole")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-855 bg-white/50 dark:bg-zinc-955/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                  {errors.targetRole && <p className="text-xs text-red-500 mt-1">{errors.targetRole.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    {...register("phone")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, India"
                    {...register("location")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Bio / Brief Introduction
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us a bit about your professional goals, interests, or background..."
                  {...register("bio")}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                />
                {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm transition duration-200 flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Educational Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  College / University
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indian Institute of Technology"
                  {...register("college")}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-955/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                />
                {errors.college && <p className="text-xs text-red-500 mt-1">{errors.college.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Degree
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech, MCA, M.S."
                    {...register("degree")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Branch / Major
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    {...register("branch")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    CGPA / GPA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8.5"
                    {...register("cgpa")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                  {errors.cgpa && <p className="text-xs text-red-500 mt-1">{errors.cgpa.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Graduation Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2027"
                    {...register("graduationYear")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                  {errors.graduationYear && <p className="text-xs text-red-500 mt-1">{errors.graduationYear.message}</p>}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold text-sm transition duration-200 cursor-pointer flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm transition duration-200 flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Skills, Target Companies, and Socials */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Placement Goal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Placement Goal
                </label>
                <select
                  {...register("placementGoal")}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm appearance-none cursor-pointer"
                >
                  <option value="Product">Product Companies (FAANG, SaaS, Fintech)</option>
                  <option value="Service">Service Companies (TCS, Infosys, Accenture)</option>
                  <option value="Startup">Startups / Early-Stage Companies</option>
                </select>
              </div>

              {/* Skills Tags Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Skills (type and press Enter or comma)
                </label>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Java, React, Next.js"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-955/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                />
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-zinc-100 dark:bg-zinc-950/30 rounded-xl border border-zinc-200 dark:border-zinc-800/40">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-300 dark:border-zinc-700"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(idx)}
                          className="hover:text-red-500 text-zinc-400 font-bold ml-0.5 focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Companies Tags Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Target Companies (type and press Enter or comma)
                </label>
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyDown={handleCompanyKeyDown}
                  placeholder="Google, Microsoft, Stripe"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-955/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                />
                {targetCompanies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-zinc-100 dark:bg-zinc-950/30 rounded-xl border border-zinc-200 dark:border-zinc-800/40">
                    {targetCompanies.map((company, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-300 dark:border-zinc-700"
                      >
                        {company}
                        <button
                          type="button"
                          onClick={() => removeCompany(idx)}
                          className="hover:text-red-500 text-zinc-400 font-bold ml-0.5 focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Social URLs */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    {...register("linkedinUrl")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-955/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                  {errors.linkedinUrl && <p className="text-xs text-red-500 mt-1">{errors.linkedinUrl.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    GitHub Profile URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://github.com/username"
                    {...register("githubUrl")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-955/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                  {errors.githubUrl && <p className="text-xs text-red-500 mt-1">{errors.githubUrl.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Portfolio Website URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourwebsite.com"
                    {...register("portfolioUrl")}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-855 bg-white/50 dark:bg-zinc-955/50 text-zinc-955 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                  />
                  {errors.portfolioUrl && <p className="text-xs text-red-500 mt-1">{errors.portfolioUrl.message}</p>}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={prevStep}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold text-sm transition duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:opacity-90"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Finish
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
