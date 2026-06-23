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
