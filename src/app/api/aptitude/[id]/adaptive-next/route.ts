import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import AptitudeTest from "@/models/aptitude-test.model";
import AptitudeQuestion from "@/models/aptitude-question.model";
import { generateAptitudeQuestions } from "@/services/aptitude/aptitude-ai.service";

/**
 * File Purpose:
 * This endpoint evaluates the candidate's response to the current question in an adaptive test,
 * determines if it's correct, adjusts the difficulty, generates/selects the next question
 * of that difficulty (avoiding duplicates), and returns it to the client.
 */

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Verify user authorization.
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { questionId, selectedAnswer } = body;

    if (!questionId) {
      return NextResponse.json({ success: false, error: "Missing current questionId" }, { status: 400 });
    }

    // Retrieve the test configuration.
    const test = await AptitudeTest.findById(id);
    if (!test) {
      return NextResponse.json({ success: false, error: "Test session not found" }, { status: 404 });
    }

    // Ensure the user is the owner of this test.
    if (test.userId.toString() !== payload.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Test owner mismatch" }, { status: 403 });
    }

    // Retrieve the current question from DB to check correctness.
    const currentQuestion = await AptitudeQuestion.findById(questionId);
    if (!currentQuestion) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }

    // Evaluate answer correctness.
    const isCorrect = currentQuestion.correctAnswer === selectedAnswer;

    // Adjust difficulty level based on correctness.
    const currentDifficulty = currentQuestion.difficulty || "medium";
    let nextDifficulty: "easy" | "medium" | "hard" = "medium";

    if (isCorrect) {
      if (currentDifficulty === "easy") nextDifficulty = "medium";
      else if (currentDifficulty === "medium") nextDifficulty = "hard";
      else if (currentDifficulty === "hard") nextDifficulty = "hard";
    } else {
      if (currentDifficulty === "hard") nextDifficulty = "medium";
      else if (currentDifficulty === "medium") nextDifficulty = "easy";
      else if (currentDifficulty === "easy") nextDifficulty = "easy";
    }

    // Retrieve all previously generated questions for this test to avoid repeats.
    const existingQuestions = await AptitudeQuestion.find({ testId: id });
    const excludeQuestionTexts = existingQuestions.map((q) => q.question);

    // Determine next category:
    // If the category is mixed, choose the category that has the lowest count so far to balance the test.
    let nextCategory = test.category;
    if (test.category === "mixed") {
      const categories: ("quantitative" | "logical" | "verbal")[] = ["quantitative", "logical", "verbal"];
      const categoryCounts = { quantitative: 0, logical: 0, verbal: 0 };
      
      existingQuestions.forEach((q) => {
        const cat = q.category as "quantitative" | "logical" | "verbal";
        if (categoryCounts[cat] !== undefined) {
          categoryCounts[cat]++;
        }
      });

      let minCount = Infinity;
      let chosenCategory = categories[0];
      categories.forEach((cat) => {
        if (categoryCounts[cat] < minCount) {
          minCount = categoryCounts[cat];
          chosenCategory = cat;
        }
      });
      nextCategory = chosenCategory;
    }

    // Generate exactly 1 new question with the computed difficulty and category.
    const generated = await generateAptitudeQuestions(
      nextCategory,
      nextDifficulty,
      1,
      test.company,
      excludeQuestionTexts
    );

    if (!generated || generated.length === 0) {
      throw new Error("Unable to generate the next question. Please try again.");
    }

    const nextQData = generated[0];

    // Save the new question to database.
    const nextQuestion = await AptitudeQuestion.create({
      testId: id,
      category: nextCategory,
      difficulty: nextDifficulty,
      question: nextQData.question,
      options: nextQData.options,
      correctAnswer: nextQData.correctAnswer,
      explanation: nextQData.explanation,
    });

    // Return the question details to the client (omit correctAnswer and explanation for test security).
    return NextResponse.json({
      success: true,
      question: {
        _id: nextQuestion._id,
        question: nextQuestion.question,
        options: nextQuestion.options,
      },
    });
  } catch (error: any) {
    console.error("Adaptive next question error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
