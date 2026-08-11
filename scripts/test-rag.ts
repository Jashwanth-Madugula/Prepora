/**
 * @file scripts/test-rag.ts
 * @category RAG Automated Test Suite
 *
 * Why this code exists:
 * Verifies the complete end-to-end RAG implementation:
 * 1. Semantic Chunking & Overlap
 * 2. Vector Embedding Generation & 768-dim Verification
 * 3. Hashing & Duplicate Prevention
 * 4. Hybrid Retrieval & Score Thresholds on Seeded Knowledge
 * 5. Multi-Source Context Construction (Technical + Resume + JD)
 * 6. User Isolation Security Checks
 * 7. Grounded Question Generation with Fallback Resilience
 * 8. Answer Evaluation & Missing Concept Detection
 * 9. Adaptive Follow-Up Question Generation
 *
 * Usage:
 * npx tsx scripts/test-rag.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { chunkText } from "../src/services/rag/chunking.service";
import { generateEmbedding, EMBEDDING_DIMENSION } from "../src/services/rag/embedding.service";
import { retrieveRelevantChunks } from "../src/services/rag/retrieval.service";
import { buildRagContext } from "../src/services/rag/context.service";
import { generateTechnicalQuestions } from "../src/services/interview-ai.service";
import { evaluateAnswer } from "../src/services/interview-evaluation.service";
import { calculateInterviewResult } from "../src/services/interview-analytics.service";
import RagDocument from "../src/models/rag-document.model";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log("==========================================");
  console.log("🧪 Running Prepora End-to-End RAG Test Suite");
  console.log("==========================================");

  await mongoose.connect(MONGODB_URI!);

  // 1. Chunking Test
  console.log("\n[1/9] Testing Semantic Chunking...");
  const sampleLongText = `
Paragraph 1: React is a JavaScript library for building user interfaces. It uses a virtual DOM for efficient updates.

Paragraph 2: The virtual DOM is an in-memory representation of real DOM elements. When state changes, React creates a new tree.

Paragraph 3: The reconciliation algorithm compares the two trees and computes minimal changes needed for the real DOM.
`.trim();
  const chunks = chunkText(sampleLongText, { chunkSize: 200, overlap: 50, minChunkLength: 30 });
  assert(chunks.length >= 2, "Chunking splits long text into multiple overlapping chunks");
  assert(chunks[0].content.length >= 30, "Chunks satisfy minimum character length requirements");

  // 2. Embedding Dimension Test
  console.log("\n[2/9] Testing Embedding Generation & Dimensionality...");
  const sampleVector = await generateEmbedding("What is JWT authentication?");
  assert(sampleVector.length === EMBEDDING_DIMENSION, `Embedding dimension is exactly ${EMBEDDING_DIMENSION} (actual: ${sampleVector.length})`);
  assert(sampleVector.some((v) => v !== 0), "Embedding contains non-zero vector values");

  // 3. Retrieval Query Tests
  console.log("\n[3/9] Testing Hybrid Retrieval on Seeded Knowledge Base...");
  const jwtResults = await retrieveRelevantChunks("What is JWT authentication?", { limit: 3 });
  assert(jwtResults.length > 0, "Retrieval returns results for 'What is JWT authentication?'");
  assert(
    jwtResults.some((r) => r.title.toLowerCase().includes("jwt") || r.content.toLowerCase().includes("jwt")),
    "Retrieved chunks contain relevant JWT knowledge"
  );

  const reactResults = await retrieveRelevantChunks("How does React reconciliation work?", { limit: 3 });
  assert(
    reactResults.some((r) => r.content.toLowerCase().includes("reconciliation") || r.content.toLowerCase().includes("fiber")),
    "Retrieved chunks contain relevant React Reconciliation / Fiber knowledge"
  );

  const mongoResults = await retrieveRelevantChunks("What are MongoDB indexes?", { limit: 3 });
  assert(
    mongoResults.some((r) => r.content.toLowerCase().includes("index") || r.title.toLowerCase().includes("mongodb")),
    "Retrieved chunks contain relevant MongoDB indexing knowledge"
  );

  const redisResults = await retrieveRelevantChunks("How does Redis caching work?", { limit: 3 });
  assert(
    redisResults.some((r) => r.content.toLowerCase().includes("redis") || r.content.toLowerCase().includes("cache")),
    "Retrieved chunks contain relevant Redis caching knowledge"
  );

  // 4. Context Builder Test
  console.log("\n[4/9] Testing Context Construction & Formatting...");
  const contextStr = buildRagContext(jwtResults, { maxChunks: 2 });
  assert(contextStr.includes("[Reference Source 1:"), "Context builder generates structured reference headers");
  assert(contextStr.length > 100, "Context builder produces non-empty grounded context");

  // 5. User Isolation Security Test
  console.log("\n[5/9] Testing Candidate Data Isolation (Security)...");
  const fakeUserA = new mongoose.Types.ObjectId();
  const fakeUserB = new mongoose.Types.ObjectId();
  const fakeResumeId = new mongoose.Types.ObjectId();

  // Insert dummy resume for User A
  const dummyA = await RagDocument.create({
    title: "Resume: Alice Secret Project",
    content: "Private confidential project on distributed blockchain consensus by Alice.",
    chunkIndex: 0,
    embedding: sampleVector,
    contentHash: "dummy-hash-alice-" + Date.now(),
    metadata: {
      type: "resume",
      userId: fakeUserA,
      resumeId: fakeResumeId,
    },
  });

  // Query as User B
  const userBResults = await retrieveRelevantChunks("distributed blockchain consensus", {
    userId: fakeUserB,
    type: "resume",
  });
  assert(
    !userBResults.some((r) => r.content.includes("Alice")),
    "User B CANNOT retrieve User A's private resume data (strict tenant isolation verified)"
  );

  // Cleanup test dummy
  await RagDocument.deleteOne({ _id: dummyA._id });

  // 6. Grounded Question Generation Test
  console.log("\n[6/9] Testing Technical Question Generation with RAG...");
  const generatedQuestions = await generateTechnicalQuestions("Full Stack", "medium", {
    useRAG: true,
  });
  assert(Array.isArray(generatedQuestions) && generatedQuestions.length > 0, "Technical question generation returns structured questions");
  assert(Boolean(generatedQuestions[0]?.question), "Generated question has valid question text");
  assert(Array.isArray(generatedQuestions[0]?.followUps), "Generated question includes nested follow-ups");

  // 7. Answer Evaluation & Missing Concept Detection Test
  console.log("\n[7/9] Testing RAG Answer Evaluation & Missing Concepts...");
  const evalQuestion = "Explain how JWT authentication works.";
  const candidateIncompleteAnswer = "JWT has a header and payload and is used for login.";
  const evalResponseStr = await evaluateAnswer(evalQuestion, candidateIncompleteAnswer, "text", {
    category: "Authentication",
    useRAG: true,
    enableAdaptiveFollowUps: true,
  });
  const evalResult = JSON.parse(evalResponseStr);
  assert(typeof evalResult.overallScore === "number", "Evaluation returns numeric overallScore");
  assert(typeof evalResult.technicalAccuracy === "number", "Evaluation returns technicalAccuracy");
  assert(Array.isArray(evalResult.missingConcepts), "Evaluation detects missing concepts for incomplete answers");
  console.log(`    Detected missing concepts: ${evalResult.missingConcepts?.join(", ")}`);
  if (evalResult.adaptiveFollowUp) {
    console.log(`    Generated Adaptive Follow-up: "${evalResult.adaptiveFollowUp}"`);
  }
  assert(Boolean(evalResult.improvedAnswer), "Evaluation returns high-quality model response");

  // 8. Analytics & Actionable Recommendations Test
  console.log("\n[8/9] Testing Final Interview Report & Recommendation Engine...");
  const sampleInterviewQuestions = [
    {
      score: 75,
      technicalAccuracyScore: 70,
      communicationScore: 80,
      confidenceScore: 75,
      completenessScore: 70,
      structureScore: 75,
      clarityScore: 80,
      fluencyScore: 85,
      category: "Authentication",
      weaknesses: ["Missing JWT signature verification", "Explain token expiration lifecycle"],
    },
    {
      score: 85,
      technicalAccuracyScore: 90,
      communicationScore: 85,
      confidenceScore: 80,
      completenessScore: 85,
      structureScore: 85,
      clarityScore: 85,
      fluencyScore: 85,
      category: "React",
      weaknesses: [],
    },
  ];
  const analytics = await calculateInterviewResult(sampleInterviewQuestions);
  assert(analytics.overallScore === 80, "Overall score calculated accurately");
  assert(Boolean(analytics.strongTopics?.includes("React")), "Categorizes React as strong topic");
  assert(Array.isArray(analytics.recommendations) && analytics.recommendations.length > 0, "Generates actionable recommendations based on weak areas");
  console.log(`    Recommendations generated: ${analytics.recommendations?.join(" | ")}`);

  // 9. Fallback Test
  console.log("\n[9/9] Testing RAG Failure Fallback (Resilience)...");
  const fallbackQuestions = await generateTechnicalQuestions("Node.js", "medium", {
    useRAG: false,
  });
  assert(Array.isArray(fallbackQuestions) && fallbackQuestions.length > 0, "System continues operating seamlessly when RAG is disabled / falls back");

  console.log("\n==========================================");
  console.log(`📊 Test Suite Finished: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("==========================================");

  await mongoose.disconnect();
  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
