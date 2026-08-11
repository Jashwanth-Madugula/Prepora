# Prepora RAG Testing & Verification Guide

This document details how to verify each layer of the Prepora RAG implementation.

---

## 1. Automated Test Suite

Run the full automated test suite:
```bash
npx tsx scripts/test-rag.ts
```

### Verified Test Cases:
1. **Semantic Chunking**: Splits large documents into overlapping semantic paragraphs (preserving code/headers).
2. **Embedding Generation**: Verifies 768-dimensional dense vectors from `gemini-embedding-001`.
3. **Hybrid Retrieval**: Queries for JWT, React Reconciliation, MongoDB indexing, and Redis caching.
4. **Context Construction**: Verifies formatted reference headers and safety boundaries.
5. **Candidate Data Isolation (Security)**: Verifies that User B cannot retrieve User A's private resume data.
6. **Technical Question Generation**: Generates structured questions grounded in RAG technical context.
7. **Answer Evaluation & Missing Concept Detection**: Evaluates partial answers, identifies missing concepts, and generates adaptive follow-ups.
8. **Final Analytics & Recommendations**: Aggregates 7 metrics, concept coverage, and actionable recommendations.
9. **Resilience & Fallback**: Simulates RAG failure and verifies uninterrupted interview flow.

---

## 2. API Endpoint Testing

### A. Document Ingestion (`POST /api/rag/documents`)
```bash
curl -X POST http://localhost:3000/api/rag/documents \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=<your_access_token>" \
  -d '{
    "title": "GraphQL Basics",
    "content": "GraphQL is a query language for APIs providing declarative data fetching.",
    "metadata": {
      "type": "technical",
      "topic": "GraphQL",
      "difficulty": "medium"
    }
  }'
```

### B. Vector Search Query (`POST /api/rag/search`)
```bash
curl -X POST http://localhost:3000/api/rag/search \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=<your_access_token>" \
  -d '{
    "query": "How does Redis handle eviction?",
    "limit": 3
  }'
```

---

## 3. End-to-End User Flow Verification

1. **Resume Upload**: Upload a PDF resume in **Resume Manager** (`/resumes`). Verify resume is parsed and auto-indexed into `ragdocuments` with `type: "resume"`.
2. **Mock Interview Setup**: Navigate to **Mock Interviews** (`/dashboard/interviews`) -> Click **Start Mock Interview** -> Select **Technical** or **Resume-Based**.
3. **Conduct Interview**:
   - Answer Question 1 via **Text**, Question 2 via **Audio**, Question 3 via **Video**.
   - Submit and observe real-time AI evaluation scorecard:
     - Technical Accuracy, Communication, Confidence, Completeness, Structure, Clarity, Fluency.
     - Concept Coverage & Missing Concepts list.
     - Adaptive Follow-Up Question banner.
4. **Finalize Session**: Click **Finish Interview & View Report** to view the aggregated diagnostic scorecard, strong/weak areas, and specific actionable recommendations.
