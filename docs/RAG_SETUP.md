# Prepora RAG Setup Guide

This guide outlines setup requirements, MongoDB Atlas Vector Search index definitions, environment variables, and seeding commands for Prepora RAG.

---

## 1. MongoDB Atlas Configuration

- **Database Name**: `test`
- **Collection Name**: `ragdocuments`
- **Vector Search Index Name**: `rag_vector_index`
- **Vector Path**: `embedding`
- **Dimensions**: `768`
- **Similarity Metric**: `cosine`

### Atlas Vector Index Definition JSON

In your MongoDB Atlas Dashboard -> **Search & Vector Search** -> **Create Index** -> **JSON Editor**:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

---

## 2. Environment Variables Configuration

Ensure the following variables are present in your `.env.local` file:

```env
# MongoDB Connection URI (Atlas Cluster)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/Prepora?retryWrites=true&w=majority

# Google Generative AI (Gemini Embeddings)
GEMINI_API_KEY=your_gemini_api_key_here
EMBEDDING_MODEL=gemini-embedding-001

# Groq AI (LLaMA-3.3-70B Interviewer & Evaluator)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Cloudinary (Media Uploads for Audio/Video Interviews)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secrets
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

---

## 3. Seed Commands

To seed the initial curated knowledge base (covering 24 topics across JavaScript, React, TypeScript, Next.js, Node.js, Express, MongoDB, SQL, Redis, Docker, AWS, System Design, DSA, OOP, OS, Networks, and Evaluation Rubrics):

```bash
npm run seed:rag
```

Or run directly with `tsx`:
```bash
npx tsx scripts/seed-rag.ts
```

---

## 4. Automated Testing Commands

To run the automated RAG verification test suite:

```bash
npx tsx scripts/test-rag.ts
```

---

## 5. Development Server & Production Build

Run local development server:
```bash
npm run dev
```

Run production build validation:
```bash
npm run build
```
