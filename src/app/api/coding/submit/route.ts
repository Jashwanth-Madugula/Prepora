import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import CodingQuestion from "@/models/coding-question.model";
import CodingAttempt from "@/models/coding-attempt.model";
import { judgeSubmission } from "@/services/judge.service";

/**
 * File Purpose:
 * This API endpoint handles POST requests to submit coding round attempts.
 * It authenticates the user, loads the question, calls the AI judge to evaluate
 * correctness on hidden cases and predict pass rates, and records the score,
 * times, space/time Big-O complexities, sample checks, and review feedbacks in Mongoose.
 */

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const {
      attemptId,
      code,
      language,
      questionId,
      timeTaken,
    } = await request.json();

    if (!attemptId || !questionId || !code || !language) {
      return NextResponse.json(
        { success: false, error: "Missing required submission fields" },
        { status: 400 }
      );
    }

    // Load question details
    const question = await CodingQuestion.findById(questionId);
    if (!question) {
      return NextResponse.json({ success: false, error: "Coding question not found" }, { status: 404 });
    }

    // Run grading judge using Groq AI execution simulation
    const judgeResult = await judgeSubmission({
      language,
      code,
      testCases: question.hiddenTestCases || [],
      questionDescription: question.description,
    });

    const finalScore = judgeResult.predictedPassRate || 0;

    // Load attempt to check createdAt time and calculate status
    const attempt = await CodingAttempt.findById(attemptId);
    if (!attempt) {
      return NextResponse.json({ success: false, error: "Coding attempt not found" }, { status: 404 });
    }

    const difficulty = question.difficulty;
    const allowedSecs = difficulty === "easy" ? 900 : difficulty === "hard" ? 2700 : 1800;
    const startTime = new Date(attempt.createdAt).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    // If client says time is left and server-side elapsed is within limit plus latency buffer, we allow resubmission
    const hasTimeLeft = (timeTaken || 0) < allowedSecs && elapsed < (allowedSecs + 30);
    const status = (finalScore === 100 || !hasTimeLeft) ? "submitted" : "in_progress";

    // Save submission results and AI review subdocuments to the database
    const updatedAttempt = await CodingAttempt.findByIdAndUpdate(
      attemptId,
      {
        code,
        language,
        passedCases: judgeResult.passed,
        totalCases: judgeResult.total,
        score: finalScore,
        timeTaken: timeTaken || 0,
        complexity: judgeResult.timeComplexity || "O(N)",
        samplePassed: !!judgeResult.samplePassed,
        predictedPassRate: finalScore,
        aiReview: {
          correctness: judgeResult.aiReview?.correctness || finalScore,
          codeQuality: judgeResult.aiReview?.codeQuality || 80,
          edgeCasesMissing: judgeResult.aiReview?.edgeCasesMissing || [],
          strengths: judgeResult.aiReview?.strengths || [],
          improvements: judgeResult.aiReview?.improvements || [],
          finalComment: judgeResult.aiReview?.finalComment || "",
        },
        status,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      result: {
        passed: judgeResult.passed,
        total: judgeResult.total,
        results: judgeResult.results,
      },
      score: finalScore,
      aiReview: judgeResult.aiReview,
      attempt: updatedAttempt,
    });
  } catch (error: any) {
    console.error("Submit code API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit code submission" },
      { status: 500 }
    );
  }
}