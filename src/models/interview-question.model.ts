import mongoose, { Schema, Document } from "mongoose";

export interface IInterviewQuestion extends Document {
  interviewId: mongoose.Types.ObjectId;

  question: string;

  category: string;

  difficulty: "easy" | "medium" | "hard";

  answer?: string;

  feedback?: string;

  score?: number;

  communicationScore?: number;

  technicalAccuracyScore?: number;

  confidenceScore?: number;

  completenessScore?: number;

  structureScore?: number;

  improvedAnswer?: string;

  strengths?: string[];

  weaknesses?: string[];

  followUps?: string[];
}

const InterviewQuestionSchema =
  new Schema<IInterviewQuestion>(
    {
      interviewId: {
        type: Schema.Types.ObjectId,
        ref: "Interview",
        required: true,
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

      feedback: String,

      score: Number,

      communicationScore: Number,

      technicalAccuracyScore: Number,

      confidenceScore: Number,

      completenessScore: Number,

      structureScore: Number,

      improvedAnswer: String,

      strengths: [String],

      weaknesses: [String],

      followUps: [String],
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

/**
 * FILE PURPOSE & HELP:
 * This model defines the schema for individual questions mapped to a specific interview session.
 * It has been updated to include granular AI evaluation metrics (communication, accuracy, confidence,
 * completeness, and structure) to support the Evaluation Engine. It also stores qualitative
 * feedback fields such as key strengths, weaknesses, and a suggested improved answer.
 * Storing these metrics makes it easy to construct a dashboard visualising the candidate's detailed score.
 */