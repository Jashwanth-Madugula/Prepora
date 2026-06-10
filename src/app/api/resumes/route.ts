import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Resume, ResumeStatus } from "@/models/Resume";
import { getCurrentUserId } from "@/lib/auth";
import { validateResumeFile } from "@/lib/resume-validation";
import { uploadResumeBuffer } from "@/services/cloudinary.service";
import { fileToBuffer } from "@/lib/file";
import {
  extractPdfText,
} from "@/services/pdf-parser.service";
import {
  parseResumeWithGroq,
} from "@/services/resume-parser.service";
import {
  analyzeATSWithGroq,
} from "@/services/ats.service";

export async function POST(
  request: NextRequest
) {
  try {
    await dbConnect();

    const userId =
      await getCurrentUserId();

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

    const formData =
      await request.formData();

    const file =
      formData.get(
        "file"
      ) as File;

    const title =
      formData.get(
        "title"
      ) as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resume file is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title is required",
        },
        {
          status: 400,
        }
      );
    }

    validateResumeFile(file);

    const buffer =
      await fileToBuffer(
        file
      );

    const parsedText =
      await extractPdfText(
        buffer
      );

    // Call Groq parser and ATS analyzer
    const parsedData = await parseResumeWithGroq(parsedText);
    const atsResult = await analyzeATSWithGroq(parsedText);

    const uploadResult =
      await uploadResumeBuffer(
        buffer,
        `resume-${Date.now()}`
      );

    const resumeCount =
      await Resume.countDocuments({
        userId,
      });

    const resume =
      await Resume.create({
        userId,

        title,

        originalFileName:
          file.name,

        fileUrl:
          (
            uploadResult as any
          ).secure_url,

        cloudinaryPublicId:
          (
            uploadResult as any
          ).public_id,

        fileSize:
          file.size,

        mimeType:
          file.type,

        isDefault:
          resumeCount === 0,

        status: ResumeStatus.ANALYZED,
        parsedText,
        parsedData,
        atsScore: atsResult.score,
        atsSuggestions: atsResult.suggestions,
        atsKeywordsMatched: atsResult.keywordAnalysis?.matchedKeywords || [],
        atsKeywordsMissing: atsResult.keywordAnalysis?.missingKeywords || [],
        atsKeywordDensity: atsResult.keywordAnalysis?.keywordDensity || "",
        atsAnalyzedAt: new Date(),
      });

    return NextResponse.json(
      {
        success: true,
        resume,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Resume Upload Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to upload resume",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();

    const userId =
      await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const resumes =
      await Resume.find({
        userId,
      })
        .sort({
          isDefault: -1,
          createdAt: -1,
        })
        .select(
          "-parsedText"
        );

    return NextResponse.json(
      {
        success: true,
        count:
          resumes.length,

        resumes,
      }
    );
  } catch (error) {
    console.error(
      "Get Resumes Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch resumes",
      },
      {
        status: 500,
      }
    );
  }
}