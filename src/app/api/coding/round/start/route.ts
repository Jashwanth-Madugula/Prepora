/**
 * @file src/app/api/coding/round/start/route.ts
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
import CodingQuestion from "@/models/coding-question.model";
import CodingRoundAttempt from "@/models/coding-round-attempt.model";
import { generateCodingQuestion } from "@/services/coding.service";

/**
 * File Purpose:
 * API endpoint to initialize a new 3-question coding round.
 * Generates one easy, one medium, and one hard question using Groq Llama,
 * saves them in CodingQuestion collection, and sets up a CodingRoundAttempt session
 * with status "in_progress" and a 1 hour 30 min duration.
 */

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

    // Generate 3 coding questions: one easy, one medium, one hard
    const [easyRaw, mediumRaw, hardRaw] = await Promise.all([
      generateCodingQuestion("easy"),
      generateCodingQuestion("medium"),
      generateCodingQuestion("hard"),
    ]);

    // Save generated questions to the database
    const [easyQ, mediumQ, hardQ] = await Promise.all([
      CodingQuestion.create({
        title: easyRaw.title,
        description: easyRaw.description,
        difficulty: "easy",
        topic: easyRaw.topic || "General",
        constraints: easyRaw.constraints || [],
        examples: easyRaw.examples || [],
        starterCode: easyRaw.starterCode || {},
        timeLimit: easyRaw.timeLimit || 1,
        memoryLimit: easyRaw.memoryLimit || 256,
        hiddenTestCases: easyRaw.hiddenTestCases || [],
      }),
      CodingQuestion.create({
        title: mediumRaw.title,
        description: mediumRaw.description,
        difficulty: "medium",
        topic: mediumRaw.topic || "General",
        constraints: mediumRaw.constraints || [],
        examples: mediumRaw.examples || [],
        starterCode: mediumRaw.starterCode || {},
        timeLimit: mediumRaw.timeLimit || 1,
        memoryLimit: mediumRaw.memoryLimit || 256,
        hiddenTestCases: mediumRaw.hiddenTestCases || [],
      }),
      CodingQuestion.create({
        title: hardRaw.title,
        description: hardRaw.description,
        difficulty: "hard",
        topic: hardRaw.topic || "General",
        constraints: hardRaw.constraints || [],
        examples: hardRaw.examples || [],
        starterCode: hardRaw.starterCode || {},
        timeLimit: hardRaw.timeLimit || 1,
        memoryLimit: hardRaw.memoryLimit || 256,
        hiddenTestCases: hardRaw.hiddenTestCases || [],
      }),
    ]);

    // Create a new CodingRoundAttempt with default starter code populated
    const attempt = await CodingRoundAttempt.create({
      userId: payload.userId,
      status: "in_progress",
      score: 0,
      questions: [
        {
          questionId: easyQ._id,
          code: easyQ.starterCode instanceof Map 
            ? (easyQ.starterCode.get("javascript") || "")
            : (easyQ.starterCode.javascript || ""),
          language: "javascript",
          score: 0,
          passedCases: 0,
          totalCases: 0,
          samplePassed: false,
        },
        {
          questionId: mediumQ._id,
          code: mediumQ.starterCode instanceof Map 
            ? (mediumQ.starterCode.get("javascript") || "")
            : (mediumQ.starterCode.javascript || ""),
          language: "javascript",
          score: 0,
          passedCases: 0,
          totalCases: 0,
          samplePassed: false,
        },
        {
          questionId: hardQ._id,
          code: hardQ.starterCode instanceof Map 
            ? (hardQ.starterCode.get("javascript") || "")
            : (hardQ.starterCode.javascript || ""),
          language: "javascript",
          score: 0,
          passedCases: 0,
          totalCases: 0,
          samplePassed: false,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (error: any) {
    console.error("Start coding round error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start coding round" },
      { status: 500 }
    );
  }
}
