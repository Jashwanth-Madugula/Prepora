/**
 * @file src/app/api/interviews/questions/[questionId]/answer/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Evaluates candidate responses (text, audio, video) using RAG knowledge grounding and rubric checking.
 * Saves 7-dimensional metrics, concept coverage, detected missing concepts, and when knowledge gaps
 * exist, dynamically generates and creates an interactive adaptive follow-up question in MongoDB.
 */

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
        { success: false, message: "Invalid question ID format" },
        { status: 400 }
      );
    }

    const question = await InterviewQuestion.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question record not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      answer,
      answerType,
      audioUrl,
      videoUrl,
      transcript,
      duration = 0,
      useRAG = true,
      enableAdaptiveFollowUps = true,
    } = body;

    const type = answerType || "text";
    let contentToEvaluate = answer || transcript || "";

    if (!contentToEvaluate && type === "text") {
      return NextResponse.json(
        { success: false, message: "Please provide a valid typed response" },
        { status: 400 }
      );
    }

    if (type !== "text" && !transcript && !contentToEvaluate) {
      return NextResponse.json(
        { success: false, message: "Transcript is missing for audio/video response" },
        { status: 400 }
      );
    }

    // Audio / speech cadence metrics
    let speakingSpeed = 0;
    if (duration > 0 && contentToEvaluate) {
      const wordCount = contentToEvaluate.trim().split(/\s+/).length;
      const minutes = duration / 60;
      speakingSpeed = Math.round(wordCount / minutes);
    }

    const fillerWords = ["um", "uh", "like", "basically", "actually", "literally", "you know", "i mean"];
    let fillerWordCount = 0;
    if (contentToEvaluate) {
      const words = contentToEvaluate.toLowerCase();
      fillerWords.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "g");
        const matches = words.match(regex);
        if (matches) {
          fillerWordCount += matches.length;
        }
      });
    }

    // Call RAG AI service to evaluate the response & detect missing concepts
    const evaluationString = await evaluateAnswer(
      question.question,
      contentToEvaluate.trim(),
      type,
      {
        category: question.category,
        topic: question.category,
        useRAG,
        enableAdaptiveFollowUps,
      }
    );
    const result = JSON.parse(evaluationString);

    // Save candidate answers and metrics into the database
    question.answer = contentToEvaluate.trim();
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
    question.conceptCoverage = result.conceptCoverage || result.completeness || 0;
    question.missingConcepts = result.missingConcepts || [];
    question.incorrectConcepts = result.incorrectConcepts || [];
    question.adaptiveFollowUp = result.adaptiveFollowUp || "";
    
    question.strengths = result.strengths || [];
    question.weaknesses = result.weaknesses || [];
    question.improvedAnswer = result.improvedAnswer || "";

    question.speakingSpeed = speakingSpeed;
    question.fillerWordCount = fillerWordCount;

    await question.save();

    // DYNAMIC NEXT QUESTION: If an adaptive follow-up was generated, dynamically insert it as an interactive next question
    let followUpQuestionDoc: any = null;
    if (result.adaptiveFollowUp && enableAdaptiveFollowUps !== false && (result.overallScore || 0) < 95) {
      const existingFollowUp = await InterviewQuestion.findOne({
        interviewId: question.interviewId,
        question: result.adaptiveFollowUp,
      });

      if (!existingFollowUp) {
        followUpQuestionDoc = await InterviewQuestion.create({
          interviewId: question.interviewId,
          question: result.adaptiveFollowUp,
          category: question.category,
          difficulty: question.difficulty,
          followUps: ["Explain the underlying mechanism", "Discuss real-world practical trade-offs"],
        });
      } else {
        followUpQuestionDoc = existingFollowUp;
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: result,
      question,
      followUpQuestion: followUpQuestionDoc,
    });
  } catch (error: any) {
    console.error("POST Question Answer Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process answer evaluation" },
      { status: 500 }
    );
  }
}