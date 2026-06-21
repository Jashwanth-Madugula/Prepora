import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import AptitudeAttempt from "@/models/aptitude-attempt.model";
import AptitudeQuestion from "@/models/aptitude-question.model";

/**
 * File Purpose:
 * This endpoint compiles and returns the results of a past Aptitude Test attempt.
 * To enable thorough candidate review, it retrieves:
 * 1. The attempt stats (score, correct answers).
 * 2. The full set of questions (including options, the correct answer, and detailed AI explanations).
 * It also secures the endpoint to ensure candidates can only view their own test results.
 */

// Helper function to extract and verify the user's identity from request cookies.
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database.
    await dbConnect();

    // Verify authentication.
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Retrieve the attempt.
    const attempt = await AptitudeAttempt.findById(id);
    if (!attempt) {
      return NextResponse.json({ success: false, error: "Attempt not found" }, { status: 404 });
    }

    // Verify that the logged-in user matches the owner of this attempt.
    if (attempt.userId.toString() !== payload.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Attempt owner mismatch" }, { status: 403 });
    }

    // Retrieve all questions (with explanations and correct answers) associated with this test.
    const questions = await AptitudeQuestion.find({ testId: attempt.testId });

    // Return the attempt records and the full questions data for candidate review.
    return NextResponse.json({
      success: true,
      attempt,
      questions,
    });
  } catch (error) {
    console.error("GET test result error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}