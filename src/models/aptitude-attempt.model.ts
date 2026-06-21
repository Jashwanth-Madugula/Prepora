import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * File Purpose:
 * This model defines the schema and interface for an Aptitude Test Attempt.
 * Whenever a user completes a test, their selections and results are evaluated
 * and saved using this schema. This allows us to track performance history,
 * calculate overall analytics, detect category-specific weaknesses, and generate recommendations.
 */

// Define the Typescript interface representing the Aptitude Attempt Document in MongoDB.
export interface IAptitudeAttempt extends Document {
  // Reference to the User who made the attempt.
  userId: mongoose.Types.ObjectId;

  // Reference to the Aptitude Test that was attempted.
  testId: mongoose.Types.ObjectId;

  // Array of question answers with their correctness status.
  answers: {
    questionId: mongoose.Types.ObjectId;
    selectedAnswer: string;
    isCorrect: boolean;
  }[];

  // The final calculated test score (percentage, 0-100).
  score: number;

  // The total number of questions present in the test.
  totalQuestions: number;

  // The number of questions the user answered correctly.
  correctAnswers: number;

  // The category of the test (denormalized here to enable high-performance analytics queries).
  category: "quantitative" | "logical" | "verbal" | "mixed";

  // The difficulty of the test (denormalized here for performance and analytics).
  difficulty: "easy" | "medium" | "hard" | "adaptive";

  // The timestamp when the test attempt was submitted.
  submittedAt: Date;
}

// Define the MongoDB Mongoose schema representing the structure of attempt records.
const AptitudeAttemptSchema = new Schema<IAptitudeAttempt>(
  {
    // The userId connects this attempt to the specific user. It is indexable and required.
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The testId points to the parent AptitudeTest configuration.
    testId: {
      type: Schema.Types.ObjectId,
      ref: "AptitudeTest",
      required: true,
    },

    // A list of the user's answers. Stores the question link, user's input, and correctness.
    answers: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "AptitudeQuestion",
        },
        selectedAnswer: {
          type: String,
          required: false, // Can be empty if skipped
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Stores the calculated percentage score of the user for fast querying.
    score: {
      type: Number,
      required: true,
    },

    // Total questions in the test (used to compute accuracy stats).
    totalQuestions: {
      type: Number,
      required: true,
    },

    // Number of correct answers.
    correctAnswers: {
      type: Number,
      required: true,
    },

    // Category is saved directly to allow category-based filters and stats without complex joins.
    category: {
      type: String,
      enum: ["quantitative", "logical", "verbal", "mixed"],
      required: true,
    },

    // Difficulty level is saved to track user's progression and success across easy/medium/hard tests.
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "adaptive"],
      required: true,
    },

    // Records when the attempt was submitted. Defaults to the current date/time.
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps to the attempt document.
    timestamps: true,
  }
);

// Register and export the model. Reuse existing compilation if already defined by mongoose.
export default (mongoose.models.AptitudeAttempt ||
  mongoose.model<IAptitudeAttempt>(
    "AptitudeAttempt",
    AptitudeAttemptSchema
  )) as Model<IAptitudeAttempt>;