/**
 * @file src/services/rag/rag.service.ts
 * @category RAG Orchestration Service
 *
 * Why this code exists:
 * High-level orchestration service for Prepora's complete RAG pipeline.
 * Coordinates multi-source retrieval (Technical Knowledge + Candidate Resume + Job Description),
 * handles source prioritization, builds unified safe context, and retrieves missing concept knowledge
 * for adaptive follow-up questions.
 */

import mongoose from "mongoose";
import { retrieveRelevantChunks, RetrievedChunk } from "./retrieval.service";
import { buildRagContext, wrapSafeRagContext } from "./context.service";

export interface MultiSourceRagInput {
  query: string;
  role?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  experienceLevel?: string;
  userId?: string | mongoose.Types.ObjectId;
  resumeId?: string | mongoose.Types.ObjectId;
  jobDescriptionId?: string | mongoose.Types.ObjectId;
  includeResume?: boolean;
  includeJobDescription?: boolean;
}

export interface MultiSourceRagResult {
  technicalChunks: RetrievedChunk[];
  resumeChunks: RetrievedChunk[];
  jobDescriptionChunks: RetrievedChunk[];
  combinedContext: string;
  safePromptContext: string;
  sourcesCount: number;
}

/**
 * Retrieves knowledge across Technical Base, Candidate Resume, and Job Description,
 * combining them into a prioritized, safe RAG context block.
 */
export async function getMultiSourceRagContext(
  input: MultiSourceRagInput
): Promise<MultiSourceRagResult> {
  const {
    query,
    role,
    topic,
    difficulty,
    userId,
    resumeId,
    jobDescriptionId,
    includeResume = true,
    includeJobDescription = true,
  } = input;

  // 1. Retrieve Technical Knowledge
  const technicalPromise = retrieveRelevantChunks(query, {
    limit: 4,
    type: ["technical", "interview", "evaluation"],
    topic,
    role,
    difficulty,
  }).catch((err) => {
    console.warn("RAG technical retrieval error:", err.message);
    return [] as RetrievedChunk[];
  });

  // 2. Retrieve Candidate Resume Knowledge (if userId & resumeId present)
  let resumePromise: Promise<RetrievedChunk[]> = Promise.resolve([]);
  if (includeResume && userId) {
    resumePromise = retrieveRelevantChunks(query, {
      limit: 3,
      type: "resume",
      userId,
      ...(resumeId && { resumeId }),
    }).catch((err) => {
      console.warn("RAG resume retrieval error:", err.message);
      return [] as RetrievedChunk[];
    });
  }

  // 3. Retrieve Job Description Knowledge (if userId & JD present)
  let jdPromise: Promise<RetrievedChunk[]> = Promise.resolve([]);
  if (includeJobDescription && userId) {
    jdPromise = retrieveRelevantChunks(query, {
      limit: 3,
      type: "job-description",
      userId,
      ...(jobDescriptionId && { jobDescriptionId }),
    }).catch((err) => {
      console.warn("RAG job description retrieval error:", err.message);
      return [] as RetrievedChunk[];
    });
  }

  const [technicalChunks, resumeChunks, jobDescriptionChunks] = await Promise.all([
    technicalPromise,
    resumePromise,
    jdPromise,
  ]);

  // Combine chunks with source prioritization:
  // Resume chunks first (for personalized project context)
  // Job Description chunks second (for targeted requirements)
  // Technical chunks third (for verified technical facts)
  const combinedChunks: RetrievedChunk[] = [
    ...resumeChunks,
    ...jobDescriptionChunks,
    ...technicalChunks,
  ];

  const combinedContext = buildRagContext(combinedChunks, {
    maxChunks: 8,
    maxCharacters: 4500,
  });

  const safePromptContext = wrapSafeRagContext(combinedContext);

  return {
    technicalChunks,
    resumeChunks,
    jobDescriptionChunks,
    combinedContext,
    safePromptContext,
    sourcesCount: combinedChunks.length,
  };
}

/**
 * Retrieves reference technical knowledge for a specific missing concept to generate an adaptive follow-up.
 */
export async function getMissingConceptKnowledge(
  missingConcept: string,
  topic?: string
): Promise<string> {
  if (!missingConcept.trim()) return "";

  const chunks = await retrieveRelevantChunks(missingConcept, {
    limit: 2,
    type: ["technical", "interview", "evaluation"],
    topic,
  });

  if (chunks.length === 0) return "";

  return buildRagContext(chunks, { maxChunks: 2, maxCharacters: 1500 });
}
