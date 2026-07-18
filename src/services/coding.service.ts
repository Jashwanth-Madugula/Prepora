/**
 * @file src/services/coding.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "coding.service.ts".
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
 * This service uses the Groq SDK to request the Llama 3.3 70B model to generate a custom,
 * high-quality coding interview question based on the selected difficulty (easy, medium, hard).
 * It requests structured output containing problem statements, constraints, sample test cases,
 * hidden test cases, and starter code templates for Javascript, Python, C++, C, and Java.
 * It also cleans and parses the generated JSON reliably.
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function generateCodingQuestion(difficulty: string, topic?: string, company?: string) {
  const normalizedDifficulty = difficulty.toLowerCase() as "easy" | "medium" | "hard";

  let specificContext = "";
  if (topic) {
    specificContext += `The question MUST be based on the Data Structures and Algorithms (DSA) topic: "${topic}".\n`;
  }
  if (company) {
    specificContext += `The question structure, style, and complexity MUST match those frequently asked in tech interview rounds at the company: "${company}".\n`;
  }

  const prompt = `
You are a senior software engineer and technical interviewer at a FAANG company.
Generate ONE high-quality coding interview question of difficulty "${normalizedDifficulty}".
${specificContext}
The question should be suitable for online compiler testing using standard input/output.
Provide a complete JSON object matching the following structure:

{
  "title": "Short Descriptive Title",
  "description": "Clear problem statement. Describe the problem, the required logic, the input format, and the output format. Ensure the user knows how their program will receive input (from stdin) and how they must print output (to stdout).",
  "difficulty": "${normalizedDifficulty}",
  "topic": "${topic || "Topic category, e.g. Arrays, Strings, Sorting, Stack, Dynamic Programming"}",
  "constraints": [
    "e.g. 1 <= N <= 10^5",
    "e.g. -10^9 <= arr[i] <= 10^9"
  ],
  "examples": [
    {
      "input": "Sample input value(s)",
      "output": "Sample output value(s)",
      "explanation": "Brief explanation of how the sample input results in the sample output."
    }
  ],
  "hiddenTestCases": [
    {
      "input": "Hidden input 1",
      "expectedOutput": "Expected output 1"
    },
    {
      "input": "Hidden input 2",
      "expectedOutput": "Expected output 2"
    },
    {
      "input": "Hidden input 3",
      "expectedOutput": "Expected output 3"
    },
    {
      "input": "Hidden input 4",
      "expectedOutput": "Expected output 4"
    }
  ],
  "starterCode": {
    "javascript": "// Starter code for JavaScript (Node.js)\\n// Read from stdin, process, write to stdout\\nconst fs = require('fs');\\nfunction solve() {\\n  const input = fs.readFileSync(0, 'utf-8').trim();\\n  if (!input) return;\\n  // Write your code here\\n}\\nsolve();",
    "python": "# Starter code for Python 3\\n# Read from stdin, process, write to stdout\\nimport sys\\ndef solve():\\n    lines = sys.stdin.read().split()\\n    if not lines:\\n        return\\n    # Write your code here\\n\\nif __name__ == '__main__':\\n    solve()",
    "cpp": "// Starter code for C++\\n#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    ios_base::sync_with_stdio(false);\\n    cin.tie(NULL);\\n    // Write your code here\\n    return 0;\\n}",
    "c": "// Starter code for C\\n#include <stdio.h>\\n\\nint main() {\\n    // Write your code here\\n    return 0;\\n}",
    "java": "// Starter code for Java\\n// MUST use class Main\\nimport java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner scanner = new Scanner(System.in);\\n        // Write your code here\\n    }\\n}"
  },
  "timeLimit": 1,
  "memoryLimit": 256
}

CRITICAL REQUIREMENT:
The generated templates inside 'starterCode' MUST ONLY contain the empty class/function declarations and standard I/O scanner boilerplate to read values from stdin. DO NOT solve the problem in the 'starterCode' templates. DO NOT include any calculation or logic branches in the templates. Keep the body empty except for the input variables read statements, with a comment '// Write your code here'.

Return ONLY the raw JSON object. Do not wrap it in anything else, do not add introductory or concluding text. Make sure all backslashes and quotes in code strings are correctly escaped.
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

  const text = result.choices[0].message.content || "";

  try {
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      throw new Error("Could not find valid JSON boundaries in AI response");
    }
    const jsonStr = text.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("JSON parsing error of Groq response:", error, "\nRaw Response was:", text);
    throw new Error("Failed to parse generated question from AI model.");
  }
}