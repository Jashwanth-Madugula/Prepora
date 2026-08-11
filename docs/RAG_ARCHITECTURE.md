# Prepora RAG Architecture Specification

## Overview

Prepora incorporates a multi-source Retrieval-Augmented Generation (RAG) architecture engineered to ground mock interviews in factual technical standards, candidate resumes, and target job descriptions. This eliminates AI hallucinations, enforces consistent technical evaluation, and enables adaptive follow-up questioning based on detected missing concepts.

```
USER / CANDIDATE
       │
       ▼
Interview Configuration (Role, Difficulty, Type, Resume, JD)
       │
       ▼
RAG Multi-Source Query Builder
       │
   ┌───┴─────────────────────────────────────────────┐
   ▼                                                 ▼
MongoDB Atlas Vector Search ($vectorSearch)     Hybrid Keyword Boosting
   │ (768-dim Cosine Similarity)                     │
   └───────────────────┬─────────────────────────────┘
                       ▼
           Resilient Fallback Layer
       (In-Memory Cosine Similarity on failure)
                       │
                       ▼
            Context Builder & Sanitizer
    (Prompt Injection Defense & Token Truncation)
                       │
                       ▼
             Groq LLaMA-3.3-70B Engine
                       │
                       ▼
         Grounded Interview Questions
                       │
        Candidate Submits Answer (Text/Audio/Video)
                       │
                       ▼
       RAG Knowledge + Evaluation Rubric Retrieval
                       │
                       ▼
              AI Evaluation Engine
                       │
   ┌───────────────────┴─────────────────────────────┐
   ▼                                                 ▼
7-Dimensional Scoring                     Concept Coverage & Missing Concepts
(Accuracy, Communication, Confidence,                 │
 Completeness, Structure, Clarity, Fluency)           ▼
                                            Adaptive Follow-Up Generator
                                                      │
                                                      ▼
                                            Final Diagnostic Report
```

---

## 1. Data Sources & Metadata Model

All RAG documents are stored in the dedicated MongoDB collection:
- **Database**: `test`
- **Collection**: `ragdocuments`

### Document Schema
```typescript
interface IRagDocument {
  title: string;
  content: string;
  chunkIndex: number;
  embedding: number[]; // 768-dimensional float vector
  contentHash: string; // SHA-256 deterministic hash
  metadata: {
    type: "technical" | "interview" | "evaluation" | "resume" | "job-description";
    topic?: string;
    subtopic?: string;
    role?: string;
    difficulty?: "easy" | "medium" | "hard";
    experienceLevel?: string;
    userId?: ObjectId; // Strict candidate isolation
    resumeId?: ObjectId;
    jobDescriptionId?: ObjectId;
    interviewId?: ObjectId;
    source?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. Ingestion & Semantic Chunking

### Semantic Chunking (`chunking.service.ts`)
- **Chunk Size**: 800 - 1200 characters (default: 1000).
- **Overlap**: 120 - 200 characters (default: 150).
- **Paragraph & Boundary Awareness**: Splits at natural paragraph breaks (`\n\n`) and sentence delimiters (`. `, `? `, `! `). Preserves code snippets, numbered lists, and markdown headers.
- **Noise Cleanup**: Removes duplicate whitespace, control characters, and ignores trivial chunks under 100 characters.

### Hashing & Deduplication (`document.service.ts`)
- Computes SHA-256 hash `contentHash` on normalized content before generating embeddings.
- Existing chunks with identical hash and metadata are automatically skipped, protecting API rate limits and reducing unnecessary latency.

---

## 3. Dense Vector Embeddings (`embedding.service.ts`)

- **Provider**: Google Generative AI (`@google/generative-ai`)
- **Model**: `gemini-embedding-001` (configurable via `EMBEDDING_MODEL`)
- **Dimension**: `768` (matching MongoDB Atlas Vector Search index definition)
- **In-Memory Caching**: Caches recent query and chunk embeddings to prevent duplicate API calls.
- **Resilience**: Implements exponential backoff retry logic (3 attempts).

---

## 4. Hybrid Retrieval & Search Engine (`retrieval.service.ts`)

1. **Query Embedding**: Converts query into 768-dimensional dense vector.
2. **Atlas Vector Search**: Executes native hardware-accelerated `$vectorSearch` pipeline on MongoDB Atlas:
   ```json
   {
     "$vectorSearch": {
       "index": "rag_vector_index",
       "path": "embedding",
       "queryVector": [ ... ],
       "numCandidates": 60,
       "limit": 20
     }
   }
   ```
3. **Pipeline Post-Filtering**: Uses `$match` stages for metadata criteria (`type`, `topic`, `userId`, `resumeId`).
4. **Hybrid Keyword Boosting**: Adds an exact-term keyword overlap bonus (0.8 vector + 0.2 keyword) to boost exact framework/technology matches.
5. **In-Memory Fallback**: If Atlas vector index is unavailable or unindexed, automatically computes mathematical in-memory cosine similarity $\frac{A \cdot B}{\|A\| \|B\|}$ over filtered candidates.

---

## 5. Multi-Source Context Builder (`rag.service.ts` & `context.service.ts`)

When generating interview questions, RAG aggregates knowledge across:
1. **Candidate Resume**: Personal project context, stack, and past responsibilities.
2. **Job Description**: Mandatory skills and role expectations.
3. **Technical Base**: Verified technical facts, architectural trade-offs, and lifecycles.

### Source Priority Hierarchy
- **Candidate Facts**: Candidate Resume > Generic Knowledge
- **Job Expectations**: Job Description > Generic Knowledge
- **Technical Facts**: Technical Knowledge Base > Candidate Resume Wording

### Prompt Injection Protection
Retrieved context is encapsulated inside `<retrieved_reference_knowledge>` XML tags with explicit instructions stating that retrieved data is untrusted reference material and must not override interviewer instructions.

---

## 6. Grounded Question Generation & Diversity (`interview-ai.service.ts`)

- Generates 5 structured questions with nested follow-ups using Groq LLaMA-3.3-70B.
- Formulates questions directly from verified reference knowledge.
- Avoids repeating previous topics and questions from the interview history.
- Non-RAG fallback guarantees that if RAG is disabled or unavailable, standard question generation executes seamlessly.

---

## 7. Answer Evaluation & Adaptive Follow-Ups (`interview-evaluation.service.ts`)

- Evaluates candidate answers (Text, Audio transcripts, Video transcripts) against verified reference knowledge and evaluation rubrics.
- Grades 8 distinct dimensions:
  1. Technical Accuracy
  2. Concept Coverage (%)
  3. Communication
  4. Confidence
  5. Completeness
  6. Structure
  7. Clarity
  8. Fluency
- **Missing Concept Detection**: Identifies omitted essential concepts.
- **Adaptive Follow-Up Generation**: Retrieves technical knowledge for the top missing concept and generates a targeted follow-up question to test the candidate's understanding.

---

## 8. Security & User Isolation

- **Tenant Isolation**: Resume and Job Description chunks strictly require `metadata.userId` matching the authenticated JWT user. Cross-user retrieval is impossible.
- **Server-Only API Keys**: `GEMINI_API_KEY`, `GROQ_API_KEY`, and `MONGODB_URI` are never exposed to client browsers.
- **Sanitized Responses**: Raw embedding float vectors are never returned in client API responses.
