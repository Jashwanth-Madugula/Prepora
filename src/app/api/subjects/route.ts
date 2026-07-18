/**
 * @file src/app/api/subjects/route.ts
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

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const attempts = await SubjectAttempt.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .select("-questions.correct -questions.explanation"); // Hide details for simple history listing if needed, but we can keep it standard

    return NextResponse.json({
      success: true,
      attempts,
    });
  } catch (error: any) {
    console.error("GET subject attempts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch subject attempts" },
      { status: 500 }
    );
  }
}
