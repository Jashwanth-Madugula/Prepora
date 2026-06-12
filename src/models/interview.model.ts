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