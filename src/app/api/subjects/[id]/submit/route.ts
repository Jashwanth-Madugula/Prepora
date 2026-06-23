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

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const attempt = await SubjectAttempt.findOne({ _id: id, userId: payload.userId });
    if (!attempt) {
      return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
    }

    if (attempt.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Assessment already submitted and completed",
        attempt,
      });
    }

    const body = await req.json().catch(() => ({}));
    const { answers } = body; // Expected to be an array of strings: string[]

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: "Answers array is required" },
        { status: 400 }
      );
    }

    let correctAnswersCount = 0;
    for (let i = 0; i < attempt.questions.length; i++) {
      const selected = answers[i] || "";
      attempt.questions[i].selected = selected;
      const isCorrect = selected.trim() === attempt.questions[i].correct.trim();
      attempt.questions[i].isCorrect = isCorrect;
      if (isCorrect) {
        correctAnswersCount++;
      }
    }

    attempt.correctAnswers = correctAnswersCount;
    attempt.score = Math.round((correctAnswersCount / attempt.questions.length) * 100);
    attempt.status = "completed";
    attempt.submittedAt = new Date();

    await attempt.save();

    return NextResponse.json({
      success: true,
      message: "Subject assessment completed successfully",
      attempt,
    });
  } catch (error: any) {
    console.error("POST submit subject assessment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
