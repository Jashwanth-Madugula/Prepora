/**
 * Calculates the overall summary results for a completed interview.
 * Computes average scores across all questions for overall score and each individual metric:
 * Communication, Technical Accuracy, Confidence, Completeness, and Structure.
 */
export async function calculateInterviewResult(questions: any[]) {
  if (!questions || questions.length === 0) {
    return {
      overallScore: 0,
      communication: 0,
      technicalAccuracy: 0,
      confidence: 0,
      completeness: 0,
      structure: 0,
      clarity: 0,
      fluency: 0,
    };
  }

  const overallTotal = questions.reduce((sum, q) => sum + (q.score || 0), 0);
  const commTotal = questions.reduce((sum, q) => sum + (q.communicationScore || 0), 0);
  const techTotal = questions.reduce((sum, q) => sum + (q.technicalAccuracyScore || 0), 0);
  const confTotal = questions.reduce((sum, q) => sum + (q.confidenceScore || 0), 0);
  const compTotal = questions.reduce((sum, q) => sum + (q.completenessScore || 0), 0);
  const structTotal = questions.reduce((sum, q) => sum + (q.structureScore || 0), 0);
  const clarityTotal = questions.reduce((sum, q) => sum + (q.clarityScore || 0), 0);
  const fluencyTotal = questions.reduce((sum, q) => sum + (q.fluencyScore || 0), 0);

  const count = questions.length;

  return {
    overallScore: Math.round(overallTotal / count),
    communication: Math.round(commTotal / count),
    technicalAccuracy: Math.round(techTotal / count),
    confidence: Math.round(confTotal / count),
    completeness: Math.round(compTotal / count),
    structure: Math.round(structTotal / count),
    clarity: Math.round(clarityTotal / count),
    fluency: Math.round(fluencyTotal / count),
  };
}

/**
 * FILE PURPOSE & HELP:
 * This service computes overall and granular average scores (Communication, Technical Accuracy,
 * Confidence, Completeness, Structure, Clarity, and Fluency) for a completed interview session.
 * It receives an array of answered questions, aggregates their individual score fields,
 * and outputs rounded average percentages. The resulting metrics object is stored in the interview
 * document and rendered on the interview summary screen to give visual progress charts.
 *
 * FLOW INVOLVEMENT:
 * 1. Called in PATCH /api/interviews/[id] when status = "completed".
 * 2. Compiles averages across the 7 criteria for all interview question models linked to the session.
 * 3. Results are saved to the parent Interview document and returned in the final API response.
 */