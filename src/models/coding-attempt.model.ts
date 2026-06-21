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