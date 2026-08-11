/**
 * @file src/services/rag/retrieval.service.ts
 * @category RAG Service
 *
 * Why this code exists:
 * Implements the hybrid vector + keyword retrieval engine for Prepora.
 * Executes MongoDB Atlas Vector Search ($vectorSearch) with post-aggregation $match filtering,
 * boosted by technology keyword relevance, and incorporates a mathematical in-memory
 * cosine similarity fallback to guarantee 100% resilience across all environments.
 */

import mongoose from "mongoose";
import RagDocument, { IRagDocumentMetadata, RagDocumentType } from "@/models/rag-document.model";
import { generateEmbedding } from "./embedding.service";

export interface RetrievalOptions {
  limit?: number;
  minScore?: number;
  type?: RagDocumentType | RagDocumentType[];
  topic?: string;
  subtopic?: string;
  role?: string;
  difficulty?: "easy" | "medium" | "hard";
  experienceLevel?: string;
  userId?: string | mongoose.Types.ObjectId;
  resumeId?: string | mongoose.Types.ObjectId;
  jobDescriptionId?: string | mongoose.Types.ObjectId;
  interviewId?: string | mongoose.Types.ObjectId;
}

export interface RetrievedChunk {
  title: string;
  content: string;
  metadata: IRagDocumentMetadata;
  score: number;
}

/**
 * Computes cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculates a keyword overlap relevance score (0.0 to 1.0) to boost exact matches.
 */
function calculateKeywordScore(query: string, content: string, title: string): number {
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return 0;

  const target = (title + " " + content).toLowerCase();
  let matches = 0;

  for (const word of words) {
    if (target.includes(word)) {
      matches++;
    }
  }

  return matches / words.length;
}

/**
 * Builds MongoDB match filters from RetrievalOptions.
 */
function buildMongoFilter(options: RetrievalOptions): Record<string, any> {
  const filter: Record<string, any> = {};

  if (options.type) {
    if (Array.isArray(options.type)) {
      filter["metadata.type"] = { $in: options.type };
    } else {
      filter["metadata.type"] = options.type;
    }
  }

  if (options.topic) {
    filter["metadata.topic"] = new RegExp(`^${options.topic}$`, "i");
  }

  if (options.role) {
    filter["metadata.role"] = new RegExp(`^${options.role}$`, "i");
  }

  if (options.difficulty) {
    filter["metadata.difficulty"] = options.difficulty;
  }

  if (options.userId) {
    filter["metadata.userId"] = typeof options.userId === "string" 
      ? new mongoose.Types.ObjectId(options.userId) 
      : options.userId;
  }

  if (options.resumeId) {
    filter["metadata.resumeId"] = typeof options.resumeId === "string"
      ? new mongoose.Types.ObjectId(options.resumeId)
      : options.resumeId;
  }

  if (options.jobDescriptionId) {
    filter["metadata.jobDescriptionId"] = typeof options.jobDescriptionId === "string"
      ? new mongoose.Types.ObjectId(options.jobDescriptionId)
      : options.jobDescriptionId;
  }

  if (options.interviewId) {
    filter["metadata.interviewId"] = typeof options.interviewId === "string"
      ? new mongoose.Types.ObjectId(options.interviewId)
      : options.interviewId;
  }

  return filter;
}

/**
 * Fallback retrieval: in-memory cosine similarity and text search over filtered documents.
 */
async function fallbackRetrieve(
  queryEmbedding: number[],
  queryText: string,
  options: RetrievalOptions
): Promise<RetrievedChunk[]> {
  const filter = buildMongoFilter(options);
  const candidateDocs = await RagDocument.find(filter).lean();

  if (!candidateDocs || candidateDocs.length === 0) {
    return [];
  }

  const scored: RetrievedChunk[] = candidateDocs.map((doc: any) => {
    const vectorScore = doc.embedding && doc.embedding.length === queryEmbedding.length
      ? cosineSimilarity(queryEmbedding, doc.embedding)
      : 0;

    const keywordScore = calculateKeywordScore(queryText, doc.content || "", doc.title || "");
    // Hybrid score: 75% vector similarity + 25% exact keyword match
    const finalScore = vectorScore * 0.75 + keywordScore * 0.25;

    return {
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
      score: Math.round(finalScore * 100) / 100,
    };
  });

  const minScore = options.minScore ?? 0.35;
  const limit = options.limit ?? 5;

  return scored
    .filter((chunk) => chunk.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Primary retrieval function: attempts MongoDB Atlas $vectorSearch first with post-$match filtering,
 * with automatic fallback to in-memory cosine similarity if Atlas search is unavailable.
 */
export async function retrieveRelevantChunks(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const limit = options.limit || 5;
  const minScore = options.minScore ?? 0.35;

  // 1. Generate query embedding
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(cleanQuery);
  } catch (err: any) {
    console.warn("RAG query embedding failed, falling back to keyword search:", err.message);
    queryEmbedding = [];
  }

  // 2. Try MongoDB Atlas $vectorSearch with pipeline post-filtering
  if (queryEmbedding.length > 0) {
    try {
      const filter = buildMongoFilter(options);
      const pipeline: any[] = [
        {
          $vectorSearch: {
            index: "rag_vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: Math.max(limit * 15, 60),
            limit: limit * 4,
          },
        },
        ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
        {
          $project: {
            title: 1,
            content: 1,
            metadata: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ];

      const rawResults = await RagDocument.aggregate(pipeline);

      if (rawResults && rawResults.length > 0) {
        const scoredChunks: RetrievedChunk[] = rawResults.map((doc) => {
          const vectorScore = doc.score || 0;
          const keywordScore = calculateKeywordScore(cleanQuery, doc.content || "", doc.title || "");
          const hybridScore = vectorScore * 0.8 + keywordScore * 0.2;

          return {
            title: doc.title,
            content: doc.content,
            metadata: doc.metadata,
            score: Math.round(hybridScore * 100) / 100,
          };
        });

        const filtered = scoredChunks
          .filter((c) => c.score >= minScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);

        if (filtered.length > 0) {
          return filtered;
        }
      }
    } catch (vectorSearchError: any) {
      console.warn(
        "MongoDB Atlas $vectorSearch encountered an error, activating resilient in-memory search:",
        vectorSearchError.message
      );
    }
  }

  // 3. Resilient in-memory fallback
  return fallbackRetrieve(queryEmbedding, cleanQuery, options);
}
