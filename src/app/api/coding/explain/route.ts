/**
 * @file src/app/api/coding/explain/route.ts
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
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import Groq from "groq-sdk";

/**
 * File Purpose:
 * This API endpoint handles POST requests to generate a detailed explanation of the candidate's code.
 * It inputs the code and language, queries Groq Llama, and returns a detailed markdown explanation.
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

    const { code, language } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Code content is required" }, { status: 400 });
    }

    const prompt = `
You are a senior software engineering mentor.
Explain the following code snippet line-by-line or section-by-section.
Provide insights into what each block is doing, why it is done that way, and how variables are modified.

LANGUAGE:
${language || "unknown"}

CODE CODE SNIPPET:
${code}

Return your explanation in clear, well-formatted markdown, suitable for showing on a web dashboard.
`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
    });

    const explanation = result.choices[0].message.content || "No explanation could be generated at this time.";

    return NextResponse.json({
      success: true,
      explanation,
    });
  } catch (error: any) {
    console.error("AI Code Explanation API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to explain code" }, { status: 500 });
  }
}
