/**
 * @file src/services/judge.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "judge.service.ts".
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
 * This service takes the user's submitted code, the chosen programming language, and the hidden test cases
 * of the coding question. It prompts the Groq SDK (Llama 3.3 model) to act as a FAANG interviewer and compiler,
 * tracing code logic against the test cases, predicting pass rates, analyzing Big-O space/time complexity,
 * and returning a structured summary.
 */

// Instantiate Groq client with API key loading
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

interface HiddenTestCase {
  input: string;
  expectedOutput: string;
}

/**
 * Evaluates candidate code submissions.
 * Checks code against hidden test cases and generates correctness, complexity, and styling reports.
 */
export async function judgeSubmission({
  language,
  code,
  testCases,
  questionDescription,
}: {
  language: string;
  code: string;
  testCases: HiddenTestCase[];
  questionDescription?: string;
}) {
  // Guard condition: if no test cases are specified, return empty structure
  if (!testCases || testCases.length === 0) {
    return {
      passed: 0,
      total: 0,
      results: [],
      predictedPassRate: 0,
      samplePassed: false,
      timeComplexity: "O(1)",
      spaceComplexity: "O(1)"
    };
  }

  // Format test case structures to pretty-printed strings for the AI prompt
  const testCasesText = JSON.stringify(testCases, null, 2);

  // Construct precise evaluation prompt for the model
  const prompt = `
You are a senior FAANG technical interviewer and compiler simulator.
Your job is to evaluate a candidate's code and grade it against a set of hidden test cases.

QUESTION DESCRIPTION:
${questionDescription || "Not provided."}

PROGRAMMING LANGUAGE:
${language}

CODE SOLUTION:
${code}

HIDDEN TEST CASES (JSON format):
${testCasesText}

Evaluate the code logic. Trace how the code handles each test case.
Determine if there are any edge cases that would fail, runtime failures, compile errors, or wrong outputs.
For each test case, output whether the code passes or fails, what output it produces, and if there is an error.

CRITICAL REVIEW INSTRUCTIONS:
- If the code passes ALL test cases (passed === total) and is correct and optimal, you MUST set "edgeCasesMissing" to [] and "improvements" to [], and set "finalComment" to "Your solution is optimal.". Do not suggest any hypothetical improvements or edge cases if the solution is correct and optimal.
- If the code has failures or can be optimized, provide standard constructive recommendations in "edgeCasesMissing", "improvements", and descriptive feedback in "finalComment".

Return ONLY a valid JSON object matching the following structure. Do not wrap in markdown or backticks.

{
  "passed": 3, // Total number of test cases passed
  "total": 4,  // Total number of test cases
  "results": [
    {
      "input": "input value",
      "expected": "expected output value",
      "actual": "what stdout this code would produce for this input",
      "passed": true, // true if actual output matches expected, false otherwise
      "error": "Error message if code crashed/threw exception for this case, else empty"
    }
  ],
  "predictedPassRate": 75, // Overall predicted percentage of cases passed (0-100)
  "samplePassed": true, // Whether it passes the standard basic cases
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "aiReview": {
    "correctness": 75, // score out of 100
    "codeQuality": 80, // score out of 100
    "edgeCasesMissing": ["e.g. empty inputs"], // Keep empty if optimal
    "strengths": ["e.g. linear time complexity"],
    "improvements": ["e.g. optimize recursion to iteration"], // Keep empty if optimal
    "finalComment": "Interviewer feedback summary comment."
  }
}
`;

  // Request Groq completions.
  // Use temperature = 0.1 for maximum determinism and logic stability.
  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1, // low temperature for precise code logic tracing
  });

  const text = result.choices[0].message.content || "";

  try {
    let parsed: any = null;
    let found = false;

    // Regex match to check if output is wrapped inside markdown code blocks (e.g. ```json ... ```)
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        parsed = JSON.parse(codeBlockMatch[1].trim());
        found = true;
      } catch (_) {}
    }

    // Fallback: Scan backward for a '{' that starts a valid JSON block if markdown match failed
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

    // Programmatically enforce: if the code passes all test cases (correct/optimal), clear out missing edge cases and improvements
    if (parsed && (parsed.predictedPassRate === 100 || parsed.passed === parsed.total)) {
      if (parsed.aiReview) {
        parsed.aiReview.edgeCasesMissing = [];
        parsed.aiReview.improvements = [];
        parsed.aiReview.finalComment = "Your solution is optimal.";
      }
    }

    return parsed;
  } catch (error) {
    console.error("JSON parsing error in AI judge service:", error, "\nRaw Response was:", text);
    
    // Return a structured default fallback report indicating evaluation failure
    const results = testCases.map(tc => ({
      input: tc.input,
      expected: tc.expectedOutput,
      actual: "AI grading failed to parse stdout.",
      passed: false,
      error: "AI Evaluation Timeout or Format Error"
    }));

    return {
      passed: 0,
      total: testCases.length,
      results,
      predictedPassRate: 0,
      samplePassed: false,
      timeComplexity: "Unable to calculate",
      spaceComplexity: "Unable to calculate",
      aiReview: {
        correctness: 0,
        codeQuality: 0,
        edgeCasesMissing: ["AI grading format error occurred."],
        strengths: ["Code submitted."],
        improvements: ["Check manual code review suggestions."],
        finalComment: "AI failed to compile standard JSON reviews."
      }
    };
  }
}