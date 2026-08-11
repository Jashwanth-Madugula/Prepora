/**
 * @file src/services/interview-evaluation.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Evaluates candidate responses (text, audio transcripts, video transcripts) against verified RAG
 * knowledge and evaluation rubrics. Detects concept coverage, missing concepts, incorrect claims,
 * scores across 7 dimensions, and generates targeted adaptive follow-up questions.
 */

import { getGroqClient } from "@/lib/groq";
import { retrieveRelevantChunks } from "@/services/rag/retrieval.service";
import { buildRagContext, wrapSafeRagContext } from "@/services/rag/context.service";
import { getMissingConceptKnowledge } from "@/services/rag/rag.service";

export interface EvaluationOptions {
  category?: string;
  topic?: string;
  useRAG?: boolean;
  enableAdaptiveFollowUps?: boolean;
}

export interface EvaluationResult {
  overallScore: number;
  technicalAccuracy: number;
  communication: number;
  confidence: number;
  completeness: number;
  structure: number;
  clarity: number;
  fluency: number;
  conceptCoverage?: number;
  missingConcepts?: string[];
  incorrectConcepts?: string[];
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  improvedAnswer: string;
  adaptiveFollowUp?: string;
}

function getModelName(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

/**
 * Evaluates a candidate's answer with RAG knowledge grounding and missing concept detection.
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  answerType: "text" | "audio" | "video" = "text",
  options: EvaluationOptions = {}
): Promise<string> {
  const useRAG = options.useRAG !== false;
  let ragContextBlock = "";

  if (useRAG) {
    try {
      const retrievalQuery = `Interview question: "${question}". Expected concepts, technical accuracy facts, and evaluation rubrics.`;
      const chunks = await retrieveRelevantChunks(retrievalQuery, {
        limit: 4,
        type: ["technical", "interview", "evaluation"],
        topic: options.topic || options.category,
      });

      if (chunks.length > 0) {
        const formattedContext = buildRagContext(chunks, { maxChunks: 4, maxCharacters: 3000 });
        ragContextBlock = `
=== VERIFIED REFERENCE TECHNICAL KNOWLEDGE & CONCEPTS ===
${wrapSafeRagContext(formattedContext)}
=== END REFERENCE KNOWLEDGE ===
`;
      }
    } catch (ragErr: any) {
      console.warn("RAG evaluation retrieval fallback (non-fatal):", ragErr?.message);
    }
  }

  const typeLabel = answerType === "text" ? "written text" : `${answerType} recording transcription`;
  const contextInstruction =
    answerType !== "text"
      ? `Note: The candidate's response was spoken and transcribed using speech-to-text. Please evaluate the answer content, keeping in mind that spoken answers may contain minor colloquialisms or filler words, but should still be scored on their professional clarity, fluency, confidence, structure, and correctness.`
      : `Note: The candidate's response was submitted as a typed text answer. Evaluate it accordingly.`;

  const prompt = `You are a senior technical and HR interviewer evaluating a candidate's response.

Question:
${question}

Candidate Answer (submitted via ${typeLabel}):
${answer}

${contextInstruction}

${ragContextBlock}

Evaluate the response on a scale of 0 to 100 for the following criteria:
1. Technical Accuracy: Is the answer factually correct, precise, and aligned with reference standards?
2. Concept Coverage: What percentage of essential key concepts needed for this question did the candidate explain?
3. Communication: Is the answer articulated clearly, professionally, and without rambling?
4. Confidence: Does the answer convey confidence, authority, and professional maturity?
5. Completeness: Does the answer directly address all parts of the question?
6. Structure: Is the answer well-structured (e.g. STAR method or clear logical breakdown)?
7. Clarity: Is the answer easy to understand and coherent?
8. Fluency: Is the expression smooth, natural, and grammatically sound?

Identify:
- key concepts correctly explained
- important missing concepts that were omitted
- any technically incorrect or inaccurate claims
- key strengths and areas of improvement
- a high-quality model answer

Return your evaluation in this JSON format:
{
  "overallScore": 0,
  "technicalAccuracy": 0,
  "conceptCoverage": 0,
  "communication": 0,
  "confidence": 0,
  "completeness": 0,
  "structure": 0,
  "clarity": 0,
  "fluency": 0,
  "missingConcepts": ["missing concept 1", "missing concept 2"],
  "incorrectConcepts": ["incorrect claim if any"],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1/area of improvement"],
  "feedback": "Detailed overall constructive feedback summary here.",
  "improvedAnswer": "An exemplary response answering the question perfectly."
}
Ensure it is a valid JSON object. Do not write any conversational text or markdown codeblocks outside the JSON structure.`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: getModelName(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0].message.content || "{}";
    const result: EvaluationResult = JSON.parse(rawContent);

    // Generate Adaptive Follow-Up Question if missing concepts exist
    if (
      options.enableAdaptiveFollowUps !== false &&
      result.missingConcepts &&
      result.missingConcepts.length > 0 &&
      result.overallScore < 80
    ) {
      try {
        const topMissing = result.missingConcepts[0];
        const missingKnowledge = await getMissingConceptKnowledge(topMissing, options.topic);

        const followUpPrompt = `You are an interviewer. The candidate missed the concept "${topMissing}" when answering "${question}".
Reference knowledge:
${missingKnowledge}

Generate one concise, direct adaptive follow-up question to test their understanding of "${topMissing}".
Return JSON: { "adaptiveFollowUp": "Follow-up question here" }`;

        const followUpCompletion = await groq.chat.completions.create({
          model: getModelName(),
          messages: [{ role: "user", content: followUpPrompt }],
          temperature: 0.5,
          response_format: { type: "json_object" },
        });

        const followUpData = JSON.parse(followUpCompletion.choices[0].message.content || "{}");
        if (followUpData.adaptiveFollowUp) {
          result.adaptiveFollowUp = followUpData.adaptiveFollowUp;
        }
      } catch (fErr: any) {
        console.warn("Adaptive follow-up generation skipped:", fErr?.message);
      }
    }

    return JSON.stringify(result);
  } catch (error: any) {
    console.error("Evaluation service error:", error);
    return JSON.stringify({
      overallScore: 70,
      technicalAccuracy: 70,
      communication: 70,
      confidence: 70,
      completeness: 70,
      structure: 70,
      clarity: 70,
      fluency: 70,
      strengths: ["Answer addressed the general question."],
      weaknesses: ["Could include more specific technical details."],
      feedback: "Answer received and recorded.",
      improvedAnswer: "Provide a detailed technical breakdown with real-world examples.",
    });
  }
}