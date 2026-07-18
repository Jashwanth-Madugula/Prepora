/**
 * @file src/app/api/coding/round/[roundId]/submit-question/route.ts
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

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import CodingRoundAttempt from "@/models/coding-round-attempt.model";
import CodingQuestion from "@/models/coding-question.model";
import { judgeSubmission } from "@/services/judge.service";

interface RouteParams {
  params: Promise<{
    roundId: string;
  }>;
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { roundId } = await params;
    const body = await req.json().catch(() => ({}));
    const { questionId, code, language } = body;

    if (!questionId || !code || !language) {
      return NextResponse.json(
        { success: false, error: "Missing questionId, code, or language" },
        { status: 400 }
      );
    }

    // 1. Verify round exists
    const attempt = await CodingRoundAttempt.findOne({
      _id: roundId,
      userId: payload.userId,
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Coding round attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.status === "submitted") {
      return NextResponse.json(
        { success: false, error: "Coding round is already submitted and finalized." },
        { status: 400 }
      );
    }

    // 2. Load target question
    const question = await CodingQuestion.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { success: false, error: "Coding question not found" },
        { status: 404 }
      );
    }

    // 3. Find target question index in attempts list
    const questionIndex = attempt.questions.findIndex(
      (q: any) => q.questionId.toString() === questionId
    );

    if (questionIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Question not found in this coding round session" },
        { status: 404 }
      );
    }

    // 4. Dispatch to Groq judge evaluator
    const judgeResult = await judgeSubmission({
      language,
      code,
      testCases: question.hiddenTestCases || [],
      questionDescription: question.description,
    });

    const finalScore = judgeResult.predictedPassRate || 0;

    // 5. Update specific question block
    attempt.questions[questionIndex].code = code;
    attempt.questions[questionIndex].language = language;
    attempt.questions[questionIndex].passedCases = judgeResult.passed;
    attempt.questions[questionIndex].totalCases = judgeResult.total;
    attempt.questions[questionIndex].score = finalScore;
    attempt.questions[questionIndex].samplePassed = !!judgeResult.samplePassed;
    attempt.questions[questionIndex].aiReview = {
      correctness: judgeResult.aiReview?.correctness || finalScore,
      codeQuality: judgeResult.aiReview?.codeQuality || 80,
      edgeCasesMissing: judgeResult.aiReview?.edgeCasesMissing || [],
      strengths: judgeResult.aiReview?.strengths || [],
      improvements: judgeResult.aiReview?.improvements || [],
      finalComment: judgeResult.aiReview?.finalComment || "",
    };

    await attempt.save();

    return NextResponse.json({
      success: true,
      message: "Question evaluated successfully",
      score: finalScore,
      passed: judgeResult.passed,
      total: judgeResult.total,
      results: judgeResult.results,
      aiReview: attempt.questions[questionIndex].aiReview,
    });
  } catch (error: any) {
    console.error("Evaluate question inside coding round error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Evaluation failed" },
      { status: 500 }
    );
  }
}
