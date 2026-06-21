import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import AptitudeAttempt from "@/models/aptitude-attempt.model";

/**
 * File Purpose:
 * This API endpoint is the main gateway for retrieving the user's Aptitude dashboard details.
 * It does the following:
 * 1. Checks user authorization using JWT access cookies.
 * 2. Connects to the database and fetches the list of past attempts by the user.
 * 3. Aggregates metrics (Total Tests, Average Score, Category Accuracy).
 * 4. Highlights categories with low accuracy as weaknesses and issues helpful practice recommendations.
 */

// Helper function to extract and verify the user's identity from request cookies.
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function GET(req: NextRequest) {
  try {
    // Connect to the database.
    await dbConnect();

    // Authenticate the user.
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all test attempts made by this user, sorted from newest to oldest.
    const attempts = await AptitudeAttempt.find({ userId: payload.userId })
      .sort({ createdAt: -1 });

    // Initialize variables for analytics.
    let totalTests = attempts.length;
    let averageScore = 0;
    
    // Structure to track questions answered correctly/total per category.
    const categoryStats: Record<string, { correct: number; total: number }> = {
      quantitative: { correct: 0, total: 0 },
      logical: { correct: 0, total: 0 },
      verbal: { correct: 0, total: 0 },
      mixed: { correct: 0, total: 0 },
    };

    let totalScoreSum = 0;

    // Iterate through all attempts to aggregate results.
    attempts.forEach((attempt) => {
      totalScoreSum += attempt.score || 0;
      
      const cat = attempt.category || "mixed";
      if (categoryStats[cat]) {
        categoryStats[cat].correct += attempt.correctAnswers || 0;
        categoryStats[cat].total += attempt.totalQuestions || 0;
      }
    });

    // Calculate final average score.
    averageScore = totalTests > 0 ? Math.round(totalScoreSum / totalTests) : 0;

    // Calculate accuracy percentage for each category.
    const categoryAccuracy = {
      quantitative: 0,
      logical: 0,
      verbal: 0,
      mixed: 0,
    };

    Object.keys(categoryStats).forEach((key) => {
      const stats = categoryStats[key];
      if (stats.total > 0) {
        categoryAccuracy[key as keyof typeof categoryAccuracy] = Math.round((stats.correct / stats.total) * 100);
      }
    });

    // Weakness Detection: Find categories where accuracy is below 70% and they have at least 1 test.
    const weaknesses: string[] = [];
    const recommendations: { category: string; text: string; action: string }[] = [];

    // Check Quantitative
    if (categoryStats.quantitative.total > 0 && categoryAccuracy.quantitative < 70) {
      weaknesses.push("quantitative");
      recommendations.push({
        category: "quantitative",
        text: `Your quantitative aptitude accuracy is currently at ${categoryAccuracy.quantitative}%. We suggest focusing on ratios, percentages, and basic algebra formulas.`,
        action: "Practice Quantitative (Easy)",
      });
    }

    // Check Logical
    if (categoryStats.logical.total > 0 && categoryAccuracy.logical < 70) {
      weaknesses.push("logical");
      recommendations.push({
        category: "logical",
        text: `Your logical reasoning accuracy is low (${categoryAccuracy.logical}%). Try to solve coding-decoding puzzles, sequences, and family-tree relationships to train logical structures.`,
        action: "Practice Logical (Easy)",
      });
    }

    // Check Verbal
    if (categoryStats.verbal.total > 0 && categoryAccuracy.verbal < 70) {
      weaknesses.push("verbal");
      recommendations.push({
        category: "verbal",
        text: `Your verbal ability accuracy is ${categoryAccuracy.verbal}%. Reading daily, practicing grammar rules, and focusing on synonyms/antonyms will improve this.`,
        action: "Practice Verbal (Easy)",
      });
    }

    // General default recommendations if no specific weaknesses are found yet.
    if (totalTests === 0) {
      recommendations.push({
        category: "mixed",
        text: "Welcome to Aptitude Prep! Take a general Mixed Diagnostic Test (10 questions, Easy) to identify your baseline strengths.",
        action: "Start Diagnostic Test",
      });
    } else if (recommendations.length === 0) {
      // User is doing great in all completed tests! Recommend moving up difficulty.
      recommendations.push({
        category: "mixed",
        text: "Excellent work! You are maintaining >70% accuracy across your practice categories. We recommend starting Medium/Hard mixed tests to push your skills further.",
        action: "Start Mixed (Medium)",
      });
    }

    // Return the attempts and compiled analytics.
    return NextResponse.json({
      success: true,
      attempts,
      analytics: {
        totalTests,
        averageScore,
        categoryAccuracy,
        weaknesses,
        recommendations,
      },
    });
  } catch (error) {
    console.error("GET aptitude index error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
