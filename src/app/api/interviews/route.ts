/**
 * @file src/app/api/interviews/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.
 *
 * What problem it solves:
 * - Validates request inputs, manages rate-limiting rules, invokes business logic services, interacts with the database, and returns structured JSON responses and status codes to the frontend client.
 *
 * How it works internally:
 * - Exports async HTTP methods (GET, POST, PUT, DELETE, etc.) which parse query parameters or request body JSONs, connect to MongoDB using dbConnect(), verify permissions, and return NextResponse payloads.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import Interview from "@/models/interview.model";
import { Resume } from "@/models/Resume";
import InterviewQuestion from "@/models/interview-question.model";
import {
  generateResumeQuestions,
  generateTechnicalQuestions,
  generateHRQuestions,
} from "@/services/interview-ai.service";

/**
 * GET: Retrieves all mock interviews for the authenticated user, sorted by start date.
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const interviews = await Interview.find({ userId }).sort({ startedAt: -1 });

    return NextResponse.json({
      success: true,
      interviews,
    });
  } catch (error: any) {
    console.error("GET Interviews Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

/**
 * POST: Initializes a new interview session.
 * Generates custom AI questions grounded in RAG technical knowledge, parsed resumes, and job descriptions,
 * and saves both the interview and generated questions to MongoDB.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, role, difficulty, resumeId, useRAG = true } = body;

    if (!type || !["resume", "technical", "hr"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing interview type" },
        { status: 400 }
      );
    }

    let aiQuestions: any[] = [];

    // Generate questions according to interview type selection with RAG grounding
    if (type === "resume") {
      if (!resumeId) {
        return NextResponse.json(
          { success: false, message: "Resume selection is required for Resume-based interviews" },
          { status: 400 }
        );
      }
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        return NextResponse.json(
          { success: false, message: "Resume not found" },
          { status: 404 }
        );
      }
      aiQuestions = await generateResumeQuestions(resume.parsedData, {
        userId,
        resumeId,
        useRAG,
      });
    } else if (type === "technical") {
      if (!role) {
        return NextResponse.json(
          { success: false, message: "Role is required for technical interviews" },
          { status: 400 }
        );
      }
      aiQuestions = await generateTechnicalQuestions(role, difficulty || "medium", {
        userId,
        resumeId,
        useRAG,
      });
    } else if (type === "hr") {
      aiQuestions = await generateHRQuestions();
    }

    if (!aiQuestions || aiQuestions.length === 0) {
      return NextResponse.json(
        { success: false, message: "AI Question generator returned no questions. Please try again." },
        { status: 500 }
      );
    }

    // Create the Interview session document
    const interview = await Interview.create({
      userId,
      type,
      role: type === "technical" ? role : type === "resume" ? "Resume-Based" : "HR behavioral",
      resumeId: type === "resume" ? resumeId : undefined,
      status: "in_progress",
      startedAt: new Date(),
    });

    // Format and insert the questions linked to this interview session
    const questionsToInsert = aiQuestions.map((q: any) => ({
      interviewId: interview._id,
      question: q.question,
      category: q.category || (type === "hr" ? "HR" : role || "General"),
      difficulty: q.difficulty || difficulty || "medium",
      expectedConcepts: Array.isArray(q.expectedConcepts) ? q.expectedConcepts : [],
      followUps: q.followUps || [],
    }));

    await InterviewQuestion.insertMany(questionsToInsert);

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error: any) {
    console.error("POST Interview Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to initialize interview" },
      { status: 500 }
    );
  }
}
