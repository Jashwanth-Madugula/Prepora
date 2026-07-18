/**
 * @file src/services/aptitude/aptitude-ai.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "aptitude-ai.service.ts".
 * - Specifically handles aptitude tests logic, database operations, or the dynamic difficulty adaptive testing algorithms.
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

import Groq from "groq-sdk";
import { fallbackQuestions, MockQuestion } from "./question-bank";

/**
 * File Purpose:
 * This service is responsible for generating Aptitude Questions.
 * It primarily  attempts to connect to the Groq Llama-3.3-70b-versatile LLM to generate
 * fresh, dynamic questions based on the requested Category and Difficulty.
 * If the Groq API fails (e.g. due to key mismatch, network issues, or rate limits),
 * it gracefully falls back to random selection from the local question bank.
 */

// Initialize the Groq client with the API key defined in environment variables.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

/**
 * Fallback generator function that selects questions from our local bank.
 * Shuffles matching questions and returns the requested number.
 */
function getLocalQuestions(
  category: string,
  difficulty: string,
  totalQuestions: number,
  excludeQuestionTexts?: string[]
): MockQuestion[] {
  const targetDifficulty = difficulty === "adaptive" ? "medium" : difficulty;
  // Filter the pool based on matching category and difficulty rules.
  let pool = fallbackQuestions.filter((q) => {
    // If category is "mixed", accept all categories. Otherwise, match category exactly.
    const categoryMatches = category === "mixed" || q.category === category;
    // Match difficulty exactly.
    const difficultyMatches = q.difficulty === targetDifficulty;
    
    // Check if it's already generated/used in this test session.
    const isExcluded = excludeQuestionTexts && excludeQuestionTexts.some(
      (eq) => eq.trim().toLowerCase() === q.question.trim().toLowerCase()
    );

    return categoryMatches && difficultyMatches && !isExcluded;
  });

  // If no exact matches for difficulty and category exist, relax difficulty rule first.
  if (pool.length === 0) {
    pool = fallbackQuestions.filter((q) => {
      const categoryMatches = category === "mixed" || q.category === category;
      const isExcluded = excludeQuestionTexts && excludeQuestionTexts.some(
        (eq) => eq.trim().toLowerCase() === q.question.trim().toLowerCase()
      );
      return categoryMatches && !isExcluded;
    });
  }

  // If pool is still empty, fallback to the entire question list.
  if (pool.length === 0) {
    pool = fallbackQuestions;
  }

  // Shuffle the pool using simple random sort.
  const shuffled = [...pool].sort(() => 0.5 - Math.random());

  // Return the requested slice of questions.
  return shuffled.slice(0, totalQuestions);
}

/**
 * Main generation function. It queries Groq or falls back to local bank.
 */
export async function generateAptitudeQuestions(
  category: string,
  difficulty: string,
  totalQuestions: number,
  company?: string,
  excludeQuestionTexts?: string[]
) {
  try {
    // If the API key is missing or not set, skip calling Groq to avoid unnecessary delays.
    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY is not defined. Falling back to local question bank.");
      return getLocalQuestions(category, difficulty, totalQuestions, excludeQuestionTexts);
    }

    const avoidInstruction = excludeQuestionTexts && excludeQuestionTexts.length > 0
      ? `\nCRITICAL: Do NOT generate any of the following questions as they are already in the test (avoid duplicates):\n${excludeQuestionTexts.map((q) => `- ${q}`).join("\n")}`
      : "";

    const targetDifficulty = difficulty === "adaptive" ? "medium" : difficulty;

    // Define the prompt instructing the LLM to output clean JSON formatted questions.
    let prompt = "";
    if (company) {
      prompt = `
Generate ${totalQuestions} aptitude questions tailored specifically to the typical recruitment exam pattern of ${company}.
The questions should match the level of rigor, complexity, and specific focus areas commonly tested by ${company} (e.g., technical aptitude, problem solving, data interpretation, logical deduction, and verbal patterns typical of their screening exams).

Category: ${category} (ensure the questions fit this category)
Difficulty: ${targetDifficulty} (aligned with ${company}'s standards)
${avoidInstruction}

Return ONLY valid JSON. Do not include any markdown fences or explanation outside the JSON.

Format:
[
 {
   "question": "Question text here?",
   "options": ["Option A", "Option B", "Option C", "Option D"],
   "correctAnswer": "Exact matching string from options representing the correct answer",
   "explanation": "Detailed step-by-step solution explaining why this answer is correct"
 }
]
`;
    } else {
      prompt = `
Generate ${totalQuestions} aptitude questions.

Category: ${category}
Difficulty: ${targetDifficulty}
${avoidInstruction}

Return ONLY valid JSON. Do not include any markdown fences or explanation outside the JSON.

Format:
[
 {
   "question": "Question text here?",
   "options": ["Option A", "Option B", "Option C", "Option D"],
   "correctAnswer": "Exact matching string from options representing the correct answer",
   "explanation": "Detailed step-by-step solution explaining why this answer is correct"
 }
]
`;
    }

    // Dispatch the request to the Groq API.
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // Parse and return the generated JSON.
    if (response) {
      // Clean up markdown block syntax if present
      const cleanResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanResponse);
    }

    throw new Error("Empty response from AI engine");
  } catch (error) {
    // Log the error and fall back to local question bank.
    console.error("AI question generation failed. Using local fallback. Error:", error);
    return getLocalQuestions(category, difficulty, totalQuestions, excludeQuestionTexts);
  }
}
