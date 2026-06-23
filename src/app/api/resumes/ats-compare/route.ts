import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { Resume } from "@/models/Resume";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import { compareResumeWithJD } from "@/services/ats.service";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Verify User Authentication
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request payload
    const body = await req.json().catch(() => ({}));
    const { resumeId, jobDescription } = body;

    if (!resumeId || !jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { success: false, error: "Resume ID and Job Description text are required" },
        { status: 400 }
      );
    }

    // 3. Find and verify resume ownership
    const resume = await Resume.findOne({ _id: resumeId, userId: payload.userId });
    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found or access denied" },
        { status: 404 }
      );
    }

    // 4. Extract resume content to feed Groq comparison
    // Use parsedText if available, otherwise compile from parsedData as a fallback
    let textToEvaluate = resume.parsedText || "";
    if (!textToEvaluate && resume.parsedData) {
      const data = resume.parsedData;
      textToEvaluate = `
        Name: ${data.name || ""}
        Email: ${data.email || ""}
        Phone: ${data.phone || ""}
        Skills: ${(data.skills || []).join(", ")}
        Education: ${(data.education || []).join(" | ")}
        Projects: ${(data.projects || []).join(" | ")}
        Experience: ${(data.experience || []).join(" | ")}
        Certifications: ${(data.certifications || []).join(" | ")}
        Achievements: ${(data.achievements || []).join(" | ")}
      `;
    }

    if (!textToEvaluate.trim()) {
      return NextResponse.json(
        { success: false, error: "Resume content is empty. Please upload a readable resume PDF." },
        { status: 400 }
      );
    }

    // 5. Run AI Job Description ATS grading
    const result = await compareResumeWithJD(textToEvaluate.trim(), jobDescription.trim());

    // 6. Save comparison results directly in the Resume document
    resume.jdText = jobDescription.trim();
    resume.jdMatchPercentage = result.matchPercentage;
    resume.jdMissingSkills = result.missingSkills;
    resume.jdMissingKeywords = result.missingKeywords;
    resume.jdStrengths = result.strengths;
    resume.jdSuggestions = result.suggestions;
    
    // Also update general atsScore if the comparison returns a higher layout value
    if (result.atsScore && result.atsScore > (resume.atsScore || 0)) {
      resume.atsScore = result.atsScore;
    }

    await resume.save();

    return NextResponse.json({
      success: true,
      message: "Job Description comparison completed successfully",
      comparison: {
        atsScore: result.atsScore,
        matchPercentage: result.matchPercentage,
        missingSkills: result.missingSkills,
        missingKeywords: result.missingKeywords,
        strengths: result.strengths,
        suggestions: result.suggestions,
      },
      resume,
    });
  } catch (error: any) {
    console.error("POST ats-compare error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compare resume with job description" },
      { status: 500 }
    );
  }
}
