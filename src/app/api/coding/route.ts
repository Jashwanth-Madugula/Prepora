import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import CodingAttempt from "@/models/coding-attempt.model";
import CodingQuestion from "@/models/coding-question.model";

/**
 * File Purpose:
 * This API endpoint handles GET requests to retrieve the history of coding attempts
 * for the authenticated user, populated with their associated question titles and details.
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

    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Find attempts for this user and populate the questionId details
    const attempts = await CodingAttempt.find({ userId: payload.userId })
      .populate("questionId", "title difficulty topic timeLimit")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      attempts,
    });
  } catch (error: any) {
    console.error("GET coding attempts history error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
