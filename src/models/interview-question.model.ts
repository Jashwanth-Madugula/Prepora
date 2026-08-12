/**
 * @file src/models/interview-question.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "interview-question" collection.
 * Supports text, audio, and video interview submissions, 7-dimensional scoring, speech analytics,
 * RAG concept coverage metrics, and adaptive follow-up questions.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IInterviewQuestion extends Document {
  interviewId: mongoose.Types.ObjectId;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  expectedConcepts?: string[];
  answer?: string;
  answerType?: "text" | "audio" | "video";
  transcript?: string;
  transcriptSegments?: {
    start: number;
    end: number;
    text: string;
  }[];
  audioUrl?: string;
  videoUrl?: string;
  feedback?: string;
  score?: number;
  communicationScore?: number;
  technicalAccuracyScore?: number;
  confidenceScore?: number;
  completenessScore?: number;
  structureScore?: number;
  clarityScore?: number;
  fluencyScore?: number;
  conceptCoverage?: number;
  coveredConcepts?: string[];
  missingConcepts?: string[];
  incorrectConcepts?: string[];
  adaptiveFollowUp?: string;
  improvedAnswer?: string;
  strengths?: string[];
  weaknesses?: string[];
  followUps?: string[];
  speakingSpeed?: number;
  fillerWordCount?: number;
  audioAnalysis?: {
    durationSeconds?: number;
    speakingRate?: {
      wordsPerMinute?: number;
      speechDurationSeconds?: number;
      totalDurationSeconds?: number;
      wordCount?: number;
      paceClassification?: string;
    };
    pauses?: {
      pauseCount?: number;
      totalPauseSeconds?: number;
      averagePauseSeconds?: number;
      pauseRatio?: number;
      longPauseCount?: number;
      pausePatternClassification?: string;
    };
    fillers?: {
      totalCount?: number;
      fillerRatePer100Words?: number;
      detectedFillers?: Record<string, number>;
      fillerClassification?: string;
    };
    energy?: {
      meanRms?: number;
      energyVariation?: number;
      energyConsistencyScore?: number;
    };
    speechContinuity?: {
      speechToSilenceRatio?: number;
      hesitationCount?: number;
      continuityScore?: number;
    };
    vocalDeliveryConfidenceScore?: number;
    summaryText?: string;
  };
}

const InterviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    expectedConcepts: {
      type: [String],
      default: [],
    },
    answer: String,
    answerType: {
      type: String,
      enum: ["text", "audio", "video"],
      default: "text",
    },
    transcript: String,
    transcriptSegments: [
      {
        start: Number,
        end: Number,
        text: String,
      },
    ],
    audioUrl: String,
    videoUrl: String,
    feedback: String,
    score: Number,
    communicationScore: Number,
    technicalAccuracyScore: Number,
    confidenceScore: Number,
    completenessScore: Number,
    structureScore: Number,
    clarityScore: Number,
    fluencyScore: Number,
    conceptCoverage: Number,
    coveredConcepts: [String],
    missingConcepts: [String],
    incorrectConcepts: [String],
    adaptiveFollowUp: String,
    improvedAnswer: String,
    strengths: [String],
    weaknesses: [String],
    followUps: [String],
    speakingSpeed: Number,
    fillerWordCount: Number,
    audioAnalysis: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.InterviewQuestion ||
  mongoose.model<IInterviewQuestion>(
    "InterviewQuestion",
    InterviewQuestionSchema
  );