import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import AptitudeTest from "@/models/aptitude-test.model";
import { createQuestions } from "@/services/aptitude/aptitude.service";

/**
 * File Purpose:
 * This API endpoint handles the initialization and creation of a new Aptitude Test.
 * It does the following:
 * 1. Checks user authentication via JWT cookies.
 * 2. Parses the test configuration (Category, Difficulty, and Number of questions).
 * 3. Creates an AptitudeTest document in MongoDB.
 * 4. Triggers the question generator (AI with offline fallback) to seed the test with questions.
 * 5. Returns the testId so the client can navigate to the active test page.
 */

// Helper function to extract and verify the user's identity from request cookies.
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(req: Request) {
  try {
    // Connect to the database.
    await dbConnect();

    // Verify authentication.
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Parse the test settings from the request body.
    const body = await req.json();
    const { category, difficulty, totalQuestions, company } = body;

    // Validate request inputs.
    if (!category || !difficulty || !totalQuestions) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (category, difficulty, totalQuestions)" },
        { status: 400 }
      );
    }

    const title = company 
      ? `${company} Aptitude Assessment` 
      : `${category.charAt(0).toUpperCase() + category.slice(1)} Aptitude Test`;

    // Create the test record in MongoDB. Use the authenticated user's ID.
    const test = await AptitudeTest.create({
      userId: payload.userId,
      title,
      category,
      difficulty,
      company,
      totalQuestions,
      duration: totalQuestions * 2, // Allocate 2 minutes per question (e.g. 10 questions = 20 mins)
      status: "pending",
    });

    // Populate the test with questions by calling the creation service.
    await createQuestions(
      test._id.toString(),
      category,
      difficulty,
      totalQuestions,
      company
    );

    // Return the newly created test ID to direct navigation on the frontend.
    return NextResponse.json({
      success: true,
      testId: test._id,
    });
  } catch (error) {
    console.error("POST create test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}