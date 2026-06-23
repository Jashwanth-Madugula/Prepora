import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import CodingQuestion from "@/models/coding-question.model";
import { generateCodingQuestion } from "@/services/coding.service";

/**
 * File Purpose:
 * This API endpoint handles POST requests to generate a new coding round question using Groq LLM.
 * Once the question content and hidden cases are generated, they are validated and saved in the
 * CodingQuestion collection in MongoDB, returning the saved document with its unique ID.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { difficulty, topic, company } = body;

    if (!difficulty) {
      return NextResponse.json(
        { success: false, message: "Difficulty is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Call Groq service to generate a standard question
    const rawQuestion = await generateCodingQuestion(difficulty, topic, company);

    // Save generated question into MongoDB
    const question = await CodingQuestion.create({
      title: rawQuestion.title,
      description: rawQuestion.description,
      difficulty: rawQuestion.difficulty || difficulty,
      topic: rawQuestion.topic || "General",
      constraints: rawQuestion.constraints || [],
      examples: rawQuestion.examples || [],
      starterCode: rawQuestion.starterCode || {},
      timeLimit: rawQuestion.timeLimit || 1,
      memoryLimit: rawQuestion.memoryLimit || 256,
      hiddenTestCases: rawQuestion.hiddenTestCases || [],
    });

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error: any) {
    console.error("Coding question generation route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Question generation failed",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}