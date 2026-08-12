/**
 * @file src/services/interview-ai.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Generates AI-powered mock interview questions grounded in RAG technical knowledge,
 * candidate resumes, and target job descriptions. Guarantees question diversity, prevents
 * repetition, adheres to candidate experience levels, and provides seamless non-RAG fallback.
 */

import { getGroqClient } from "@/lib/groq";
import { getMultiSourceRagContext } from "@/services/rag/rag.service";

export interface QuestionGenOptions {
  userId?: string;
  resumeId?: string;
  jobDescriptionId?: string;
  previousQuestions?: string[];
  useRAG?: boolean;
}

function getModelName(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

/**
 * Generates questions based on parsed resume data and RAG grounding.
 * Focuses on projects, skills, experience, and certifications.
 * Derives an expected concept rubric for every question.
 */
export async function generateResumeQuestions(
  resumeData: any,
  options: QuestionGenOptions = {}
): Promise<any[]> {
  const useRAG = options.useRAG !== false;
  let ragContextBlock = "";

  if (useRAG && options.userId) {
    try {
      const skillsStr = resumeData?.skills?.join(", ") || "";
      const projectsStr = (resumeData?.projects || [])
        .map((p: any) => (typeof p === "string" ? p : p.name || ""))
        .join(", ");
      const query = `Candidate resume skills ${skillsStr} and projects ${projectsStr} technical depth and architecture questions`;

      const ragResult = await getMultiSourceRagContext({
        query,
        userId: options.userId,
        resumeId: options.resumeId,
        includeResume: true,
        includeJobDescription: true,
      });

      if (ragResult.combinedContext) {
        ragContextBlock = `
=== RETRIEVED GROUNDING KNOWLEDGE (RESUME & TECHNICAL BASE) ===
${ragResult.safePromptContext}
=== END RETRIEVED KNOWLEDGE ===
`;
      }
    } catch (ragError: any) {
      console.warn("Resume question RAG retrieval failed (fallback to standard):", ragError?.message);
    }
  }

  const prompt = `You are an expert resume-based interviewer. Generate exactly 5 relevant interview questions based on the candidate's resume and reference context.
Focus on their verified skills, projects, experience, and certifications.
For projects, ask questions about architecture, challenges, trade-offs, or why specific technologies were selected.
For skills, ask deep-dive conceptual and practical questions.
For each question, define 4 to 7 specific "expectedConcepts" (key technical/practical concepts or principles a comprehensive answer must cover).
Do NOT invent projects or tools not mentioned in the resume.

Resume Data:
${JSON.stringify(resumeData)}

${ragContextBlock}

Return your response in this JSON format:
{
  "questions": [
    {
      "question": "Question text here",
      "category": "Project/Skill/Experience/Certification",
      "difficulty": "easy/medium/hard",
      "expectedConcepts": [
        "key concept 1",
        "key concept 2",
        "key concept 3",
        "key concept 4"
      ],
      "followUps": [
        "Follow-up question 1",
        "Follow-up question 2"
      ]
    }
  ]
}
Ensure it is a valid JSON object. Do not include any other markdown text or comments outside the JSON structure.`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: getModelName(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    const rawQuestions = data.questions || [];
    return rawQuestions.map((q: any) => ({
      ...q,
      expectedConcepts: Array.isArray(q.expectedConcepts) && q.expectedConcepts.length > 0
        ? q.expectedConcepts
        : ["problem solving", "technical implementation", "architecture trade-offs", "project impact"],
    }));
  } catch (error) {
    console.error("Failed to generate resume questions:", error);
    return [];
  }
}

/**
 * Generates technical questions grounded in RAG technical knowledge, candidate resume, and JD.
 * Defines 4 to 8 expected concepts for each technical question.
 */
export async function generateTechnicalQuestions(
  topic: string,
  difficulty: string,
  options: QuestionGenOptions = {}
): Promise<any[]> {
  const useRAG = options.useRAG !== false;
  let ragContextBlock = "";

  if (useRAG) {
    try {
      const prevContext = options.previousQuestions?.length
        ? `Avoid repeating these topics/questions: ${options.previousQuestions.join(" | ")}`
        : "";

      const query = `${difficulty} level ${topic} technical interview knowledge, core architecture, real-world trade-offs, and practical design. ${prevContext}`;

      const ragResult = await getMultiSourceRagContext({
        query,
        topic,
        role: topic,
        difficulty: difficulty as any,
        userId: options.userId,
        resumeId: options.resumeId,
        jobDescriptionId: options.jobDescriptionId,
        includeResume: Boolean(options.userId && options.resumeId),
        includeJobDescription: Boolean(options.userId),
      });

      if (ragResult.combinedContext) {
        ragContextBlock = `
=== RETRIEVED VERIFIED TECHNICAL KNOWLEDGE ===
${ragResult.safePromptContext}
=== END RETRIEVED KNOWLEDGE ===
`;
      }
    } catch (ragError: any) {
      console.warn("Technical question RAG retrieval failed (fallback to standard):", ragError?.message);
    }
  }

  const prompt = `You are an expert technical interviewer. Generate exactly 5 questions for a candidate applying for a role specializing in: ${topic}.
The difficulty level should be: ${difficulty}.
Ground all factual questions in the verified reference knowledge provided.
Make sure questions test practical reasoning, architectural trade-offs, and real-world understanding.
For each question, define 4 to 8 specific "expectedConcepts" (essential technical principles, mechanics, steps, or terminology that a complete answer must address).
For each question, provide 2 targeted follow-up questions to test deeper knowledge.

${ragContextBlock}

Return your response in this JSON format:
{
  "questions": [
    {
      "question": "Technical question text here",
      "category": "${topic}",
      "difficulty": "${difficulty}",
      "expectedConcepts": [
        "expected concept 1",
        "expected concept 2",
        "expected concept 3",
        "expected concept 4"
      ],
      "followUps": [
        "Follow-up question 1",
        "Follow-up question 2"
      ]
    }
  ]
}
Ensure it is a valid JSON object. Do not include any other markdown text or comments.`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: getModelName(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    const rawQuestions = data.questions || [];
    return rawQuestions.map((q: any) => ({
      ...q,
      expectedConcepts: Array.isArray(q.expectedConcepts) && q.expectedConcepts.length > 0
        ? q.expectedConcepts
        : [`${topic} core architecture`, "underlying mechanics", "performance trade-offs", "best practices"],
    }));
  } catch (error) {
    console.error("Failed to parse technical questions JSON:", error);
    return [];
  }
}

/**
 * Generates behavioral and situational HR questions with expected behavioral competency rubrics.
 */
export async function generateHRQuestions(): Promise<any[]> {
  const prompt = `You are a professional HR manager. Generate exactly 5 common behavioral HR questions (e.g. "Tell me about yourself", "Why should we hire you?", "Strengths and weaknesses", "Describe a conflict situation and how you resolved it", "Give an example of a leadership role you took").
For each question, define 4 to 6 "expectedConcepts" (behavioral elements, structured response points like Situation/Task/Action/Result, self-awareness, leadership, communication).
For each question, add 2 follow-up questions to guide the conversation.

Return your response in this JSON format:
{
  "questions": [
    {
      "question": "HR behavioral question text here",
      "category": "Behavioral",
      "difficulty": "medium",
      "expectedConcepts": [
        "clear context & situation",
        "ownership & specific actions taken",
        "measurable outcome or reflection",
        "professional maturity"
      ],
      "followUps": [
        "Follow-up question 1",
        "Follow-up question 2"
      ]
    }
  ]
}
Ensure it is a valid JSON object. Do not include any other markdown text or comments.`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: getModelName(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    const rawQuestions = data.questions || [];
    return rawQuestions.map((q: any) => ({
      ...q,
      expectedConcepts: Array.isArray(q.expectedConcepts) && q.expectedConcepts.length > 0
        ? q.expectedConcepts
        : ["Situation & Task context", "Action & Ownership", "Result & Reflection", "Professional Communication"],
    }));
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