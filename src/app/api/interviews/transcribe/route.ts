/**
 * @file src/app/api/interviews/transcribe/route.ts
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
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/interviews/transcribe
 * Accepts an audio URL, fetches the media content, saves it locally as a temp file,
 * and calls the Groq Whisper Speech-to-Text API to return a text transcript.
 *
 * FLOW:
 * 1. Frontend provides audioUrl (pointing to Cloudinary).
 * 2. Route fetches the file buffer from Cloudinary.
 * 3. Buffer is written to a temporary workspace directory (src/temp).
 * 4. Temporary stream is fed to Groq's whisper-large-v3 transcription service.
 * 5. Temp file is unlinked immediately in a finally block.
 * 6. Returns `{ success: true, transcript }`.
 */
export async function POST(request: NextRequest) {
  let tempFilePath = "";
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

    const body = await request.json();
    const { audioUrl } = body;

    if (!audioUrl) {
      return NextResponse.json(
        { success: false, message: "Audio URL is required" },
        { status: 400 }
      );
    }

    // Download audio file from Cloudinary URL
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio from source: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare temp folder inside OS temporary directory
    const tempDir = os.tmpdir();

    tempFilePath = path.join(tempDir, `transcribe-${userId}-${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, buffer);

    // Call Groq Whisper service
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3",
      response_format: "json",
    });

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
    });
  } catch (error: any) {
    console.error("Transcription Route Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to transcribe audio file" },
      { status: 500 }
    );
  } finally {
    // Ensure cleanup of the temporary file in all conditions
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error("Failed to delete temp file:", cleanupError);
      }
    }
  }
}

/**
 * FILE PURPOSE & HELP:
 * This endpoint leverages the Groq SDK to transcribe spoken speech answers back to plain text.
 * Whisper-large-v3 provides lightning fast, near-zero cost speech-to-text accuracy.
 * Using a local temp folder inside the workspace conforms to anti-sandbox security rules, and
 * the finally cleanup ensures there are no lingering audio leaks on the server disk.
 */
