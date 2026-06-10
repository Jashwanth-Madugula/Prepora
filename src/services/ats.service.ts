import Groq from "groq-sdk";
import { parseResume } from "./resume-parser.service";

export interface ATSResult {
  score: number;
  suggestions: string[];
}

export function analyzeATS(
  parsedData: any
): ATSResult {

  let score = 0;

  const suggestions: string[] = [];

  if (
    parsedData.skills?.length >= 5
  ) {
    score += 20;
  } else {
    suggestions.push(
      "Add more relevant technical skills."
    );
  }

  if (
    parsedData.projects?.length > 0
  ) {
    score += 20;
  } else {
    suggestions.push(
      "Add at least one project."
    );
  }

  if (
    parsedData.education?.length > 0
  ) {
    score += 15;
  } else {
    suggestions.push(
      "Education section missing."
    );
  }

  if (
    parsedData.experience?.length > 0
  ) {
    score += 25;
  } else {
    suggestions.push(
      "Add internships or work experience."
    );
  }

  if (
    parsedData.certifications?.length > 0
  ) {
    score += 10;
  }

  if (
    parsedData.achievements?.length > 0
  ) {
    score += 10;
  }

  return {
    score,
    suggestions,
  };
}

export interface GeminiATSResult {
  score: number;
  suggestions: string[];
  keywordAnalysis: {
    matchedKeywords: string[];
    missingKeywords: string[];
    keywordDensity: string;
  };
}

export async function analyzeATSWithGroq(
  text: string
): Promise<GeminiATSResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API;
  if (!apiKey) {
    console.warn("GROQ_API_KEY / GROQ_API is not defined. Falling back to local ATS scoring.");
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
    return JSON.parse(responseText) as GeminiATSResult;
  } catch (error) {
    console.error("Groq ATS evaluation error:", error);
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
          missingKeywords: ["Next.js", "TypeScript", "Docker", "AWS", "MongoDB"].filter(
            k => !localParsed.skills?.some(s => s.toLowerCase() === k.toLowerCase())
          ),
          keywordDensity: `${Math.min(10, Math.round(((localParsed.skills?.length || 0) / (text.split(/\s+/).length || 1)) * 100))}%`,
        },
      };
    } catch (fallbackError) {
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