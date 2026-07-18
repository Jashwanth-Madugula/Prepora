/**
 * @file src/app/api/coding/route.ts
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
import CodingAttempt from "@/models/coding-attempt.model";
import CodingQuestion from "@/models/coding-question.model";
import CodingRoundAttempt from "@/models/coding-round-attempt.model";

/**
 * File Purpose:
 * This API endpoint handles GET requests to retrieve the history of coding attempts
 * and full 3-question coding rounds for the authenticated user.
 */

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const _models = [CodingQuestion, CodingRoundAttempt];

    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Find single-question attempts
    const attempts = await CodingAttempt.find({ userId: payload.userId })
      .populate("questionId", "title difficulty topic timeLimit")
      .sort({ createdAt: -1 });

    // Find 3-question round attempts
    const roundAttempts = await CodingRoundAttempt.find({ userId: payload.userId })
      .populate("questions.questionId", "title difficulty topic")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      attempts,
      roundAttempts,
    });
  } catch (error: any) {
    console.error("GET coding attempts history error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
