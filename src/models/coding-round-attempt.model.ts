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
