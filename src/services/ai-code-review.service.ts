import Groq from "groq-sdk";

/**
 * File Purpose:
 * This service takes a candidate's completed code, the problem statement, programming language,
 * and test case grading metrics. It prompts the Groq Llama 3.3 model to perform a deep code analysis,
 * evaluating correctness, quality, space/time complexity, missing edge cases, strengths, and areas
 * for improvement, returning structured metrics.
 */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function reviewCode({
  question,
  code,
  language,
  passedCases,
  totalCases,
}: {
  question: string;
  code: string;
  language: string;
  passedCases: number;
  totalCases: number;
}) {
  const prompt = `
You are a senior FAANG interviewer.
Evaluate this coding solution.

QUESTION DETAILS:
${question}

LANGUAGE USED:
${language}

SUBMITTED CODE:
${code}

TEST CASE RESULT:
Passed ${passedCases} / ${totalCases}

Evaluate the code on correctness, time/space complexity, and code quality.
Return ONLY valid JSON matching this schema:

{
  "correctness": 85, // score out of 100
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "codeQuality": 90, // score out of 100
  "edgeCasesMissing": ["e.g. division by zero", "e.g. empty inputs"],
  "strengths": ["e.g. clean variable naming", "e.g. optimal linear runtime"],
  "improvements": ["e.g. handle overflow conditions", "e.g. remove unused variables"],
  "finalComment": "A brief overview comment summarizing your feedback."
}

Do not wrap the JSON in markdown formatting. Do not write any other explanation or intro.
`;

  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.5, // slightly lower temp for more consistent JSON structure
  });

  const text = result.choices[0].message.content || "";

  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?/, "");
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON parsing error in ai-code-review response:", error, "\nRaw Response was:", text);
    // Return a sensible fallback object if parsing failed so execution doesn't crash
    return {
      correctness: passedCases && totalCases ? Math.round((passedCases / totalCases) * 100) : 50,
      timeComplexity: "Unable to calculate",
      spaceComplexity: "Unable to calculate",
      codeQuality: 60,
      edgeCasesMissing: ["Unable to verify edge cases due to parsing error."],
      strengths: ["Code compiles and passes test cases."],
      improvements: ["Check manual code review suggestions."],
      finalComment: "Successfully submitted code. AI Code evaluation failed to parse standard JSON output.",
    };
  }
}