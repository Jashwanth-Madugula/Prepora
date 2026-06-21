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