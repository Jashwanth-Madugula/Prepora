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
    const { answer, answerType, audioUrl, videoUrl, transcript } = body;

    const type = answerType || "text";
    const contentToEvaluate = type === "text" ? answer : transcript;

    if (typeof contentToEvaluate !== "string") {
      return NextResponse.json(
        { success: false, message: "Response content must be a string" },
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

    // Call AI service to evaluate the response (transcribed speech or written text)
    const evaluationString = await evaluateAnswer(question.question, contentToEvaluate.trim(), type);
    const result = JSON.parse(evaluationString);

    // Save candidate answers and metrics into the database
    question.answer = contentToEvaluate.trim(); // store text transcript as answer for backward compatibility
    question.answerType = type;
    question.transcript = type === "text" ? "" : (transcript || "");
    question.audioUrl = audioUrl || "";
    question.videoUrl = videoUrl || "";

    question.score = result.overallScore || 0;
    question.feedback = result.feedback || "";
    question.technicalAccuracyScore = result.technicalAccuracy || 0;
    question.communicationScore = result.communication || 0;
    question.confidenceScore = result.confidence || 0;
    question.completenessScore = result.completeness || 0;
    question.structureScore = result.structure || 0;
    question.clarityScore = result.clarity || 0;
    question.fluencyScore = result.fluency || 0;
    
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
 * It connects to MongoDB, retrieves the question, and handles text, audio, and video inputs.
 * If the input was spoken, it receives the media URLs and transcripts and evaluates the speech-to-text content.
 *
 * Scoring:
 * Grades candidate response across 7 criteria:
 * Technical Accuracy, Communication, Confidence, Completeness, Structure, Clarity, and Fluency.
 * Saved results are subsequently rendered in the candidate scorecard dashboards.
 *
 * FLOW INVOLVEMENT:
 * 1. Frontend submits candidate response block (and any Cloudinary media links) here.
 * 2. Evaluates the text content using the evaluateAnswer service.
 * 3. Persists all values back to the MongoDB InterviewQuestion model and replies.
 */