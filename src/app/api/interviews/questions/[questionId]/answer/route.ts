import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import InterviewQuestion from "@/models/interview-question.model";
import { evaluateAnswer } from "@/services/interview-evaluation.service";

interface RouteParams {
  params: Promise<{
    questionId: string;
  }>;
}

/**
 * POST: Submits the candidate's answer for evaluation.
 * Triggers the AI Evaluation Engine to grade the response on 5 criteria,
 * and saves both scores and suggestions in MongoDB.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { questionId } = await params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { success: false, message: "Invalid question ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { answer } = body;

    if (typeof answer !== "string") {
      return NextResponse.json(
        { success: false, message: "Answer must be a string" },
        { status: 400 }
      );
    }

    const question = await InterviewQuestion.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    // Call AI service to evaluate the response
    const evaluationString = await evaluateAnswer(question.question, answer.trim());
    const result = JSON.parse(evaluationString);

    // Save candidate answers and metrics into the database
    question.answer = answer.trim();
    question.score = result.overallScore || 0;
    question.feedback = result.feedback || "";
    question.technicalAccuracyScore = result.technicalAccuracy || 0;
    question.communicationScore = result.communication || 0;
    question.confidenceScore = result.confidence || 0;
    question.completenessScore = result.completeness || 0;
    question.structureScore = result.structure || 0;
    question.strengths = result.strengths || [];
    question.weaknesses = result.weaknesses || [];
    question.improvedAnswer = result.improvedAnswer || "";

    await question.save();

    return NextResponse.json({
      success: true,
      evaluation: result,
      question,
    });
  } catch (error: any) {
    console.error("POST Question Answer Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process answer evaluation" },
      { status: 500 }
    );
  }
}

/**
 * FILE PURPOSE & HELP:
 * This API endpoint handles POST requests to submit and grade an answer for a specific question.
 * It connects to MongoDB, retrieves the question, feeds both the question text and candidate's
 * response to the AI evaluation engine, and processes the JSON scores.
 * The scores for Technical Accuracy, Communication, Confidence, Completeness, and Structure, 
 * as well as lists of strengths, weaknesses, and a suggested improved answer, are saved back to
 * the question document for long-term tracking and display.
 */