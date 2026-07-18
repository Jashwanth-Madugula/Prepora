/**
 * @file src/services/code-runner.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "code-runner.service.ts".
 * - Specifically handles compilation, remote sandbox code execution, code editor configuration, and automated AI reviews.
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

import Groq from "groq-sdk";

/**
 * File Purpose:
 * This service simulates the execution of user-submitted code inside a sandboxed environment using Groq.
 * It traces variable states, logic branches, and runtime behavior for the given stdin inputs
 * and checks if the simulated stdout matches expected sample outputs, returning exit statuses,
 * stdout, and stderr formats.
 */

// Initialize Groq API client with API Key check
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

/**
 * Runs user code via simulated LLM compilation and tracing.
 * Receives code, programming language, inputs, target expected outputs, and details.
 */
export async function runCode(
  language: string,
  code: string,
  input: string,
  expectedOutput?: string,
  questionDescription?: string
) {
  // Craft compile trace prompt detailing the context and input specifications
  const prompt = `
You are an advanced sandboxed AI compiler and code execution runner.
Your task is to trace and simulate the execution of the user-provided code for the given stdin input.

QUESTION DESCRIPTION:
${questionDescription || "Not provided."}

PROGRAMMING LANGUAGE:
${language}

CODE SOLUTION:
${code}

STDIN INPUT VALUE(S):
${input || "None"}

EXPECTED OUTPUT (stdout):
${expectedOutput || "None"}

Trace the execution of this code. Watch out for infinite loops, runtime crashes, syntax errors, or compiler mismatches.
Compute the exact stdout (standard output) text, and stderr (standard error or compiler errors) text.

Return ONLY a valid JSON object matching the following structure. Do not include markdown formatting or backticks.

{
  "stdout": "The exact stdout that running this code would produce. Print blank if compilation/runtime error occurs.",
  "stderr": "The exact compiler or runtime error description if the code crashes or has compile-time syntax errors. Print blank if execution succeeds.",
  "exitCode": 0, // 0 for success, 1 for compilation or runtime crash
  "samplePassed": true // set to true if stdout matches expectedOutput (ignoring trailing whitespaces/newlines), false otherwise.
}
`;

  // Submit trace call to Groq model. 
  // We use temperature = 0.1 to get the most deterministic output possible.
  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1, // Low temperature for precise code execution tracing
  });

  const text = result.choices[0].message.content || "";

  try {
    let parsed: any = null;
    let found = false;

    // First try standard codeblock matches: check if response has ```json ... ``` tags
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        parsed = JSON.parse(codeBlockMatch[1].trim());
        found = true;
      } catch (_) {}
    }

    // Fallback: Scan backward for a '{' that starts a valid JSON block if markdown regex failed
    if (!found) {
      for (let i = text.length - 1; i >= 0; i--) {
        if (text[i] === "{") {
          const candidate = text.substring(i);
          const endBrace = candidate.lastIndexOf("}");
          if (endBrace !== -1) {
            const jsonStr = candidate.substring(0, endBrace + 1);
            try {
              parsed = JSON.parse(jsonStr);
              found = true;
              break;
            } catch (_) {}
          }
        }
      }
    }

    if (!found || !parsed) {
      throw new Error("Could not find a valid JSON object in Groq response.");
    }

    // Determine error flags based on simulated exitCode and stderr text
    const isError = parsed.exitCode !== 0 || !!parsed.stderr;

    return {
      run: {
        stdout: parsed.stdout || "",
        stderr: isError ? parsed.stderr || "Runtime Error" : "",
      },
      compile: {
        stderr: isError ? parsed.stderr || "Compilation Error" : "",
      },
      samplePassed: !!parsed.samplePassed,
    };
  } catch (error) {
    // Log errors and return standardized compile/execution failures
    console.error("JSON parsing error of Groq simulation response:", error, "\nRaw Response was:", text);
    return {
      run: {
        stdout: "",
        stderr: "AI Execution Error: Failed to parse code simulation results.",
      },
      compile: {
        stderr: "AI Compilation Error: Failed to compile simulation results.",
      },
      samplePassed: false,
    };
  }
}