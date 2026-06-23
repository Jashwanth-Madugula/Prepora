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

export async function GET(
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

    // Sanitize questions if quiz is in-progress to prevent cheating via inspecting response data
    if (attempt.status === "in-progress") {
      const sanitizedQuestions = attempt.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        selected: q.selected,
      }));

      // Convert mongoose document to raw object to allow editing properties
      const attemptObj = attempt.toObject() as any;
      attemptObj.questions = sanitizedQuestions;

      return NextResponse.json({
        success: true,
        attempt: attemptObj,
      });
    }

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (error: any) {
    console.error("GET subject attempt details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attempt details" },
      { status: 500 }
    );
  }
}
