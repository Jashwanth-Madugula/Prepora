/**
 * @file src/models/RateLimit.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "RateLimit" collection.
 * 
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRateLimit extends Document {
  key: string;
  points: number;
  expireAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically purge expired entries
RateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
