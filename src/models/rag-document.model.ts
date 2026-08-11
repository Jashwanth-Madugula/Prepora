/**
 * @file src/models/rag-document.model.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "ragdocuments" collection.
 * Specifically handles storage of vector-embedded chunks across technical knowledge bases, interview rubrics,
 * candidate resumes, and target job descriptions for MongoDB Atlas Vector Search retrieval.
 */

import mongoose, { Document, Model, Schema } from "mongoose";

export type RagDocumentType =
  | "technical"
  | "interview"
  | "evaluation"
  | "resume"
  | "job-description";

export interface IRagDocumentMetadata {
  type: RagDocumentType;
  topic?: string;
  subtopic?: string;
  role?: string;
  difficulty?: "easy" | "medium" | "hard";
  experienceLevel?: string;
  userId?: mongoose.Types.ObjectId | string;
  resumeId?: mongoose.Types.ObjectId | string;
  jobDescriptionId?: mongoose.Types.ObjectId | string;
  interviewId?: mongoose.Types.ObjectId | string;
  source?: string;
  tags?: string[];
}

export interface IRagDocument extends Document {
  title: string;
  content: string;
  chunkIndex: number;
  embedding: number[];
  contentHash: string;
  metadata: IRagDocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const RagDocumentSchema = new Schema<IRagDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    embedding: {
      type: [Number],
      required: true,
      select: true,
    },
    contentHash: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: {
        type: String,
        enum: ["technical", "interview", "evaluation", "resume", "job-description"],
        required: true,
        index: true,
      },
      topic: {
        type: String,
        index: true,
      },
      subtopic: {
        type: String,
      },
      role: {
        type: String,
        index: true,
      },
      difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
      },
      experienceLevel: {
        type: String,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      resumeId: {
        type: Schema.Types.ObjectId,
        ref: "Resume",
        index: true,
      },
      jobDescriptionId: {
        type: Schema.Types.ObjectId,
        index: true,
      },
      interviewId: {
        type: Schema.Types.ObjectId,
        ref: "Interview",
        index: true,
      },
      source: {
        type: String,
      },
      tags: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    collection: "ragdocuments",
  }
);

// Compound indexes for fast filtered lookups
RagDocumentSchema.index({ "metadata.type": 1, "metadata.topic": 1 });
RagDocumentSchema.index({ "metadata.userId": 1, "metadata.type": 1 });
RagDocumentSchema.index({ contentHash: 1, "metadata.userId": 1 });

export default (mongoose.models.RagDocument ||
  mongoose.model<IRagDocument>(
    "RagDocument",
    RagDocumentSchema
  )) as Model<IRagDocument>;