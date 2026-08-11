/**
 * @file src/app/api/resumes/[id]/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.
 *
 * What problem it solves:
 * - Validates request inputs, manages rate-limiting rules, invokes business logic services, interacts with the database, and returns structured JSON responses and status codes to the frontend client.
 *
 * How it works internally:
 * - Exports async HTTP methods (GET, POST, PUT, DELETE, etc.) which parse query parameters or request body JSONs, connect to MongoDB using dbConnect(), verify permissions, and return NextResponse payloads.
 */

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Resume } from "@/models/Resume";
import { deleteResumeFromCloudinary } from "@/services/cloudinary.service";
import { deleteRagDocumentsByFilter } from "@/services/rag/document.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await dbConnect();

    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid resume id",
        },
        {
          status: 400,
        }
      );
    }

    const resume = await Resume.findOne({
      _id: id,
      userId,
    });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          message: "Resume not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error("Get Resume Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch resume",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await dbConnect();

    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid resume id",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const { title, isDefault } = body;

    const resume = await Resume.findOne({
      _id: id,
      userId,
    });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          message: "Resume not found",
        },
        {
          status: 404,
        }
      );
    }

    if (typeof title === "string") {
      resume.title = title.trim();
    }

    if (isDefault === true) {
      await Resume.updateMany(
        { userId },
        {
          $set: {
            isDefault: false,
          },
        }
      );

      resume.isDefault = true;
    }

    await resume.save();

    return NextResponse.json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error("Update Resume Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update resume",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await dbConnect();

    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid resume id",
        },
        { status: 400 }
      );
    }

    const resume = await Resume.findOne({
      _id: id,
      userId,
    });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          message: "Resume not found",
        },
        { status: 404 }
      );
    }

    const wasDefault = resume.isDefault;

    await deleteResumeFromCloudinary(resume.cloudinaryPublicId);

    // Delete associated RAG documents
    try {
      await deleteRagDocumentsByFilter({
        userId,
        resumeId: resume._id,
      });
    } catch (ragCleanErr: any) {
      console.warn("Failed to clean resume RAG chunks on deletion:", ragCleanErr?.message);
    }

    await Resume.deleteOne({
      _id: resume._id,
    });

    if (wasDefault) {
      const nextResume = await Resume.findOne({
        userId,
      }).sort({
        createdAt: -1,
      });

      if (nextResume) {
        nextResume.isDefault = true;
        await nextResume.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Delete Resume Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete resume",
      },
      {
        status: 500,
      }
    );
  }
}