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
