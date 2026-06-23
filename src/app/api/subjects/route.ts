import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import SubjectAttempt from "@/models/subject-attempt.model";

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

    const attempts = await SubjectAttempt.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .select("-questions.correct -questions.explanation"); // Hide details for simple history listing if needed, but we can keep it standard

    return NextResponse.json({
      success: true,
      attempts,
    });
  } catch (error: any) {
    console.error("GET subject attempts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch subject attempts" },
      { status: 500 }
    );
  }
}
