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