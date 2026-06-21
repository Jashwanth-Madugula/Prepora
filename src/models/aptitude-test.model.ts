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