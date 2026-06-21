import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import Groq from "groq-sdk";

/**
 * File Purpose:
 * This API endpoint handles POST requests to generate dynamic AI Hints for a coding question.
 * It reads the question details and candidate's draft code, calls the Groq SDK,
 * and outputs a supportive hint (e.g. suggesting data structures like HashMaps, or pointing out index boundary issues)
 * without revealing the actual complete solution code.
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { question, code, language } = await req.json();

    if (!question) {
      return NextResponse.json({ success: false, error: "Question details are required" }, { status: 400 });
    }

    const prompt = `
You are a supportive technical mentor.
A student is trying to solve a coding interview question, but they are stuck.
Provide a concise, helpful hint to guide them in the right direction.
DO NOT reveal the full solution or output code blocks that solve the problem.

QUESTION DETAILS:
${question}

LANGUAGE:
${language || "unknown"}

STUDENT'S CURRENT DRAFT CODE:
${code || "// No code written yet"}

Return your hint in clear, easy-to-read markdown format. Give 1 or 2 high-level clues (e.g., suggesting a HashMap, checking base cases, or talking about slow/fast pointers).
`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const hint = result.choices[0].message.content || "No hint could be generated at this time.";

    return NextResponse.json({
      success: true,
      hint,
    });
  } catch (error: any) {
    console.error("AI Hint API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate hint" }, { status: 500 });
  }
}
