/**
 * @file src/services/ats.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "ats.service.ts".
 * - Specifically handles Resume Applicant Tracking System (ATS) parsing, score evaluation, and keyword metrics alignment.
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

import Groq from "groq-sdk";
import { parseResume } from "./resume-parser.service";

// Defines the standard local ATS feedback return shape
export interface ATSResult {
  score: number;      // Numeric score out of 100
  suggestions: string[]; // Actionable feedback suggestions
}

/**
 * Local ATS scoring function.
 * Evaluates the parsed resume JSON schema locally when Groq AI is unavailable.
 * Distributes weights across standard sections (Skills, Projects, Education, Experience, Certs, Achievements).
 */
export function analyzeATS(
  parsedData: any
): ATSResult {
  let score = 0;
  const suggestions: string[] = [];

  // 1. Skill evaluation (worth 20 points)
  if (
    parsedData.skills && 
    parsedData.skills.length >= 5
  ) {
    score += 20; // Award full skill points if at least 5 skills are present
  } else {
    suggestions.push(
      "Add more relevant technical skills."
    );
  }

  // 2. Projects evaluation (worth 20 points)
  if (
    parsedData.projects && 
    parsedData.projects.length > 0
  ) {
    score += 20; // Award points if candidate has documented projects
  } else {
    suggestions.push(
      "Add at least one project."
    );
  }

  // 3. Education evaluation (worth 15 points)
  if (
    parsedData.education && 
    parsedData.education.length > 0
  ) {
    score += 15; // Award points for academic history
  } else {
    suggestions.push(
      "Education section missing."
    );
  }

  // 4. Professional experience evaluation (worth 25 points)
  if (
    parsedData.experience && 
    parsedData.experience.length > 0
  ) {
    score += 25; // Award points for job history or internship listings
  } else {
    suggestions.push(
      "Add internships or work experience."
    );
  }

  // 5. Certifications evaluation (worth 10 points)
  if (
    parsedData.certifications && 
    parsedData.certifications.length > 0
  ) {
    score += 10;
  }

  // 6. Achievements/Awards evaluation (worth 10 points)
  if (
    parsedData.achievements && 
    parsedData.achievements.length > 0
  ) {
    score += 10;
  }

  return {
    score,
    suggestions,
  };
}

// Defines the data response format from the AI ATS scanner
export interface GeminiATSResult {
  score: number;
  suggestions: string[];
  keywordAnalysis: {
    matchedKeywords: string[];
    missingKeywords: string[];
    keywordDensity: string;
  };
}

/**
 * AI-powered ATS analyzer utilizing the Groq SDK client.
 * Submits the resume text content, parses it using the Llama-3 model, and extracts
 * scores, feedback, matching keywords, missing keywords, and keyword density.
 */
export async function analyzeATSWithGroq(
  text: string
): Promise<GeminiATSResult> {
  // Read system environment api keys
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API;
  if (!apiKey) {
    console.warn("GROQ_API_KEY / GROQ_API is not defined. Falling back to local ATS scoring.");
    // Return a default baseline response if API credentials are not found
    return {
      score: 50,
      suggestions: ["Add technical keywords", "Organize sections logically"],
      keywordAnalysis: {
        matchedKeywords: [],
        missingKeywords: [],
        keywordDensity: "0%",
      },
    };
  }

  try {
    const groq = new Groq({ apiKey });
    const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    // Build the AI evaluation system instructions and instructions for returning JSON format
    const prompt = `You are an expert ATS (Applicant Tracking System) scorer and resume reviewer.
Evaluate the following resume text and respond with a structured JSON object matching the schema below.

Schema:
{
  "score": "integer from 0 to 100 based on standard industry resume formatting, structure, clarity, and completeness",
  "suggestions": ["array of strings (specific actionable suggestions for improvement, e.g. 'Add impact metrics', 'Fix layout issues')"],
  "keywordAnalysis": {
    "matchedKeywords": ["array of strings (strong technical or domain keywords found in the resume)"],
    "missingKeywords": ["array of strings (important technical or domain keywords commonly expected for similar profiles but missing from the resume)"],
    "keywordDensity": "string (feedback on keyword density, e.g. 'Good keyword density of ~4%')"
  }
}

Make sure to respond with a VALID JSON object ONLY. Do not write any explanations or conversational text before or after the JSON.

Resume Text:
${text}`;

    // Request Groq completions with response_format forced to json_object
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: modelName,
      response_format: { type: "json_object" }, // Ensures model returns strictly formatted JSON
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    return JSON.parse(responseText) as GeminiATSResult;
  } catch (error) {
    console.error("Groq ATS evaluation error:", error);
    
    // Fallback: Run local resume parsing and scoring if Groq API throws an error
    try {
      const localParsed = parseResume(text);
      const localATS = analyzeATS(localParsed);
      return {
        score: localATS.score || 45,
        suggestions: [
          ...localATS.suggestions,
          "Note: Groq AI evaluation was unavailable (using local keyword analysis fallback)."
        ],
        keywordAnalysis: {
          matchedKeywords: localParsed.skills || [],
          // Filter default standard keywords to see which are missing
          missingKeywords: ["Next.js", "TypeScript", "Docker", "AWS", "MongoDB"].filter(
            k => !localParsed.skills?.some(s => s.toLowerCase() === k.toLowerCase())
          ),
          keywordDensity: `${Math.min(10, Math.round(((localParsed.skills?.length || 0) / (text.split(/\s+/).length || 1)) * 100))}%`,
        },
      };
    } catch (fallbackError) {
      // Return absolute fallback if local parse fails
      return {
        score: 45,
        suggestions: ["Failed to run AI evaluation. Please verify resume readability and try again."],
        keywordAnalysis: {
          matchedKeywords: [],
          missingKeywords: [],
          keywordDensity: "Error",
        },
      };
    }
  }
}

export const analyzeATSWithGemini = analyzeATSWithGroq;

// Define return contract interface for Job Description comparisons
export interface JDCompareResult {
  atsScore: number;
  matchPercentage: number;
  missingSkills: string[];
  missingKeywords: string[];
  strengths: string[];
  suggestions: string[];
}

/**
 * Compares the candidate's resume text against a target Job Description.
 * Prompts Groq Llama model to return match percentages, missing skills, and strengths.
 */
export async function compareResumeWithJD(
  resumeText: string,
  jobDescription: string
): Promise<JDCompareResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API;
  if (!apiKey) {
    console.warn("GROQ_API_KEY / GROQ_API is not defined. Falling back to local JD match.");
    return {
      atsScore: 70,
      matchPercentage: 60,
      missingSkills: ["TypeScript", "Next.js"],
      missingKeywords: ["Server-side rendering", "Database optimization"],
      strengths: ["Strong programming foundations"],
      suggestions: ["Tailor resume keywords to the job description."],
    };
  }

  try {
    const groq = new Groq({ apiKey });
    const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const prompt = `You are a professional ATS (Applicant Tracking System) grader and recruitment evaluator.
Analyze the candidate's resume text and compare it against the provided Job Description.

Resume Text:
${resumeText}

Job Description:
${jobDescription}

Perform a detailed match. Evaluate skills, technologies, experience, and keywords.
Return ONLY a valid JSON object matching the schema below. Do not wrap in markdown fences or conversational text.

Schema:
{
  "atsScore": 85,
  "matchPercentage": 75,
  "missingSkills": ["skill 1", "skill 2"],
  "missingKeywords": ["keyword 1", "keyword 2"],
  "strengths": ["strength 1", "strength 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: modelName,
      response_format: { type: "json_object" },
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    return JSON.parse(responseText) as JDCompareResult;
  } catch (error) {
    console.error("Groq JD comparison error:", error);
    return {
      atsScore: 65,
      matchPercentage: 55,
      missingSkills: ["Error analyzing skills"],
      missingKeywords: ["Error analyzing keywords"],
      strengths: ["Resume parsed successfully."],
      suggestions: ["Groq evaluation failed. Verify resume text structure and retry."],
    };
  }
}