import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Evaluates a candidate's answer to an interview question.
 * Generates scores for five dimensions (Technical Accuracy, Communication, Confidence, Completeness, and Structure)
 * along with suggestions for improvement, strengths/weaknesses list, and a premium mock response.
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  answerType: "text" | "audio" | "video" = "text"
): Promise<string> {
  const typeLabel = answerType === "text" ? "written text" : `${answerType} recording transcription`;
  const contextInstruction = answerType !== "text"
    ? `Note: The candidate's response was spoken and transcribed using speech-to-text. Please evaluate the answer content, keeping in mind that spoken answers may contain minor colloquialisms, pauses, or filler words, but should still be scored on their professional clarity, fluency, confidence, structure, and correctness.`
    : `Note: The candidate's response was submitted as a typed text answer. Evaluate it accordingly.`;

  const prompt = `You are a senior technical and HR interviewer. Evaluate the candidate's answer for the question below.

Question:
${question}

Candidate Answer (submitted via ${typeLabel}):
${answer}

${contextInstruction}

Evaluate the response on a scale of 0 to 100 for the following criteria:
1. Technical Accuracy: Is the answer correct, precise, and relevant to the technology/framework mentioned?
2. Communication: Is the answer spoken/written clearly, professionally, and without rambling?
3. Confidence: Does the answer convey confidence, expertise, and authority on the subject?
4. Completeness: Does the answer address all parts of the question?
5. Structure: Is the answer well-structured (e.g. using STAR method, dividing into background/action/result, or structured logically)?
6. Clarity: Is the answer easy to understand, coherent, and free of confusing jargon or ambiguous phrases?
7. Fluency: Is the language natural, smooth, grammatically correct, and free of excessive stuttering or repetitive filler terms?

Provide constructive feedback, key strengths, key weaknesses, and a suggested high-quality improved answer that a senior professional would write.

Return your evaluation in this JSON format:
{
  "overallScore": 0,
  "technicalAccuracy": 0,
  "communication": 0,
  "confidence": 0,
  "completeness": 0,
  "structure": 0,
  "clarity": 0,
  "fluency": 0,
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
 * It has been updated to evaluate candidate responses across 7 metrics:
 * - Technical Accuracy (factual alignment and depth of stack knowledge)
 * - Communication (overall professional articulation)
 * - Confidence (strength of tone and conviction)
 * - Completeness (covering all parts of the prompt)
 * - Structure (logical organization e.g. STAR technique)
 * - Clarity (ease of comprehension, readability)
 * - Fluency (smooth grammatical transition, absence of filler words)
 *
 * It takes into consideration whether the input was submitted as 'text', 'audio', or 'video'.
 * When evaluation is complete, it parses the JSON response containing overall percentage grades,
 * granular metrics, qualitative bullet points, and an exemplary suggested answer response.
 *
 * FLOW INVOLVEMENT:
 * 1. Called in POST /api/interviews/questions/[questionId]/answer.
 * 2. Connects to Groq Llama model with schema enforcement.
 * 3. Returns structured output string to be parsed and written to MongoDB.
 */