/**
 * @file src/models/User.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "User" collection.
 * 
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Document, Model } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  username: string;
  email: string;
  password: string;

  role: "USER" | "ADMIN" | "SUPER_ADMIN";

  isVerified: boolean;
  isDeleted: boolean;

  verificationToken?: string;
  verificationTokenExpiry?: Date;

  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;

  refreshToken?: string;
  refreshTokens?: {
    _id?: mongoose.Types.ObjectId;
    tokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    lastActive: Date;
  }[];

  loginAttempts: number;
  lockUntil?: Date;
}


const UserSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN", "SUPER_ADMIN"],
      default: "USER",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,

    verificationTokenExpiry: Date,

    resetPasswordToken: String,

    resetPasswordTokenExpiry: Date,

    refreshToken: String,

    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        ipAddress: String,
        userAgent: String,
        createdAt: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now },
      },
    ],

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);