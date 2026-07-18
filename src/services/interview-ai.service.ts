/**
 * @file src/services/interview-ai.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "interview-ai.service.ts".
 * - Specifically handles AI-powered behavioral and technical mock interview evaluation workflows, question lists generation, or audio/video recording processing.
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


/**
 * Generates questions based on parsed resume data.
 * Focuses on projects, skills, experience, and certifications.
 */
export async function generateResumeQuestions(resumeData: any): Promise<any[]> {
  const prompt = `You are an expert resume-based interviewer. Generate exactly 5 relevant interview questions based on the candidate's resume.
Focus on their skills, projects, experience, and certifications.
For projects, ask questions about architecture, challenges, or why specific technologies were selected.
For skills, ask deep-dive conceptual questions.

Resume Data:
${JSON.stringify(resumeData)}

Return your response in this JSON format:
{
  "questions": [
    {
      "question": "Question text here",
      "category": "Project/Skill/Experience/Certification",
      "difficulty": "easy/medium/hard",
      "followUps": [
        "Follow-up question 1",
        "Follow-up question 2"
      ]
    }
  ]
}
Ensure it is a valid JSON object. Do not include any other markdown text or comments.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  try {
    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return data.questions || [];
  } catch (error) {
    console.error("Failed to parse resume questions JSON:", error);
    return [];
  }
}

/**
 * Generates technical questions separate from the resume based on a selected topic and difficulty.
 */
export async function generateTechnicalQuestions(
  topic: string,
  difficulty: string
): Promise<any[]> {
  const prompt = `You are an expert technical interviewer. Generate exactly 5 questions for a candidate applying for a role specializing in: ${topic}.
The difficulty level should be: ${difficulty}.
For each question, provide 2 follow-up questions to test deeper knowledge.

Return your response in this JSON format:
{
  "questions": [
    {
      "question": "Technical question text here",
      "category": "${topic}",
      "difficulty": "${difficulty}",
      "followUps": [
        "Follow-up question 1",
        "Follow-up question 2"
      ]
    }
  ]
}
Ensure it is a valid JSON object. Do not include any other markdown text or comments.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  try {
    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return data.questions || [];
  } catch (error) {
    console.error("Failed to parse technical questions JSON:", error);
    return [];
  }
}

/**
 * Generates behavioral and situational HR questions.
 */
export async function generateHRQuestions(): Promise<any[]> {
  const prompt = `You are a professional HR manager. Generate exactly 5 common behavioral HR questions (e.g. "Tell me about yourself", "Why should we hire you?", "Strengths and weaknesses", "Describe a conflict situation and how you resolved it", "Give an example of a leadership role you took").
For each question, add 2 follow-up questions to guide the conversation.

Return your response in this JSON format:
{
  "questions": [
    {
      "question": "HR behavioral question text here",
      "category": "Behavioral",
      "difficulty": "medium",
      "followUps": [
        "Follow-up question 1",
        "Follow-up question 2"
      ]
    }
  ]
}
Ensure it is a valid JSON object. Do not include any other markdown text or comments.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  try {
    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return data.questions || [];
  } catch (error) {
    console.error("Failed to parse HR questions JSON:", error);
    return [];
  }
}

/**
 * Legacy compatibility wrapper for resume question generation.
 */
export async function generateAIQuestions(resumeData: any) {
  return generateResumeQuestions(resumeData);
}

/**
 * FILE PURPOSE & HELP:
 * This service handles the AI generation of mock interview questions. It includes specific
 * prompts for Resume-Based interviews (extracting custom questions from skills and projects),
 * Technical interviews (topic-specific, difficulty-graded questions with nested follow-ups),
 * and HR interviews (standard HR behavioral prompts with contextual follow-ups).
 * It communicates with the Groq API and uses its JSON response format feature to guarantee
 * structured question objects that can be immediately persisted in the database.
 */