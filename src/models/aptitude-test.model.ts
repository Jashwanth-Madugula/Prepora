/**
 * @file src/models/aptitude-test.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "aptitude-test" collection.
 * - Specifically handles aptitude tests logic, database operations, or the dynamic difficulty adaptive testing algorithms.
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAptitudeTest extends Document {
  userId: mongoose.Types.ObjectId;

  title: string;

  category:
    | "quantitative"
    | "logical"
    | "verbal"
    | "mixed";

  difficulty:
    | "easy"
    | "medium"
    | "hard"
    | "adaptive";

  company?: string;

  totalQuestions: number;

  duration: number;

  status:
    | "pending"
    | "in-progress"
    | "completed";

  score?: number;

  createdAt: Date;
  completedAt?: Date;
}

const AptitudeTestSchema = new Schema<IAptitudeTest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["quantitative", "logical", "verbal", "mixed"],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "adaptive"],
      required: true,
    },

    company: {
      type: String,
      required: false,
    },

    totalQuestions: {
      type: Number,
      required: true,
    },

    duration: {
      type: Number,
      default: 30,
    },

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },

    score: Number,

    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export default (mongoose.models.AptitudeTest ||
  mongoose.model<IAptitudeTest>(
    "AptitudeTest",
    AptitudeTestSchema
  )) as Model<IAptitudeTest>;