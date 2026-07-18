/**
 * @file src/models/aptitude-question.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "aptitude-question" collection.
 * - Specifically handles aptitude tests logic, database operations, or the dynamic difficulty adaptive testing algorithms.
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAptitudeQuestion extends Document {
  testId: mongoose.Types.ObjectId;

  question: string;

  options: string[];

  correctAnswer: string;

  explanation: string;

  category: string;

  difficulty: string;
}

const AptitudeQuestionSchema =
  new Schema<IAptitudeQuestion>(
    {
      testId: {
        type: Schema.Types.ObjectId,
        ref: "AptitudeTest",
        required: true,
      },

      question: {
        type: String,
        required: true,
      },

      options: {
        type: [String],
        required: true,
      },

      correctAnswer: {
        type: String,
        required: true,
      },

      explanation: {
        type: String,
      },

      category: String,

      difficulty: String,
    },
    {
      timestamps: true,
    }
  );

export default (mongoose.models.AptitudeQuestion ||
  mongoose.model<IAptitudeQuestion>(
    "AptitudeQuestion",
    AptitudeQuestionSchema
  )) as Model<IAptitudeQuestion>;