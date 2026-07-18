/**
 * @file src/services/aptitude/aptitude.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "aptitude.service.ts".
 * - Specifically handles aptitude tests logic, database operations, or the dynamic difficulty adaptive testing algorithms.
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

import AptitudeQuestion from "@/models/aptitude-question.model";

import {
  generateAptitudeQuestions,
} from "./aptitude-ai.service";

export async function createQuestions(
  testId: string,
  category: string,
  difficulty: string,
  totalQuestions: number,
  company?: string
) {
  // In adaptive mode, we only seed exactly 1 question at "medium" difficulty initially.
  const questionsToGenerate = difficulty === "adaptive" ? 1 : totalQuestions;

  const aiQuestions =
    await generateAptitudeQuestions(
      category,
      difficulty,
      questionsToGenerate,
      company
    );

  const formattedQuestions =
    aiQuestions.map((question: any) => ({
      testId,

      category: question.category || category,

      difficulty: question.difficulty || (difficulty === "adaptive" ? "medium" : difficulty),

      question: question.question,

      options: question.options,

      correctAnswer:
        question.correctAnswer,

      explanation:
        question.explanation,
    }));

  return await AptitudeQuestion.insertMany(
    formattedQuestions
  );
}