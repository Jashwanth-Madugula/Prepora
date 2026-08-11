/**
 * @file src/app/api/rag/documents/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Authenticated REST endpoint for ingesting, managing, and deleting RAG knowledge documents.
 * Enforces authentication, role authorization, and user data isolation.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createRagDocument, deleteRagDocumentsByFilter } from "@/services/rag/document.service";
import RagDocument from "@/models/rag-document.model";

/**
 * POST /api/rag/documents
 * Ingests a new document into RAG with chunking and embeddings.
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, content, metadata } = body;

    if (!title || !content || !metadata || !metadata.type) {
      return NextResponse.json(
        {
          success: false,
          error: "title, content, and valid metadata.type are required",
        },
        { status: 400 }
      );
    }

    // Authorization checks:
    // Technical/evaluation knowledge requires admin or dev privileges
    if (["technical", "interview", "evaluation"].includes(metadata.type)) {
      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Admin authorization required to ingest system knowledge" },
          { status: 403 }
        );
      }
    }

    // Resume / Job Description chunks must belong to the authenticated user
    if (["resume", "job-description"].includes(metadata.type)) {
      metadata.userId = user.userId;
    }

    const documents = await createRagDocument({
      title: title.trim(),
      content: content.trim(),
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: "Document successfully indexed into RAG",
      chunksCreated: documents.length,
    });
  } catch (error: any) {
    console.error("RAG document ingestion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to index document",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rag/documents
 * Deletes RAG documents matching specified filter criteria.
 */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as any;
    const resumeId = searchParams.get("resumeId");
    const jobDescriptionId = searchParams.get("jobDescriptionId");
    const topic = searchParams.get("topic");

    const filter: any = {};
    if (type) filter.type = type;

    // Users can only delete their own resume/JD chunks unless they are admins
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      filter.userId = user.userId;
    }

    if (resumeId) filter.resumeId = resumeId;
    if (jobDescriptionId) filter.jobDescriptionId = jobDescriptionId;
    if (topic) filter.topic = topic;

    const result = await deleteRagDocumentsByFilter(filter);

    return NextResponse.json({
      success: true,
      message: "RAG documents deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("RAG document delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete documents" },
      { status: 500 }
    );
  }
}