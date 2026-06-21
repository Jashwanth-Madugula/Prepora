import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import CodingAttempt from "@/models/coding-attempt.model";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";

/**
 * File Purpose:
 * This API endpoint handles POST requests to initialize a new coding round attempt.
 * It authenticates the user from JWT cookies, saves a CodingAttempt document referencing
 * the question in progress, and returns the attempt document.
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

    const { questionId } = await request.json();
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID is required" }, { status: 400 });
    }

    const attempt = await CodingAttempt.create({
      userId: payload.userId,
      questionId,
      status: "in_progress",
      passedCases: 0,
      totalCases: 0,
      score: 0,
    });

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (error: any) {
    console.error("Start coding attempt API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start attempt" },
      { status: 500 }
    );
  }
}