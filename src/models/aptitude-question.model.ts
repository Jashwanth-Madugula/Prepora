import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAptitudeQuestion extends Document {
  testId: mongoose.Types.ObjectId;

  question: string;

  options: string[];

  correctAnswer: string;

  explanation: string;

  category: string;

  difficulty: string;
}

const AptitudeQuestionSchema =
  new Schema<IAptitudeQuestion>(
    {
      testId: {
        type: Schema.Types.ObjectId,
        ref: "AptitudeTest",
        required: true,
      },

      question: {
        type: String,
        required: true,
      },

      options: {
        type: [String],
        required: true,
      },

      correctAnswer: {
        type: String,
        required: true,
      },

      explanation: {
        type: String,
      },

      category: String,

      difficulty: String,
    },
    {
      timestamps: true,
    }
  );

export default (mongoose.models.AptitudeQuestion ||
  mongoose.model<IAptitudeQuestion>(
    "AptitudeQuestion",
    AptitudeQuestionSchema
  )) as Model<IAptitudeQuestion>;