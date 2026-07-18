/**
 * @file src/app/api/coding/round/[roundId]/save-draft/route.ts
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
import CodingRoundAttempt from "@/models/coding-round-attempt.model";

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

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();

    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { roundId } = await params;
    const body = await req.json().catch(() => ({}));
    const { questionId, code, language } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: "Question ID is required to save draft" },
        { status: 400 }
      );
    }

    const attempt = await CodingRoundAttempt.findOne({
      _id: roundId,
      userId: payload.userId,
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Coding round attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.status === "submitted") {
      return NextResponse.json(
        { success: false, error: "Coding round already submitted. Draft cannot be updated." },
        { status: 400 }
      );
    }

    // Find the specific question and update code/language
    const questionIndex = attempt.questions.findIndex(
      (q: any) => q.questionId.toString() === questionId
    );

    if (questionIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Question not found in this coding round" },
        { status: 404 }
      );
    }

    attempt.questions[questionIndex].code = code || "";
    attempt.questions[questionIndex].language = language || "javascript";

    await attempt.save();

    return NextResponse.json({
      success: true,
      message: "Draft saved successfully",
      attempt,
    });
  } catch (error: any) {
    console.error("Save coding round draft error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save draft" },
      { status: 500 }
    );
  }
}
