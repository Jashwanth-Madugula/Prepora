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
    };
  }

  const overallTotal = questions.reduce((sum, q) => sum + (q.score || 0), 0);
  const commTotal = questions.reduce((sum, q) => sum + (q.communicationScore || 0), 0);
  const techTotal = questions.reduce((sum, q) => sum + (q.technicalAccuracyScore || 0), 0);
  const confTotal = questions.reduce((sum, q) => sum + (q.confidenceScore || 0), 0);
  const compTotal = questions.reduce((sum, q) => sum + (q.completenessScore || 0), 0);
  const structTotal = questions.reduce((sum, q) => sum + (q.structureScore || 0), 0);

  const count = questions.length;

  return {
    overallScore: Math.round(overallTotal / count),
    communication: Math.round(commTotal / count),
    technicalAccuracy: Math.round(techTotal / count),
    confidence: Math.round(confTotal / count),
    completeness: Math.round(compTotal / count),
    structure: Math.round(structTotal / count),
  };
}

/**
 * FILE PURPOSE & HELP:
 * This service computes overall and granular average scores (Communication, Technical Accuracy,
 * Confidence, Completeness, and Structure) for a completed interview session.
 * It receives an array of answered questions, aggregates their individual score fields,
 * and outputs rounded average percentages. The resulting metrics object is stored in the interview
 * document and rendered on the interview summary screen to give visual progress charts.
 */