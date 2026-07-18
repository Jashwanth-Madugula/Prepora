/**
 * @file src/app/api/interviews/[id]/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.
 * 
 *
 * What problem it solves:
 * - Validates request inputs, manages rate-limiting rules, invokes business logic services, interacts with the database, and returns structured JSON responses and status codes to the frontend client.
 *
 * How it works internally:
 * - Exports async HTTP methods (GET, POST, PUT, DELETE, etc.) which parse query parameters or request body JSONs, connect to MongoDB using dbConnect(), verify permissions, and return NextResponse payloads.
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

    const questions = await InterviewQuestion.find({ interviewId: id });

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
      const questions = await InterviewQuestion.find({ interviewId: id });
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

/**
 * FILE PURPOSE & HELP:
 * This API file implements the single-session endpoints for mock interviews (GET /api/interviews/[id] and PATCH /api/interviews/[id]).
 * The GET handler fetches full metadata for a specific interview together with its questions to render the active panel or feedback report.
 * The PATCH handler marks an interview as complete. It gathers all questions, uses the `calculateInterviewResult` service to aggregate scores
 * across the 5 evaluation criteria, persists the final overallScore, and logs the completion timestamp.
 */
