/**
 * @file src/services/rag/document.service.ts
 * @category RAG Service
 *
 * Why this code exists:
 * Manages ingestion, chunking, deduplication, indexing, and cleanup of RAG documents
 * in MongoDB `ragdocuments`. Ensures deterministic hashing to prevent redundant API calls,
 * and maintains clean document boundaries with no orphaned embeddings.
 */

import crypto from "crypto";
import mongoose from "mongoose";
import RagDocument, { IRagDocumentMetadata } from "@/models/rag-document.model";
import { chunkText, cleanContent } from "./chunking.service";
import { generateBatchEmbeddings, generateEmbedding } from "./embedding.service";

export interface CreateDocumentInput {
  title: string;
  content: string;
  metadata: IRagDocumentMetadata;
  chunkSize?: number;
  overlap?: number;
}

export function computeContentHash(content: string): string {
  return crypto.createHash("sha256").update(cleanContent(content)).digest("hex");
}

/**
 * Creates and indexes a document with semantic chunking and vector embeddings.
 * Skips chunks that already exist with the same contentHash and metadata to avoid redundant API calls.
 */
export async function createRagDocument(input: CreateDocumentInput) {
  const cleaned = cleanContent(input.content);
  if (!cleaned) {
    throw new Error("Document content cannot be empty");
  }

  const chunks = chunkText(cleaned, {
    chunkSize: input.chunkSize,
    overlap: input.overlap,
  });

  if (!chunks.length) {
    throw new Error("Document does not contain sufficient usable text");
  }

  const documentsToInsert = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const contentHash = computeContentHash(chunk.content);

    // Check if an identical chunk already exists for this type/user
    const query: any = { contentHash, "metadata.type": input.metadata.type };
    if (input.metadata.userId) query["metadata.userId"] = input.metadata.userId;
    if (input.metadata.resumeId) query["metadata.resumeId"] = input.metadata.resumeId;
    if (input.metadata.jobDescriptionId) query["metadata.jobDescriptionId"] = input.metadata.jobDescriptionId;

    const existing = await RagDocument.findOne(query).select("_id");
    if (existing) {
      continue; // Skip already indexed identical chunk
    }

    const embedding = await generateEmbedding(chunk.content);

    documentsToInsert.push({
      title: input.title,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      embedding,
      contentHash,
      metadata: input.metadata,
    });
  }

  if (documentsToInsert.length === 0) {
    return [];
  }

  return RagDocument.insertMany(documentsToInsert);
}

/**
 * Ingests a parsed resume into RAG chunks with strict userId isolation.
 * Automatically replaces existing chunks for the same resumeId.
 */
export async function ingestResumeDocument(
  userId: string | mongoose.Types.ObjectId,
  resumeId: string | mongoose.Types.ObjectId,
  title: string,
  resumeText: string,
  extraMetadata: Partial<IRagDocumentMetadata> = {}
) {
  // 1. Delete previous chunks for this resume to prevent orphans
  await RagDocument.deleteMany({
    "metadata.userId": userId,
    "metadata.resumeId": resumeId,
    "metadata.type": "resume",
  });

  // 2. Index fresh chunks
  return createRagDocument({
    title: `Resume: ${title}`,
    content: resumeText,
    metadata: {
      type: "resume",
      userId,
      resumeId,
      source: "resume-upload",
      ...extraMetadata,
    },
    chunkSize: 800,
    overlap: 120,
  });
}

/**
 * Ingests a Job Description into RAG chunks with strict userId isolation.
 */
export async function ingestJobDescriptionDocument(
  userId: string | mongoose.Types.ObjectId,
  jobDescriptionId: string | mongoose.Types.ObjectId,
  roleTitle: string,
  jdText: string
) {
  // Delete previous chunks for this JD
  await RagDocument.deleteMany({
    "metadata.userId": userId,
    "metadata.jobDescriptionId": jobDescriptionId,
    "metadata.type": "job-description",
  });

  return createRagDocument({
    title: `Job Description: ${roleTitle}`,
    content: jdText,
    metadata: {
      type: "job-description",
      userId,
      jobDescriptionId,
      role: roleTitle,
      source: "job-description-input",
    },
    chunkSize: 800,
    overlap: 120,
  });
}

/**
 * Deletes all RAG documents matching a specific metadata filter.
 */
export async function deleteRagDocumentsByFilter(filter: Partial<IRagDocumentMetadata>) {
  const mongoQuery: any = {};
  if (filter.type) mongoQuery["metadata.type"] = filter.type;
  if (filter.userId) mongoQuery["metadata.userId"] = filter.userId;
  if (filter.resumeId) mongoQuery["metadata.resumeId"] = filter.resumeId;
  if (filter.jobDescriptionId) mongoQuery["metadata.jobDescriptionId"] = filter.jobDescriptionId;
  if (filter.interviewId) mongoQuery["metadata.interviewId"] = filter.interviewId;
  if (filter.topic) mongoQuery["metadata.topic"] = filter.topic;

  return RagDocument.deleteMany(mongoQuery);
}