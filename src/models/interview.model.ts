/**
 * @file src/models/interview.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "interview" collection.
 * - Specifically handles AI-powered behavioral and technical mock interview evaluation workflows, question lists generation, or audio/video recording processing.
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IInterview extends Document {
  userId: mongoose.Types.ObjectId;

  type: "resume" | "technical" | "hr";

  role?: string;

  resumeId?: mongoose.Types.ObjectId;

  status: "in_progress" | "completed";

  score?: number;

  startedAt: Date;

  completedAt?: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["resume", "technical", "hr"],
      required: true,
    },

    role: {
      type: String,
    },

    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
    },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },

    score: Number,

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Interview ||
  mongoose.model<IInterview>("Interview", InterviewSchema);