/**
 * @file src/models/Profile.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "Profile" collection.
 * 
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  profilePicture?: string;
  headline?: string;
  bio?: string;
  college?: string;
  degree?: string;
  branch?: string;
  cgpa?: number;
  graduationYear?: number;
  targetRole?: string;
  targetCompanies?: string[];
  skills?: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  phone?: string;
  location?: string;
  experienceLevel?: "student" | "fresher" | "experienced";
  placementGoal?: "Product" | "Service" | "Startup";
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    headline: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    college: {
      type: String,
      default: "",
    },
    degree: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
    },
    cgpa: {
      type: Number,
      default: null,
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    targetRole: {
      type: String,
      default: "",
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    linkedinUrl: {
      type: String,
      default: "",
    },
    githubUrl: {
      type: String,
      default: "",
    },
    portfolioUrl: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    experienceLevel: {
      type: String,
      enum: ["student", "fresher", "experienced"],
      default: "student",
    },
    placementGoal: {
      type: String,
      enum: ["Product", "Service", "Startup"],
      default: "Product",
    },
  },
  {
    timestamps: true,
  }
);

export const Profile =
  mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);
