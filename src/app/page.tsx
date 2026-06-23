import React from "react";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";

// Component imports
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Assessments from "@/components/landing/Assessments";
import HowItWorks from "@/components/landing/HowItWorks";
import ReadinessScore from "@/components/landing/ReadinessScore";
import AIRecommendations from "@/components/landing/AIRecommendations";
import DashboardPreview from "@/components/landing/DashboardPreview";
import WhyRehearsa from "@/components/landing/WhyRehearsa";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rehearsa AI - AI-Powered Placement Readiness Platform",
  description: "Accelerate your career preparation with generative AI. Take coding assessments, aptitude workspace tests, resume analyses, and mock interviews.",
};

async function checkIsLoggedIn() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return false;
    const decoded = verifyAccessToken<JWTPayload>(token);
    return !!decoded;
  } catch (error) {
    console.error("Error verifying access token on landing page:", error);
    return false;
  }
}

export default async function LandingPage() {
  const isLoggedIn = await checkIsLoggedIn();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased selection:bg-indigo-500/30 selection:text-white scroll-smooth transition-colors duration-200">
      {/* 1. Glassmorphic Navigation Bar */}
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Main Sections Stack */}
      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section */}
        <Hero isLoggedIn={isLoggedIn} />

        {/* 3. Assessment Categories Catalog */}
        <Assessments />

        {/* 4. How It Works - Visual Roadmap */}
        <HowItWorks />

        {/* 5. Placement Readiness Score Simulator */}
        <ReadinessScore />

        {/* 6. AI Recommendations & Feedback Cards */}
        <AIRecommendations />

        {/* 7. Product Dashboard Preview */}
        <DashboardPreview />

        {/* 8. Why Rehearsa - Differentiators */}
        <WhyRehearsa />

        {/* 9. Final Call to Action */}
        <CTA isLoggedIn={isLoggedIn} />
      </main>

      {/* 10. Footer Section */}
      <Footer />
    </div>
  );
}
