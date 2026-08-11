/**
 * @file src/app/api/interviews/[id]/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.
 * Handles fetching interview details with questions in chronological creation order and calculating final analytics.
 */

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import Interview from "@/models/interview.model";
import InterviewQuestion from "@/models/interview-question.model";
import { calculateInterviewResult } from "@/services/interview-analytics.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET: Retrieves a specific interview session and all its associated questions.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid interview ID" },
        { status: 400 }
      );
    }

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return NextResponse.json(
        { success: false, message: "Interview not found" },
        { status: 404 }
      );
    }

    const questions = await InterviewQuestion.find({ interviewId: id }).sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      interview,
      questions,
    });
  } catch (error: any) {
    console.error("GET Interview Details Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch interview details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Marks the interview as completed. Calculates final analytics and averages.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid interview ID" },
        { status: 400 }
      );
    }

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return NextResponse.json(
        { success: false, message: "Interview not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (status === "completed") {
      const questions = await InterviewQuestion.find({ interviewId: id }).sort({ createdAt: 1 });
      const analytics = await calculateInterviewResult(questions);

      interview.status = "completed";
      interview.score = analytics.overallScore;
      interview.completedAt = new Date();

      await interview.save();

      return NextResponse.json({
        success: true,
        interview,
        analytics,
      });
    }

    return NextResponse.json(
      { success: false, message: "Unsupported update action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("PATCH Interview Details Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update interview details" },
      { status: 500 }
    );
  }
}
