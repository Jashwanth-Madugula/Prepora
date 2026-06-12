import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import Interview from "@/models/interview.model";
import InterviewQuestion from "@/models/interview-question.model";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET: Fetches the pre-generated questions for a specific interview session.
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

    // Retrieve questions saved during POST initialization
    const questions = await InterviewQuestion.find({ interviewId: id });

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: any) {
    console.error("GET Interview Questions Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch interview questions" },
      { status: 500 }
    );
  }
}

/**
 * FILE PURPOSE & HELP:
 * This API endpoint (GET /api/interviews/[id]/questions) retrieves the persisted questions
 * associated with a specific interview session. Since we generate and save all questions in the
 * database during interview creation (in POST /api/interviews), this endpoint simply queries Mongoose
 * for questions sharing the same `interviewId`. This prevents re-running Groq prompts on reload and keeps
 * question lists consistent.
 */