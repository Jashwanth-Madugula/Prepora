import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import CodingRoundAttempt from "@/models/coding-round-attempt.model";
import CodingQuestion from "@/models/coding-question.model"; // Ensure model is compiled

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

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const _ref = CodingQuestion;

    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { roundId } = await params;
    const attempt = await CodingRoundAttempt.findOne({
      _id: roundId,
      userId: payload.userId,
    }).populate("questions.questionId");

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Coding round attempt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (error: any) {
    console.error("GET coding round details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch coding round details" },
      { status: 500 }
    );
  }
}
