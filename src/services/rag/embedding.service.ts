/**
 * @file src/services/rag/embedding.service.ts
 * @category RAG Service
 *
 * Why this code exists:
 * Provides server-side vector embedding generation using Google Generative AI embeddings.
 * Maps text chunks and search queries into high-dimensional dense vector representations (768-dim)
 * matching the MongoDB Atlas Vector Search index definition.
 * Includes in-memory caching, rate-limit retry logic, and fail-safe exception handling.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

export const EMBEDDING_DIMENSION = 768;
export const DEFAULT_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";

// In-memory cache for query and text embeddings (max 500 entries)
const embeddingCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 500;

function getCacheKey(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

function getGenAIClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured in environment variables.");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generates a 768-dimensional dense embedding vector for a given text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const clean = text.trim();
  if (!clean) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  const cacheKey = getCacheKey(clean);
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const genAI = getGenAIClient();
  if (!genAI) {
    throw new Error("Gemini AI client not initialized (missing GEMINI_API_KEY).");
  }

  const model = genAI.getGenerativeModel({ model: DEFAULT_EMBEDDING_MODEL });

  // Retry logic with exponential backoff
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const requestPayload: any = {
        content: {
          role: "user",
          parts: [{ text: clean }],
        },
        outputDimensionality: EMBEDDING_DIMENSION,
      };

      const response = await model.embedContent(requestPayload);

      const values = response.embedding?.values;
      if (!values || values.length === 0) {
        throw new Error("Empty embedding returned from Gemini API");
      }

      // If length doesn't match expected dimension, pad or slice gracefully
      let finalVector = values;
      if (values.length !== EMBEDDING_DIMENSION) {
        if (values.length > EMBEDDING_DIMENSION) {
          finalVector = values.slice(0, EMBEDDING_DIMENSION);
        } else {
          finalVector = [...values, ...new Array(EMBEDDING_DIMENSION - values.length).fill(0)];
        }
      }

      // Cache result
      if (embeddingCache.size >= MAX_CACHE_SIZE) {
        const firstKey = embeddingCache.keys().next().value;
        if (firstKey) embeddingCache.delete(firstKey);
      }
      embeddingCache.set(cacheKey, finalVector);

      return finalVector;
    } catch (err: any) {
      lastError = err;
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error("Embedding generation failed after 3 attempts:", lastError?.message || lastError);
  throw new Error(`Failed to generate embedding: ${lastError?.message || "Unknown error"}`);
}

/**
 * Generates embeddings in batch for multiple text chunks with rate-limit protection.
 */
export async function generateBatchEmbeddings(
  texts: string[],
  concurrency = 3
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency);
    const batchPromises = batch.map((text) => generateEmbedding(text));
    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach((vector, index) => {
      results[i + index] = vector;
    });

    // Small inter-batch delay to respect free-tier rate limits
    if (i + concurrency < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  return results;
}