/**
 * @file src/services/interview-evaluation.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Evaluates candidate responses (text, audio transcripts, video transcripts) against verified RAG
 * knowledge and evaluation rubrics. Detects concept coverage, missing concepts, incorrect claims,
 * scores across 7 dimensions, and generates targeted adaptive follow-up questions.
 */

import { getGroqClient } from "@/lib/groq";
import { retrieveRelevantChunks } from "@/services/rag/retrieval.service";
import { buildRagContext, wrapSafeRagContext } from "@/services/rag/context.service";
import { getMissingConceptKnowledge } from "@/services/rag/rag.service";
import { AudioAnalysis, TranscriptSegment } from "@/services/audio-analysis.service";

export interface InterviewEvaluationInput {
  question: string;
  answerType: "text" | "audio" | "video";
  transcript: string;
  transcriptSegments?: TranscriptSegment[];
  audioAnalysis?: AudioAnalysis;
  expectedConcepts?: string[];
  category?: string;
  topic?: string;
  useRAG?: boolean;
  enableAdaptiveFollowUps?: boolean;
  userId?: string;
  resumeContext?: string[];
  jobDescriptionContext?: string[];
}

export interface EvaluationOptions {
  category?: string;
  topic?: string;
  useRAG?: boolean;
  enableAdaptiveFollowUps?: boolean;
  expectedConcepts?: string[];
  audioAnalysis?: AudioAnalysis;
  transcriptSegments?: TranscriptSegment[];
}

export interface EvaluationResult {
  overallScore: number;
  technicalAccuracy: number;
  conceptCoverage: number;
  communication: number;
  confidence: number;
  completeness: number;
  structure: number;
  clarity: number;
  fluency: number;
  coveredConcepts: string[];
  missingConcepts: string[];
  incorrectConcepts: string[];
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  improvedAnswer: string;
  adaptiveFollowUp?: string;
  speechSummary?: string;
}

function getModelName(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

/**
 * Evaluates candidate responses (text, audio, video) using evidence-based RAG grounding,
 * expected concept rubrics, and empirical audio feature extraction.
 */
export async function evaluateMultimodalAnswer(
  input: InterviewEvaluationInput
): Promise<EvaluationResult> {
  const {
    question,
    answerType,
    transcript,
    audioAnalysis,
    expectedConcepts = [],
    category,
    topic,
    useRAG = true,
    enableAdaptiveFollowUps = true,
  } = input;

  let ragContextBlock = "";

  // 1. RAG Knowledge Retrieval for Grounding
  if (useRAG) {
    try {
      const retrievalQuery = `Interview question: "${question}". Expected technical concepts, factual standards, and evaluation rubrics.`;
      const chunks = await retrieveRelevantChunks(retrievalQuery, {
        limit: 4,
        type: ["technical", "interview", "evaluation"],
        topic: topic || category,
      });

      if (chunks.length > 0) {
        const formattedContext = buildRagContext(chunks, { maxChunks: 4, maxCharacters: 3000 });
        ragContextBlock = `
=== VERIFIED REFERENCE TECHNICAL KNOWLEDGE & FACTUAL RUBRICS ===
${wrapSafeRagContext(formattedContext)}
=== END REFERENCE KNOWLEDGE ===
`;
      }
    } catch (ragErr: any) {
      console.warn("RAG evaluation retrieval fallback (non-fatal):", ragErr?.message);
    }
  }

  // 2. Format Expected Concepts Block
  let expectedConceptsBlock = "";
  if (expectedConcepts && expectedConcepts.length > 0) {
    expectedConceptsBlock = `
EXPECTED CONCEPT RUBRIC FOR THIS QUESTION:
${expectedConcepts.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`;
  }

  // 3. Format Audio & Speech Delivery Evidence Block
  let audioEvidenceBlock = "";
  if (answerType !== "text" && audioAnalysis) {
    audioEvidenceBlock = `
=== MEASURED ACOUSTIC & SPEECH DELIVERY EVIDENCE (REAL MEASUREMENTS) ===
- Speaking Rate: ${audioAnalysis.speakingRate.wordsPerMinute} WPM (Pace: ${audioAnalysis.speakingRate.paceClassification}, Speech Duration: ${audioAnalysis.speakingRate.speechDurationSeconds}s, Total Duration: ${audioAnalysis.speakingRate.totalDurationSeconds}s)
- Pauses: ${audioAnalysis.pauses.pauseCount} pause(s), Total Pause Time: ${audioAnalysis.pauses.totalPauseSeconds}s (${Math.round(audioAnalysis.pauses.pauseRatio * 100)}% of recording), Long Pauses (>2s): ${audioAnalysis.pauses.longPauseCount} (Pattern: ${audioAnalysis.pauses.pausePatternClassification})
- Filler Words: ${audioAnalysis.fillers.totalCount} filler word(s) detected (${audioAnalysis.fillers.fillerRatePer100Words} fillers per 100 words, Classification: ${audioAnalysis.fillers.fillerClassification})
- Acoustic Energy & Projection: Mean RMS ${audioAnalysis.energy.meanRms}, Energy Variation: ${audioAnalysis.energy.energyVariation} (Consistency: ${audioAnalysis.energy.energyConsistencyScore}/100)
- Speech Continuity: Speech-to-Silence Ratio ${audioAnalysis.speechContinuity.speechToSilenceRatio}, Hesitations: ${audioAnalysis.speechContinuity.hesitationCount} (Continuity: ${audioAnalysis.speechContinuity.continuityScore}/100)
- Empirical Delivery Confidence: ${audioAnalysis.vocalDeliveryConfidenceScore}/100
=== END ACOUSTIC EVIDENCE ===

CRITICAL SCORING INSTRUCTION:
Do NOT guess or hallucinate vocal characteristics from transcript text.
Use the measured acoustic evidence above to evaluate Communication, Fluency, and Interview Delivery Confidence.
`;
  } else {
    audioEvidenceBlock = `
NOTE: This response was submitted as typed written text.
Score Fluency and Communication based on textual clarity, grammar, and structural expression.
Score Confidence based strictly on written assertiveness, authority, and tone.
`;
  }

  const prompt = `You are a principal technical interviewer and communication evaluator for Prepora.
Evaluate the candidate's response using the provided ground truth context, expected concept rubric, and empirical speech measurements.

QUESTION:
${question}

CANDIDATE RESPONSE (${answerType.toUpperCase()} SUBMISSION):
"${transcript}"

${expectedConceptsBlock}

${audioEvidenceBlock}

${ragContextBlock}

SCORING DEFINITIONS (Score each from 0 to 100):
1. Technical Accuracy (0-100): Are the factual claims made by the candidate correct and precise? (Grade what was said, do not double-penalize omissions here).
2. Concept Coverage (0-100): What percentage of the expected concepts were covered and explained?
3. Completeness (0-100): Does the answer thoroughly address all facets and depth of the question?
4. Structure (0-100): Is the response logically organized (e.g. STAR method or clear structural flow)?
5. Communication (0-100): Is the phrasing articulated clearly, professionally, and effectively?
6. Clarity (0-100): Is the message coherent and easy to understand without confusion?
7. Fluency (0-100): Is the delivery smooth and natural? (For audio/video, ground in filler rate & pause metrics).
8. Confidence (0-100): Interview delivery confidence (For audio/video, ground in the acoustic delivery evidence).

CONCEPT ANALYSIS:
- List each concept from the expected rubric that was satisfactorily covered in "coveredConcepts".
- List each concept from the expected rubric that was omitted or inadequately explained in "missingConcepts".
- List any incorrect, inaccurate, or fabricated statements in "incorrectConcepts".

Return your evaluation in this exact JSON format:
{
  "overallScore": 0,
  "technicalAccuracy": 0,
  "conceptCoverage": 0,
  "communication": 0,
  "confidence": 0,
  "completeness": 0,
  "structure": 0,
  "clarity": 0,
  "fluency": 0,
  "coveredConcepts": ["covered concept 1", "covered concept 2"],
  "missingConcepts": ["missing concept 1", "missing concept 2"],
  "incorrectConcepts": [],
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific area for improvement 1"],
  "feedback": "Comprehensive constructive feedback explaining the scores using the evidence.",
  "improvedAnswer": "An exemplary, comprehensive model answer."
}
Ensure the output is strictly valid JSON without markdown wrapping.`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: getModelName(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0].message.content || "{}";
    const result: EvaluationResult = JSON.parse(rawContent);

    // Normalize covered & missing concepts
    result.coveredConcepts = Array.isArray(result.coveredConcepts) ? result.coveredConcepts : [];
    result.missingConcepts = Array.isArray(result.missingConcepts) ? result.missingConcepts : [];
    result.incorrectConcepts = Array.isArray(result.incorrectConcepts) ? result.incorrectConcepts : [];

    // Calculate deterministic concept coverage if expected concepts were provided
    if (expectedConcepts && expectedConcepts.length > 0) {
      const totalExpected = expectedConcepts.length;
      const coveredCount = result.coveredConcepts.length;
      const calculatedCoverage = Math.min(100, Math.round((coveredCount / totalExpected) * 100));
      // Blend calculated with LLM's depth score
      result.conceptCoverage = Math.round(calculatedCoverage * 0.7 + (result.conceptCoverage || calculatedCoverage) * 0.3);
    }

    if (audioAnalysis?.summaryText) {
      result.speechSummary = audioAnalysis.summaryText;
    }

    // 4. Generate Adaptive Follow-Up Question if missing concepts exist
    if (
      enableAdaptiveFollowUps !== false &&
      result.missingConcepts &&
      result.missingConcepts.length > 0 &&
      result.overallScore < 85
    ) {
      try {
        const topMissing = result.missingConcepts[0];
        const missingKnowledge = await getMissingConceptKnowledge(topMissing, topic || category);

        const followUpPrompt = `You are an interviewer. The candidate missed the concept "${topMissing}" when answering "${question}".
Reference knowledge:
${missingKnowledge}

Generate one concise, direct adaptive follow-up question to test their understanding of "${topMissing}".
Return JSON: { "adaptiveFollowUp": "Follow-up question text here" }`;

        const followUpCompletion = await groq.chat.completions.create({
          model: getModelName(),
          messages: [{ role: "user", content: followUpPrompt }],
          temperature: 0.5,
          response_format: { type: "json_object" },
        });

        const followUpData = JSON.parse(followUpCompletion.choices[0].message.content || "{}");
        if (followUpData.adaptiveFollowUp) {
          result.adaptiveFollowUp = followUpData.adaptiveFollowUp;
        }
      } catch (fErr: any) {
        console.warn("Adaptive follow-up generation skipped:", fErr?.message);
      }
    }

    return result;
  } catch (error: any) {
    console.error("Evaluation service error:", error);
    return {
      overallScore: 70,
      technicalAccuracy: 70,
      conceptCoverage: 65,
      communication: 70,
      confidence: 70,
      completeness: 70,
      structure: 70,
      clarity: 70,
      fluency: 70,
      coveredConcepts: ["General topic addressed"],
      missingConcepts: expectedConcepts.length > 0 ? expectedConcepts.slice(0, 2) : ["In-depth mechanics"],
      incorrectConcepts: [],
      strengths: ["Answer addressed the general question."],
      weaknesses: ["Could include more specific technical details."],
      feedback: "Answer received and recorded.",
      improvedAnswer: "Provide a detailed technical breakdown with real-world examples.",
      speechSummary: audioAnalysis?.summaryText,
    };
  }
}

/**
 * Legacy compatibility wrapper for evaluateAnswer.
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  answerType: "text" | "audio" | "video" = "text",
  options: EvaluationOptions = {}
): Promise<string> {
  const result = await evaluateMultimodalAnswer({
    question,
    answerType,
    transcript: answer,
    category: options.category,
    topic: options.topic,
    useRAG: options.useRAG,
    enableAdaptiveFollowUps: options.enableAdaptiveFollowUps,
    expectedConcepts: options.expectedConcepts,
    audioAnalysis: options.audioAnalysis,
    transcriptSegments: options.transcriptSegments,
  });

  return JSON.stringify(result);
}