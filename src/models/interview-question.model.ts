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
  answer?: string;
  answerType?: "text" | "audio" | "video";
  transcript?: string;
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
  missingConcepts?: string[];
  incorrectConcepts?: string[];
  adaptiveFollowUp?: string;
  improvedAnswer?: string;
  strengths?: string[];
  weaknesses?: string[];
  followUps?: string[];
  speakingSpeed?: number;
  fillerWordCount?: number;
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
    answer: String,
    answerType: {
      type: String,
      enum: ["text", "audio", "video"],
      default: "text",
    },
    transcript: String,
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
    missingConcepts: [String],
    incorrectConcepts: [String],
    adaptiveFollowUp: String,
    improvedAnswer: String,
    strengths: [String],
    weaknesses: [String],
    followUps: [String],
    speakingSpeed: Number,
    fillerWordCount: Number,
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