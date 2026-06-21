import Groq from "groq-sdk";

/**
 * File Purpose:
 * This service simulates the execution of user-submitted code inside a sandboxed environment using Groq.
 * It traces variable states, logic branches, and runtime behavior for the given stdin inputs
 * and checks if the simulated stdout matches expected sample outputs, returning exit statuses,
 * stdout, and stderr formats.
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function runCode(
  language: string,
  code: string,
  input: string,
  expectedOutput?: string,
  questionDescription?: string
) {
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

  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1, // low temperature for precise code execution tracing
  });

  const text = result.choices[0].message.content || "";

  try {
    let parsed: any = null;
    let found = false;

    // First try standard codeblock matches
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        parsed = JSON.parse(codeBlockMatch[1].trim());
        found = true;
      } catch (_) {}
    }

    if (!found) {
      // Scan backward for a '{' that starts a valid JSON block
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