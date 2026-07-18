/**
 * @file src/app/api/aptitude/[id]/route.ts
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

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import AptitudeTest from "@/models/aptitude-test.model";
import AptitudeQuestion from "@/models/aptitude-question.model";

/**
 * File Purpose:
 * This endpoint retrieves the details of a specific Aptitude Test, including its full list
 * of generated questions. It also performs authorization checks to ensure users can only load
 * their own tests and transition the test status to 'in-progress'.
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

    // Retrieve the test document from database.
    const test = await AptitudeTest.findById(id);
    if (!test) {
      return NextResponse.json({ success: false, error: "Test not found" }, { status: 404 });
    }

    // Verify that the logged-in user matches the owner of this test.
    if (test.userId.toString() !== payload.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Test owner mismatch" }, { status: 403 });
    }

    // If the test status is currently pending, transition it to 'in-progress' as the candidate has loaded it.
    if (test.status === "pending") {
      test.status = "in-progress";
      await test.save();
    }

    // Retrieve all questions created for this test, omitting the correct answer field for security.
    // Candidates should not see the correct answers in their network tab while taking the test!
    const questions = await AptitudeQuestion.find({ testId: id })
      .select("-correctAnswer -explanation"); // Security: hide answers from candidate payload

    // Return the test configuration and questions.
    return NextResponse.json({
      success: true,
      test,
      questions,
    });
  } catch (error) {
    console.error("GET test by id error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}