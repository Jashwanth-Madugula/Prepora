/**
 * @file src/services/aptitude/aptitude.service.ts
 *
 * Handles aptitude question creation and persistence.
 */

import AptitudeQuestion from "@/models/aptitude-question.model";

import {
  generateAptitudeQuestions,
} from "./aptitude-ai.service";

/**
 * Create questions for an aptitude test.
 *
 * IMPORTANT:
 * For normal tests:
 *   totalQuestions = requested number
 *
 * For adaptive tests:
 *   only 1 question is initially created.
 */
export async function createQuestions(
  testId: string,
  category: string,
  difficulty: string,
  totalQuestions: number,
  company?: string
) {
  /*
   * Validate requested count.
   */
  if (
    !totalQuestions ||
    totalQuestions <= 0
  ) {
    throw new Error(
      "Invalid totalQuestions."
    );
  }

  /*
   * Adaptive mode starts with ONE question.
   *
   * Normal mode creates ALL requested questions.
   */
  const questionsToGenerate =
    difficulty === "adaptive"
      ? 1
      : totalQuestions;

  console.log(
    "========================================"
  );

  console.log(
    "CREATING APTITUDE QUESTIONS"
  );

  console.log(
    "Test ID:",
    testId
  );

  console.log(
    "Category:",
    category
  );

  console.log(
    "Difficulty:",
    difficulty
  );

  console.log(
    "Requested:",
    questionsToGenerate
  );

  console.log(
    "Company:",
    company || "General"
  );

  console.log(
    "========================================"
  );

  /*
   * Generate questions.
   */
  const aiQuestions =
    await generateAptitudeQuestions(
      category,
      difficulty,
      questionsToGenerate,
      company
    );

  /*
   * Safety check.
   *
   * This prevents the database from receiving
   * only 3 or 4 questions when the user requested 10.
   */
  if (
    !aiQuestions ||
    aiQuestions.length !==
      questionsToGenerate
  ) {
    throw new Error(
      `Question generation failed. Expected ${questionsToGenerate} questions but received ${
        aiQuestions?.length || 0
      }.`
    );
  }

  /*
   * Convert AI questions to MongoDB structure.
   */
  const formattedQuestions =
    aiQuestions.map(
      (question: any) => ({
        testId,

        category:
          question.category ||
          category,

        difficulty:
          question.difficulty ||
          (
            difficulty ===
            "adaptive"
              ? "medium"
              : difficulty
          ),

        question:
          question.question,

        options:
          question.options,

        correctAnswer:
          question.correctAnswer,

        explanation:
          question.explanation,
      })
    );

  /*
   * Final validation before database insertion.
   */
  for (
    const question of formattedQuestions
  ) {
    if (
      !question.question ||
      !Array.isArray(
        question.options
      ) ||
      question.options.length !== 4 ||
      !question.correctAnswer
    ) {
      throw new Error(
        "Invalid question detected before database insertion."
      );
    }

    /*
     * Correct answer must be one of
     * the available options.
     */
    if (
      !question.options.includes(
        question.correctAnswer
      )
    ) {
      throw new Error(
        `Correct answer does not match options for question: ${question.question}`
      );
    }
  }

  /*
   * Insert all questions.
   */
  const insertedQuestions =
    await AptitudeQuestion.insertMany(
      formattedQuestions
    );

  /*
   * Final database safety check.
   */
  if (
    insertedQuestions.length !==
    questionsToGenerate
  ) {
    throw new Error(
      `Database insertion mismatch. Expected ${questionsToGenerate}, inserted ${insertedQuestions.length}.`
    );
  }

  console.log(
    `SUCCESS: ${insertedQuestions.length} aptitude questions created.`
  );

  return insertedQuestions;
}