/**
 * @file src/models/coding-attempt.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "coding-attempt" collection.
 * - Specifically handles compilation, remote sandbox code execution, code editor configuration, and automated AI reviews.
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Schema } from "mongoose";

const CodingAttemptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    questionId: {
      type: Schema.Types.ObjectId,
      ref: "CodingQuestion",
      required: true,
    },

    language: {
      type: String,
      default: "javascript",
    },

    code: {
      type: String,
      default: "",
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

    timeTaken: {
      type: Number,
      default: 0,
    },

    complexity: {
      type: String,
      default: "",
    },

    samplePassed: {
      type: Boolean,
      default: false,
    },

    predictedPassRate: {
      type: Number,
      default: 0,
    },

    aiReview: {
      correctness: { type: Number, default: 0 },
      codeQuality: { type: Number, default: 0 },
      edgeCasesMissing: [{ type: String }],
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      finalComment: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: [
        "in_progress",
        "submitted",
      ],
      default: "in_progress",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CodingAttempt ||
  mongoose.model(
    "CodingAttempt",
    CodingAttemptSchema
  );