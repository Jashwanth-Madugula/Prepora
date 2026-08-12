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
import { evaluateMultimodalAnswer } from "@/services/interview-evaluation.service";
import { analyzeAudioEvidence } from "@/services/audio-analysis.service";

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
      segments = [],
      audioAnalysis: incomingAudioAnalysis,
      duration = 0,
      useRAG = true,
      enableAdaptiveFollowUps = true,
    } = body;

    const type = answerType || "text";
    const contentToEvaluate = (answer || transcript || "").trim();

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

    // Resolve or compute audio analysis for spoken responses
    let resolvedAudioAnalysis = incomingAudioAnalysis || null;
    if (type !== "text" && (!resolvedAudioAnalysis || !resolvedAudioAnalysis.speakingRate)) {
      resolvedAudioAnalysis = analyzeAudioEvidence({
        transcript: contentToEvaluate,
        segments,
        durationSeconds: duration,
      });
    }

    // Call evidence-based Multimodal Evaluation Service
    const evalResult = await evaluateMultimodalAnswer({
      question: question.question,
      answerType: type,
      transcript: contentToEvaluate,
      transcriptSegments: segments,
      audioAnalysis: resolvedAudioAnalysis || undefined,
      expectedConcepts: question.expectedConcepts || [],
      category: question.category,
      topic: question.category,
      useRAG,
      enableAdaptiveFollowUps,
      userId,
    });

    // Save candidate answers, metrics, and evidence into the database
    question.answer = contentToEvaluate;
    question.answerType = type;
    question.transcript = type === "text" ? "" : contentToEvaluate;
    question.transcriptSegments = segments;
    question.audioUrl = audioUrl || "";
    question.videoUrl = videoUrl || "";

    question.score = evalResult.overallScore || 0;
    question.feedback = evalResult.feedback || "";
    question.technicalAccuracyScore = evalResult.technicalAccuracy || 0;
    question.conceptCoverage = evalResult.conceptCoverage || 0;
    question.communicationScore = evalResult.communication || 0;
    question.confidenceScore = evalResult.confidence || 0;
    question.completenessScore = evalResult.completeness || 0;
    question.structureScore = evalResult.structure || 0;
    question.clarityScore = evalResult.clarity || 0;
    question.fluencyScore = evalResult.fluency || 0;

    question.coveredConcepts = evalResult.coveredConcepts || [];
    question.missingConcepts = evalResult.missingConcepts || [];
    question.incorrectConcepts = evalResult.incorrectConcepts || [];
    question.adaptiveFollowUp = evalResult.adaptiveFollowUp || "";
    
    question.strengths = evalResult.strengths || [];
    question.weaknesses = evalResult.weaknesses || [];
    question.improvedAnswer = evalResult.improvedAnswer || "";

    // Speech analytics fields
    if (resolvedAudioAnalysis) {
      question.audioAnalysis = resolvedAudioAnalysis;
      question.speakingSpeed = resolvedAudioAnalysis.speakingRate.wordsPerMinute;
      question.fillerWordCount = resolvedAudioAnalysis.fillers.totalCount;
    } else {
      question.speakingSpeed = 0;
      question.fillerWordCount = 0;
    }

    await question.save();

    // DYNAMIC NEXT QUESTION: If an adaptive follow-up was generated, dynamically insert it as an interactive next question
    let followUpQuestionDoc: any = null;
    if (evalResult.adaptiveFollowUp && enableAdaptiveFollowUps !== false && (evalResult.overallScore || 0) < 95) {
      const existingFollowUp = await InterviewQuestion.findOne({
        interviewId: question.interviewId,
        question: evalResult.adaptiveFollowUp,
      });

      if (!existingFollowUp) {
        followUpQuestionDoc = await InterviewQuestion.create({
          interviewId: question.interviewId,
          question: evalResult.adaptiveFollowUp,
          category: question.category,
          difficulty: question.difficulty,
          expectedConcepts: evalResult.missingConcepts.slice(0, 4),
          followUps: ["Explain the underlying mechanism", "Discuss real-world practical trade-offs"],
        });
      } else {
        followUpQuestionDoc = existingFollowUp;
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: evalResult,
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