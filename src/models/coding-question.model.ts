/**
 * @file src/models/coding-question.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "coding-question" collection.
 * - Specifically handles compilation, remote sandbox code execution, code editor configuration, and automated AI reviews.
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Schema } from "mongoose";

const CodingQuestionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },

    topic: {
      type: String,
      required: true,
    },

    constraints: [
      {
        type: String,
      },
    ],

    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],

    starterCode: {
      type: Map,
      of: String,
    },

    timeLimit: {
      type: Number,
      default: 1,
    },

    memoryLimit: {
      type: Number,
      default: 256,
    },

    hiddenTestCases: [
    {
      input: {
      type: String,
      required: true,
      },

      expectedOutput: {
      type: String,
      required: true,
      }
    }
  ]
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CodingQuestion ||
  mongoose.model(
    "CodingQuestion",
    CodingQuestionSchema
  );