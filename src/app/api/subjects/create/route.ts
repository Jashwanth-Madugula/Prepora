/**
 * @file src/app/api/subjects/create/route.ts
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
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import SubjectAttempt from "@/models/subject-attempt.model";
import { generateSubjectQuestions } from "@/services/subject-ai.service";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { subject, difficulty } = body;

    if (!subject || !difficulty) {
      return NextResponse.json(
        { success: false, error: "Subject and difficulty are required" },
        { status: 450 }
      );
    }

    const validSubjects = ["DBMS", "OS", "CN", "OOPS"];
    const validDifficulties = ["easy", "medium", "hard"];

    if (!validSubjects.includes(subject) || !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: "Invalid subject or difficulty selection" },
        { status: 400 }
      );
    }

    // Generate 10 questions using Groq or fallback bank
    const generatedQuestions = await generateSubjectQuestions(subject, difficulty, 10);

    const questionsList = generatedQuestions.map((q) => ({
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
    }));

    const attempt = await SubjectAttempt.create({
      userId: payload.userId,
      subject,
      difficulty,
      status: "in-progress",
      questions: questionsList,
      totalQuestions: questionsList.length,
      correctAnswers: 0,
      score: 0,
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt._id,
    });
  } catch (error: any) {
    console.error("POST create subject quiz error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize subject assessment" },
      { status: 500 }
    );
  }
}
