/**
 * @file src/models/Resume.ts
 * @category Mongoose DB Schema Model
 *
 * Why this code exists:
 * Defines the database schema structure, validation constraints, and indexing rules for the "Resume" collection.
 * 
 *
 * What problem it solves:
 * - Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.
 *
 * How it works internally:
 * - Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.
 */

export enum ResumeStatus {
  UPLOADED = "UPLOADED",

  PARSING = "PARSING",

  PARSED = "PARSED",

  ANALYZED = "ANALYZED",
}

interface ParsedData {
  name?: string;

  email?: string;

  phone?: string;

  skills?: string[];

  education?: string[];

  projects?: string[];

  experience?: string[];

  certifications?: string[];

  achievements?: string[];
}

import mongoose, {
  Document,
} from "mongoose";

export interface IResume
  extends Document {

  userId:
    mongoose.Types.ObjectId;

  title: string;

  originalFileName: string;

  fileUrl: string;

  cloudinaryPublicId: string;

  fileSize: number;

  mimeType: string;

  isDefault: boolean;

  status: ResumeStatus;

  parsedText?: string;

  parsedData?: ParsedData;

  uploadedAt: Date;

  createdAt: Date;

  updatedAt: Date;

  atsScore?: number;
  atsSuggestions?: string[];
  atsKeywordsMatched?: string[];
  atsKeywordsMissing?: string[];
  atsKeywordDensity?: string;
  atsAnalyzedAt?: Date;

  jdText?: string;
  jdMatchPercentage?: number;
  jdMissingSkills?: string[];
  jdMissingKeywords?: string[];
  jdStrengths?: string[];
  jdSuggestions?: string[];
}


const ParsedDataSchema =
  new mongoose.Schema(
    {
      name: String,

      email: String,

      phone: String,

      skills: [String],

      education: [String],

      projects: [String],

      experience: [String],

      certifications: [String],

      achievements: [String],
    },
    {
      _id: false,
    }
  );


  const ResumeSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },

      title: {
        type: String,

        required: true,

        trim: true,

        maxlength: 100,
      },

      originalFileName: {
        type: String,

        required: true,
      },

      fileUrl: {
        type: String,

        required: true,
      },

      cloudinaryPublicId: {
        type: String,

        required: true,
      },

      fileSize: {
        type: Number,

        required: true,
      },

      mimeType: {
        type: String,

        required: true,
      },

      isDefault: {
        type: Boolean,

        default: false,
      },

      status: {
        type: String,

        enum:
          Object.values(
            ResumeStatus
          ),

        default:
          ResumeStatus.UPLOADED,
      },

      parsedText: {
        type: String,
      },

      parsedData:
        ParsedDataSchema,

      uploadedAt: {
        type: Date,

        default:
          Date.now,
      },

      atsScore: {
        type: Number,
        default: 0,
      },

      atsSuggestions: {
        type: [String],
        default: [],
      },

      atsKeywordsMatched: {
        type: [String],
        default: [],
      },

      atsKeywordsMissing: {
        type: [String],
        default: [],
      },

      atsKeywordDensity: {
        type: String,
        default: "",
      },

      atsAnalyzedAt: Date,

      jdText: String,
      jdMatchPercentage: { type: Number, default: 0 },
      jdMissingSkills: { type: [String], default: [] },
      jdMissingKeywords: { type: [String], default: [] },
      jdStrengths: { type: [String], default: [] },
      jdSuggestions: { type: [String], default: [] },
    },
    {
      timestamps: true,
    }
  );


export const Resume =
  mongoose.models.Resume ||
  mongoose.model<IResume>(
    "Resume",
    ResumeSchema
  );