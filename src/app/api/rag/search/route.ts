/**
 * @file src/app/api/rag/search/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Authenticated REST endpoint for querying RAG vector and keyword search.
 * Useful for development testing, inspection, and intelligent assistance retrieval.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { retrieveRelevantChunks } from "@/services/rag/retrieval.service";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      query,
      limit = 5,
      minScore = 0.35,
      type,
      topic,
      role,
      difficulty,
      resumeId,
      jobDescriptionId,
    } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "query string is required" },
        { status: 400 }
      );
    }

    const chunks = await retrieveRelevantChunks(query.trim(), {
      limit: Math.min(limit, 20),
      minScore,
      type,
      topic,
      role,
      difficulty,
      userId,
      resumeId,
      jobDescriptionId,
    });

    return NextResponse.json({
      success: true,
      query: query.trim(),
      count: chunks.length,
      results: chunks,
    });
  } catch (error: any) {
    console.error("RAG search endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute RAG search",
      },
      { status: 500 }
    );
  }
}
