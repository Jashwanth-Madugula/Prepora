import { NextResponse } from "next/server";
import { runCode } from "@/services/code-runner.service";
import CodingQuestion from "@/models/coding-question.model";
import { dbConnect } from "@/lib/db";

/**
 * File Purpose:
 * This API endpoint handles POST requests to run drafting code.
 * It takes code, language, optional stdin input, and optional questionId.
 * It queries MongoDB for the question description and expected sample outputs,
 * and calls the Groq compiler simulator to trace code execution.
 */

export async function POST(req: Request) {
  try {
    const { language, code, input, questionId } = await req.json();

    if (!language || !code) {
      return NextResponse.json(
        { success: false, error: "Language and code are required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    let questionDesc = "";
    let expectedOutput = "";

    if (questionId) {
      const question = await CodingQuestion.findById(questionId);
      if (question) {
        questionDesc = question.description;
        // Search examples for a matching input to check output correctness
        const matchingExample = question.examples?.find(
          (ex: any) => ex.input.trim() === input.trim()
        );
        if (matchingExample) {
          expectedOutput = matchingExample.output;
        }
      }
    }

    const result = await runCode(language, code, input || "", expectedOutput, questionDesc);

    return NextResponse.json({
      success: true,
      output: result.run.stdout,
      error: result.run.stderr || undefined,
      samplePassed: result.samplePassed,
    });
  } catch (err: any) {
    console.error("Run code API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute code" },
      { status: 500 }
    );
  }
}