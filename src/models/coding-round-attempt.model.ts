/**
 * @file src/models/coding-round-attempt.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "coding-round-attempt" collection.
 * - Specifically handles compilation, remote sandbox code execution, code editor configuration, and automated AI reviews.
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICodingRoundQuestionAttempt {
  questionId: mongoose.Types.ObjectId;
  code: string;
  language: string;
  score: number;
  passedCases: number;
  totalCases: number;
  samplePassed: boolean;
  aiReview?: {
    correctness: number;
    codeQuality: number;
    edgeCasesMissing: string[];
    strengths: string[];
    improvements: string[];
    finalComment: string;
  };
}

export interface ICodingRoundAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  status: "in_progress" | "submitted";
  questions: ICodingRoundQuestionAttempt[];
  score: number;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CodingRoundQuestionAttemptSchema = new Schema<ICodingRoundQuestionAttempt>({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: "CodingQuestion",
    required: true,
  },
  code: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "javascript",
  },
  score: {
    type: Number,
    default: 0,
  },
  passedCases: {
    type: Number,
    default: 0,
  },
  totalCases: {
    type: Number,
    default: 0,
  },
  samplePassed: {
    type: Boolean,
    default: false,
  },
  aiReview: {
    correctness: { type: Number, default: 0 },
    codeQuality: { type: Number, default: 0 },
    edgeCasesMissing: [{ type: String }],
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    finalComment: { type: String, default: "" },
  },
}, { _id: false });

const CodingRoundAttemptSchema = new Schema<ICodingRoundAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
    },
    questions: [CodingRoundQuestionAttemptSchema],
    score: {
      type: Number,
      default: 0,
    },
    submittedAt: Date,
  },
  {
    timestamps: true,
  }
);

export default (mongoose.models.CodingRoundAttempt ||
  mongoose.model<ICodingRoundAttempt>(
    "CodingRoundAttempt",
    CodingRoundAttemptSchema
  )) as Model<ICodingRoundAttempt>;
