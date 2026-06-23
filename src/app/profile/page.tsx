"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileInput } from "@/lib/validations/profile";
import { changePasswordSchema, ChangePasswordInput } from "@/lib/validations/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"edit" | "password" | "danger" | "sessions">("edit");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Active Sessions State
  interface SessionInfo {
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    lastActive: string;
    isCurrent: boolean;
  }
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Skills & Companies state tags
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      skills: [],
      targetCompanies: [],
      placementGoal: "Product",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Fetch current user details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (res.status === 404) {
            // No profile yet, redirect to complete it
            router.push("/complete-profile");
            return;
          }
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        const profile = data.profile;
        
        // Populate form values
        setProfileValue("fullName", profile.fullName || "");
        setProfileValue("username", profile.username || "");
        setProfileValue("headline", profile.headline || "");
        setProfileValue("bio", profile.bio || "");
        setProfileValue("college", profile.college || "");
        setProfileValue("degree", profile.degree || "");
        setProfileValue("branch", profile.branch || "");
        setProfileValue("cgpa", profile.cgpa ?? "");
        setProfileValue("graduationYear", profile.graduationYear ?? "");
        setProfileValue("targetRole", profile.targetRole || "");
        setProfileValue("linkedinUrl", profile.linkedinUrl || "");
        setProfileValue("githubUrl", profile.githubUrl || "");
        setProfileValue("portfolioUrl", profile.portfolioUrl || "");
        setProfileValue("phone", profile.phone || "");
        setProfileValue("location", profile.location || "");
        setProfileValue("experienceLevel", profile.experienceLevel || "student");
        setProfileValue("placementGoal", profile.placementGoal || "Product");
        setProfileValue("profilePicture", profile.profilePicture || "");

        // Set state tags
        setSkills(profile.skills || []);
        setTargetCompanies(profile.targetCompanies || []);
      } catch (err) {
        console.error(err);
        setProfileError("Could not load profile. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [setProfileValue, router]);

  // Fetch active sessions
  useEffect(() => {
    if (activeTab !== "sessions") return;
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const res = await fetch("/api/auth/sessions");
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions || []);
        }
      } catch (err) {
        console.error("Load sessions error:", err);
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessions();
  }, [activeTab]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.loggedOutSelf) {
          router.push("/login");
          router.refresh();
          return;
        }
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (err) {
      console.error("Revoke session error:", err);
    }
  };

  const handleRevokeOthers = async () => {
    const confirmRevoke = window.confirm("Are you sure you want to log out all other devices?");
    if (!confirmRevoke) return;
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoutOthers: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
      }
    } catch (err) {
      console.error("Revoke other sessions error:", err);
    }
  };

  // Submit Profile Edits
  const onProfileSubmit = async (data: ProfileInput) => {
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          skills,
          targetCompanies,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to update profile");
      }

      setProfileSuccess("Profile updated successfully!");
    } catch (err: any) {
      setProfileError(err.message || "Something went wrong.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Submit Password Change
  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to update password");
      }

      setPasswordSuccess("Password changed successfully! Signing you out...");
      resetPasswordForm();
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || "Something went wrong.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Delete Account
  const onDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePasswordConfirm) {
      setDeleteError("Password confirmation is required to delete your account.");
      return;
    }
    
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePasswordConfirm }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to delete account");
      }

      router.push("/login");
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Something went wrong.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Tag Add/Remove Handlers
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

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 items-center justify-center">
        <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      {/* Navbar */}
      <header className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="font-bold text-lg tracking-tight bg-gradient-to-r from-black to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Rehearsa AI
            </Link>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Account
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
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-200 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Account Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage your profile, academic credentials, and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <aside className="flex flex-col gap-1 md:col-span-1">
            <button
              onClick={() => setActiveTab("edit")}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition duration-200 ${
                activeTab === "edit"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition duration-200 ${
                activeTab === "password"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition duration-200 ${
                activeTab === "sessions"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Active Sessions
            </button>
            <button
              onClick={() => setActiveTab("danger")}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition duration-200 ${
                activeTab === "danger"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Danger Zone
            </button>
          </aside>

          {/* Form Content Area */}
          <section className="md:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 md:p-8 shadow-sm">
            
            {/* EDIT PROFILE TAB */}
            {activeTab === "edit" && (
              <div>
                <h3 className="text-lg font-bold mb-6">Profile Information</h3>
                
                {profileError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                    {profileSuccess}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                  
                  {/* Account Basics */}
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-6 space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Basic Info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          {...registerProfile("fullName")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                        {profileErrors.fullName && (
                          <p className="text-xs text-red-500 mt-1">{profileErrors.fullName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Username
                        </label>
                        <input
                          type="text"
                          {...registerProfile("username")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                        {profileErrors.username && (
                          <p className="text-xs text-red-500 mt-1">{profileErrors.username.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Professional profile */}
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-6 space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Professional details</h4>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Headline
                      </label>
                      <input
                        type="text"
                        {...registerProfile("headline")}
                        placeholder="e.g. Aspiring Software Engineer"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                      {profileErrors.headline && (
                        <p className="text-xs text-red-500 mt-1">{profileErrors.headline.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Experience Level
                        </label>
                        <select
                          {...registerProfile("experienceLevel")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm cursor-pointer"
                        >
                          <option value="student">Student</option>
                          <option value="fresher">Fresher</option>
                          <option value="experienced">Experienced</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Placement Goal
                        </label>
                        <select
                          {...registerProfile("placementGoal")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm cursor-pointer"
                        >
                          <option value="Product">Product Companies</option>
                          <option value="Service">Service Companies</option>
                          <option value="Startup">Startup</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Target Role
                        </label>
                        <input
                          type="text"
                          {...registerProfile("targetRole")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          {...registerProfile("phone")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Location
                        </label>
                        <input
                          type="text"
                          {...registerProfile("location")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Profile Image URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://example.com/avatar.jpg"
                        {...registerProfile("profilePicture")}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        {...registerProfile("bio")}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                      {profileErrors.bio && (
                        <p className="text-xs text-red-500 mt-1">{profileErrors.bio.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Academic Profile */}
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-6 space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Academic Background</h4>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        College / University
                      </label>
                      <input
                        type="text"
                        {...registerProfile("college")}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Degree
                        </label>
                        <input
                          type="text"
                          {...registerProfile("degree")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Branch / Major
                        </label>
                        <input
                          type="text"
                          {...registerProfile("branch")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          CGPA
                        </label>
                        <input
                          type="text"
                          {...registerProfile("cgpa")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                        {profileErrors.cgpa && (
                          <p className="text-xs text-red-500 mt-1">{profileErrors.cgpa.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Graduation Year
                        </label>
                        <input
                          type="number"
                          {...registerProfile("graduationYear")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                        {profileErrors.graduationYear && (
                          <p className="text-xs text-red-500 mt-1">{profileErrors.graduationYear.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills & Preferences */}
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-6 space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Skills & Preferences</h4>
                    
                    {/* Skills */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Skills (type and press Enter or comma)
                      </label>
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        placeholder="e.g. React, Python"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                          {skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-750"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(idx)}
                                className="hover:text-red-400 font-bold ml-0.5 focus:outline-none text-zinc-400"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Companies */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Target Companies (type and press Enter or comma)
                      </label>
                      <input
                        type="text"
                        value={companyInput}
                        onChange={(e) => setCompanyInput(e.target.value)}
                        onKeyDown={handleCompanyKeyDown}
                        placeholder="e.g. Stripe, Google"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                      {targetCompanies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                          {targetCompanies.map((company, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-750"
                            >
                              {company}
                              <button
                                type="button"
                                onClick={() => removeCompany(idx)}
                                className="hover:text-red-400 font-bold ml-0.5 focus:outline-none text-zinc-400"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Profiles */}
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-6 space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Social Connections</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          LinkedIn URL
                        </label>
                        <input
                          type="text"
                          {...registerProfile("linkedinUrl")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                        {profileErrors.linkedinUrl && (
                          <p className="text-xs text-red-500 mt-1">{profileErrors.linkedinUrl.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          GitHub URL
                        </label>
                        <input
                          type="text"
                          {...registerProfile("githubUrl")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                        {profileErrors.githubUrl && (
                          <p className="text-xs text-red-500 mt-1">{profileErrors.githubUrl.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Portfolio URL
                        </label>
                        <input
                          type="text"
                          {...registerProfile("portfolioUrl")}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                        />
                        {profileErrors.portfolioUrl && (
                          <p className="text-xs text-red-500 mt-1">{profileErrors.portfolioUrl.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm transition duration-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile ? "Saving Profile..." : "Save Changes"}
                  </button>
                </form>
              </div>
            )}

            {/* CHANGE PASSWORD TAB */}
            {activeTab === "password" && (
              <div>
                <h3 className="text-lg font-bold mb-4">Change Password</h3>
                
                {passwordError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...registerPassword("currentPassword")}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...registerPassword("newPassword")}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...registerPassword("confirmPassword")}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm transition duration-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isChangingPassword ? "Updating Password..." : "Change Password"}
                  </button>
                </form>
              </div>
            )}

            {/* DANGER ZONE TAB */}
            {activeTab === "danger" && (
              <div>
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Delete Account</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                  Deleting your account is permanent and cannot be undone. All user data, mock tests, and interview records associated with your account will be soft-deleted.
                </p>

                {deleteError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    {deleteError}
                  </div>
                )}

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition duration-200 cursor-pointer"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <form onSubmit={onDeleteAccount} className="space-y-4 border border-red-200/50 dark:border-red-900/50 rounded-2xl p-4 bg-red-500/5">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      Are you absolutely sure you want to delete your account?
                    </p>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Please enter your password to confirm account deletion
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={deletePasswordConfirm}
                        onChange={(e) => setDeletePasswordConfirm(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 text-sm"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={isDeletingAccount}
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition duration-200 disabled:opacity-50 cursor-pointer"
                      >
                        {isDeletingAccount ? "Deleting Account..." : "Yes, Delete Permanently"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePasswordConfirm("");
                          setDeleteError(null);
                        }}
                        className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-semibold text-sm transition duration-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ACTIVE SESSIONS TAB */}
            {activeTab === "sessions" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-150 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold">Active Sessions</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Manage your active browser and device sessions across the platform.
                    </p>
                  </div>
                  {sessions.filter(s => !s.isCurrent).length > 0 && (
                    <button
                      onClick={handleRevokeOthers}
                      className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-bold transition duration-200 cursor-pointer"
                    >
                      Logout Other Devices
                    </button>
                  )}
                </div>

                {loadingSessions ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-400">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs">Fetching active device sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-10 text-center">No active sessions found.</p>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition ${
                          session.isCurrent
                            ? "bg-zinc-50 dark:bg-zinc-955/20 border-zinc-200/80 dark:border-zinc-800"
                            : "bg-white dark:bg-zinc-900/50 border-zinc-150 dark:border-zinc-850"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-zinc-850 dark:text-zinc-200">
                              {session.userAgent.includes("Windows")
                                ? "Windows PC"
                                : session.userAgent.includes("Mac")
                                ? "Macintosh"
                                : session.userAgent.includes("Linux")
                                ? "Linux Machine"
                                : session.userAgent.includes("Android")
                                ? "Android Device"
                                : session.userAgent.includes("iPhone")
                                ? "iPhone"
                                : "Mobile Device"}
                            </span>
                            {session.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-500/20">
                                Current Session
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 font-mono">IP: {session.ipAddress}</p>
                          <p className="text-[11px] text-zinc-400">
                            Last Active: {new Date(session.lastActive).toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              session.isCurrent
                                ? "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                : "border-red-200 text-red-650 hover:bg-red-500/15"
                            }`}
                          >
                            {session.isCurrent ? "Sign Out" : "Revoke Session"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}
