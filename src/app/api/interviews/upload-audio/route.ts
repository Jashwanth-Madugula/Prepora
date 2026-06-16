import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { uploadAudioBuffer } from "@/services/cloudinary.service";
import { fileToBuffer } from "@/lib/file";

/**
 * POST /api/interviews/upload-audio
 * Handles uploading audio recordings from the frontend.
 * Converts the file to a buffer and uploads it to Cloudinary.
 *
 * FLOW:
 * 1. Frontend records audio as WebM blob.
 * 2. Frontend submits multipart form-data containing the audio file.
 * 3. This route extracts the file, runs validation, and calls Cloudinary uploader.
 * 4. Returns the secure web URL of the uploaded audio.
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
        { success: false, message: "Audio file is required" },
        { status: 400 }
      );
    }

    // Convert file object to Buffer for stream processing
    const buffer = await fileToBuffer(file);
    const fileName = `audio-${userId}-${Date.now()}`;

    // Upload buffer to Cloudinary
    const uploadResult = await uploadAudioBuffer(buffer, fileName);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error("Audio Upload API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload audio file" },
      { status: 500 }
    );
  }
}

/**
 * FILE PURPOSE & HELP:
 * This API endpoint handles uploading audio clips recorded by the user.
 * It is called directly from the frontend interview simulator components when a user completes
 * speaking their response to a question. It streams the buffer to a secure 'prepora/interviews/audio'
 * folder in Cloudinary and replies with the public secure URL, which is subsequently used for transcription and scoring.
 */
