/**
 * @file src/app/api/aptitude/[id]/submit/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.
 * 
 *
 * What problem it solves:
 * - Validates request inputs, manages rate-limiting rules, invokes business logic services, interacts with the database, and returns structured JSON responses and status codes to the frontend client.
 *
 * How it works internally:
 * - Exports async HTTP methods (GET, POST, PUT, DELETE, etc.) which parse query parameters or request body JSONs, connect to MongoDB using dbConnect(), verify permissions, and return NextResponse payloads.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import AptitudeTest from "@/models/aptitude-test.model";
import AptitudeQuestion from "@/models/aptitude-question.model";
import AptitudeAttempt from "@/models/aptitude-attempt.model";

/**
 * File Purpose:
 * This endpoint evaluates and submits the answers for an active Aptitude Test attempt.
 * It does the following:
 * 1. Verifies the candidate's session.
 * 2. Fetches the parent test and all associated questions from the database.
 * 3. Verifies ownership of the test.
 * 4. Compares the candidate's responses against the official correct answers.
 * 5. Saves the attempt metrics (score, total, correct count) along with denormalized test category/difficulty.
 * 6. Updates the status of the parent AptitudeTest to 'completed'.
 */

// Helper function to extract and verify the user's identity from request cookies.
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database.
    await dbConnect();

    // Verify authentication.
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { answers } = body; // Array of { questionId, selectedAnswer }

    // Retrieve the parent test.
    const test = await AptitudeTest.findById(id);
    if (!test) {
      return NextResponse.json({ success: false, error: "Test not found" }, { status: 404 });
    }

    // Verify user ownership.
    if (test.userId.toString() !== payload.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Test owner mismatch" }, { status: 403 });
    }

    // Retrieve the full set of questions (with answers) to evaluate the candidate's inputs.
    const questions = await AptitudeQuestion.find({ testId: id });

    let correct = 0;

    // Evaluate each answer submitted by the candidate.
    const evaluatedAnswers = answers.map((answer: any) => {
      const question = questions.find(
        (q) => q._id.toString() === answer.questionId
      );

      // Verify correctness (case-sensitive exact match).
      const isCorrect = question?.correctAnswer === answer.selectedAnswer;

      if (isCorrect) {
        correct++;
      }

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer || "",
        isCorrect,
      };
    });

    // Calculate percentage score.
    const totalCount = questions.length || 1; // Prevent division by zero
    const score = Math.round((correct / totalCount) * 100);

    // Create the Aptitude Attempt record.
    // Denormalize the category and difficulty fields so we can aggregate analytics fast.
    const attempt = await AptitudeAttempt.create({
      userId: payload.userId,
      testId: id,
      answers: evaluatedAnswers,
      score,
      totalQuestions: totalCount,
      correctAnswers: correct,
      category: test.category,
      difficulty: test.difficulty,
    });

    // Update parent test status.
    test.status = "completed";
    test.score = score;
    test.completedAt = new Date();
    await test.save();

    // Return the summary and attempt ID for frontend results navigation.
    return NextResponse.json({
      success: true,
      score,
      attemptId: attempt._id,
    });
  } catch (error) {
    console.error("POST submit test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}