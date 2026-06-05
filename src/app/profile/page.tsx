"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  profileSchema, 
  ProfileInput, 
  changePasswordSchema, 
  ChangePasswordInput 
} from "@/lib/validations/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"edit" | "password" | "danger">("edit");
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

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
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
        const res = await fetch("/api/user/profile");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        const user = data.user;
        
        // Populate form values
        setProfileValue("fullName", user.fullName || "");
        setProfileValue("username", user.username || "");
        setProfileValue("bio", user.bio || "");
        setProfileValue("college", user.college || "");
        setProfileValue("branch", user.branch || "");
        setProfileValue("graduationYear", user.graduationYear ?? "");
        setProfileValue("avatar", user.avatar || "");
      } catch (err) {
        console.error(err);
        setProfileError("Could not load profile. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [setProfileValue, router]);

  // Submit Profile Edits
  const onProfileSubmit = async (data: ProfileInput) => {
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
              Prepora
            </Link>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Account
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-semibold hover:text-zinc-500 transition duration-200"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Account Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage your public profile, account settings, and preferences.
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
                <h3 className="text-lg font-bold mb-4">Profile Information</h3>
                
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

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        {...registerProfile("fullName")}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
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
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                      {profileErrors.username && (
                        <p className="text-xs text-red-500 mt-1">{profileErrors.username.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Avatar Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/avatar.jpg"
                      {...registerProfile("avatar")}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                    />
                    {profileErrors.avatar && (
                      <p className="text-xs text-red-500 mt-1">{profileErrors.avatar.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write a short bio about yourself..."
                      {...registerProfile("bio")}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                    />
                    {profileErrors.bio && (
                      <p className="text-xs text-red-500 mt-1">{profileErrors.bio.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        College / University
                      </label>
                      <input
                        type="text"
                        {...registerProfile("college")}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                      {profileErrors.college && (
                        <p className="text-xs text-red-500 mt-1">{profileErrors.college.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Branch / Major
                      </label>
                      <input
                        type="text"
                        placeholder="Computer Science"
                        {...registerProfile("branch")}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                      {profileErrors.branch && (
                        <p className="text-xs text-red-500 mt-1">{profileErrors.branch.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        placeholder="2026"
                        {...registerProfile("graduationYear")}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition duration-200 text-sm"
                      />
                      {profileErrors.graduationYear && (
                        <p className="text-xs text-red-500 mt-1">{profileErrors.graduationYear.message}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm transition duration-200 flex items-center gap-2 disabled:opacity-50"
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
                    className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm transition duration-200 flex items-center gap-2 disabled:opacity-50"
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
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition duration-200"
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
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition duration-200 disabled:opacity-50"
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
                        className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-semibold text-sm transition duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}
