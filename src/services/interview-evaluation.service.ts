import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Evaluates a candidate's answer to an interview question.
 * Generates scores for five dimensions (Technical Accuracy, Communication, Confidence, Completeness, and Structure)
 * along with suggestions for improvement, strengths/weaknesses list, and a premium mock response.
 */
export async function evaluateAnswer(
  question: string,
  answer: string
): Promise<string> {
  const prompt = `You are a senior technical and HR interviewer. Evaluate the candidate's answer for the question below.

Question:
${question}

Candidate Answer:
${answer}

Evaluate the response on a scale of 0 to 100 for the following five criteria:
1. Technical Accuracy: Is the answer correct, precise, and relevant to the technology/framework mentioned?
2. Communication: Is the answer spoken/written clearly, professionally, and without rambling?
3. Confidence: Does the answer convey confidence, expertise, and authority on the subject?
4. Completeness: Does the answer address all parts of the question?
5. Structure: Is the answer well-structured (e.g. using STAR method, dividing into background/action/result, or structured logically)?

Provide constructive feedback, key strengths, key weaknesses, and a suggested high-quality improved answer that a senior professional would write.

Return your evaluation in this JSON format:
{
  "overallScore": 0,
  "technicalAccuracy": 0,
  "communication": 0,
  "confidence": 0,
  "completeness": 0,
  "structure": 0,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1/area of improvement"],
  "feedback": "Detailed overall feedback summary here.",
  "improvedAnswer": "An exemplary response answering the question perfectly."
}
Ensure it is a valid JSON object. Do not write any conversational text or markdown codeblocks outside the JSON structure.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  return completion.choices[0].message.content || "{}";
}

/**
 * FILE PURPOSE & HELP:
 * This evaluation engine service evaluates candidate responses using LLM-based parsing.
 * It scores candidates on five critical metrics: Communication, Technical Accuracy,
 * Confidence, Completeness, and Structure.
 * It leverages the Groq SDK client to run the evaluation prompt and returns a structured JSON
 * payload containing scores, feedback, list of strengths and weaknesses, and an improved response template.
 */