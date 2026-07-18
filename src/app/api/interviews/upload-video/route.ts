/**
 * @file src/app/api/interviews/upload-video/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.
 * 
 *
 * What problem it solves:
 * - Validates request inputs, manages rate-limiting rules, invokes business logic services, interacts with the database, and returns structured JSON responses and status codes to the frontend client.
 *
 * How it works internally:
 * - Exports async HTTP methods (GET, POST, PUT, DELETE, etc.) which parse query parameters or request body JSONs, connect to MongoDB using dbConnect(), verify permissions, and return NextResponse payloads.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { uploadVideoBuffer } from "@/services/cloudinary.service";
import { fileToBuffer } from "@/lib/file";

/**
 * POST /api/interviews/upload-video
 * Handles uploading webcam recordings from the frontend.
 * Converts the file to a buffer and uploads it to Cloudinary.
 *
 * FLOW:
 * 1. Frontend records video (with audio) as WebM blob.
 * 2. Frontend submits multipart form-data containing the video file.
 * 3. This route extracts the file, runs validation, and calls Cloudinary video uploader.
 * 4. Returns the secure web URL of the uploaded video.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Authenticate the user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Video file is required" },
        { status: 400 }
      );
    }

    // Convert file object to Buffer for stream processing
    const buffer = await fileToBuffer(file);
    const fileName = `video-${userId}-${Date.now()}`;

    // Upload buffer to Cloudinary (using video resource type)
    const uploadResult = await uploadVideoBuffer(buffer, fileName);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error("Video Upload API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload video file" },
      { status: 500 }
    );
  }
}

/**
 * FILE PURPOSE & HELP:
 * This API endpoint handles uploading video clips recorded by the user.
 * It is called directly from the frontend interview simulator components when a user completes
 * speaking their response to a question with the camera enabled. It streams the buffer to a secure
 * 'prepora/interviews/video' folder in Cloudinary and replies with the public secure URL, which is
 * subsequently stored in the question document.
 */
