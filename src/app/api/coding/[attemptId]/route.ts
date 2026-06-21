import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import CodingAttempt from "@/models/coding-attempt.model";
import CodingQuestion from "@/models/coding-question.model";

/**
 * File Purpose:
 * This API endpoint handles GET requests to retrieve a specific coding attempt by ID,
 * populated with full details of the associated question. It validates user ownership of the attempt.
 */

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    await dbConnect();

    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await params;

    const attempt = await CodingAttempt.findById(attemptId).populate("questionId");
    if (!attempt) {
      return NextResponse.json({ success: false, error: "Attempt not found" }, { status: 404 });
    }

    // Ensure users can only access their own attempts
    if (attempt.userId.toString() !== payload.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (error: any) {
    console.error("GET coding attempt details error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
