/**
 * @file src/app/api/coding/round/[roundId]/submit-round/route.ts
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
      return NextResponse.json({
        success: true,
        message: "Coding round was already submitted",
        attempt,
      });
    }

    // Calculate overall average score of the 3 questions
    let totalScoreSum = 0;
    attempt.questions.forEach((q: any) => {
      totalScoreSum += q.score || 0;
    });

    const overallScore = Math.round(totalScoreSum / attempt.questions.length);

    attempt.score = overallScore;
    attempt.status = "submitted";
    attempt.submittedAt = new Date();

    await attempt.save();

    return NextResponse.json({
      success: true,
      message: "Coding round submitted successfully",
      attempt,
    });
  } catch (error: any) {
    console.error("Submit coding round error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit coding round" },
      { status: 500 }
    );
  }
}
