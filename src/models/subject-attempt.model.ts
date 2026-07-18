/**
 * @file src/models/subject-attempt.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "subject-attempt" collection.
 * 
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubjectQuestion {
  question: string;
  options: string[];
  selected?: string;
  correct: string;
  isCorrect?: boolean;
  explanation: string;
}

export interface ISubjectAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  subject: "DBMS" | "OS" | "CN" | "OOPS";
  difficulty: "easy" | "medium" | "hard";
  status: "in-progress" | "completed";
  questions: ISubjectQuestion[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectQuestionSchema = new Schema<ISubjectQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    selected: { type: String, required: false },
    correct: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const SubjectAttemptSchema = new Schema<ISubjectAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      enum: ["DBMS", "OS", "CN", "OOPS"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    questions: [SubjectQuestionSchema],
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    submittedAt: Date,
  },
  {
    timestamps: true,
  }
);

export default (mongoose.models.SubjectAttempt ||
  mongoose.model<ISubjectAttempt>(
    "SubjectAttempt",
    SubjectAttemptSchema
  )) as Model<ISubjectAttempt>;
