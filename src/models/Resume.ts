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