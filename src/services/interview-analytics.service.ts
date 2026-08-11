/**
 * @file src/services/interview-analytics.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Computes comprehensive summary performance analytics for completed mock interview sessions.
 * Aggregates scores across 7 core metrics, concept coverage, identified missing concepts,
 * strong/weak topic classifications, and generates targeted, actionable study recommendations.
 */

export interface InterviewAnalyticsResult {
  overallScore: number;
  communication: number;
  technicalAccuracy: number;
  confidence: number;
  completeness: number;
  structure: number;
  clarity: number;
  fluency: number;
  conceptCoverage?: number;
  strongTopics?: string[];
  weakTopics?: string[];
  missingConcepts?: string[];
  recommendations?: string[];
}

/**
 * Calculates the overall summary results and RAG insights for a completed interview.
 */
export async function calculateInterviewResult(questions: any[]): Promise<InterviewAnalyticsResult> {
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
      conceptCoverage: 0,
      strongTopics: [],
      weakTopics: [],
      missingConcepts: [],
      recommendations: ["Complete practice questions to receive personalized recommendations."],
    };
  }

  const answeredQuestions = questions.filter((q) => q.score !== undefined && q.score !== null);
  const count = answeredQuestions.length > 0 ? answeredQuestions.length : questions.length;

  const overallTotal = questions.reduce((sum, q) => sum + (q.score || 0), 0);
  const commTotal = questions.reduce((sum, q) => sum + (q.communicationScore || 0), 0);
  const techTotal = questions.reduce((sum, q) => sum + (q.technicalAccuracyScore || 0), 0);
  const confTotal = questions.reduce((sum, q) => sum + (q.confidenceScore || 0), 0);
  const compTotal = questions.reduce((sum, q) => sum + (q.completenessScore || 0), 0);
  const structTotal = questions.reduce((sum, q) => sum + (q.structureScore || 0), 0);
  const clarityTotal = questions.reduce((sum, q) => sum + (q.clarityScore || 0), 0);
  const fluencyTotal = questions.reduce((sum, q) => sum + (q.fluencyScore || 0), 0);
  const coverageTotal = questions.reduce((sum, q) => sum + (q.conceptCoverage || q.completenessScore || 0), 0);

  // Aggregate missing concepts across all questions
  const allMissingConcepts: string[] = [];
  const categoryScores: Record<string, { total: number; count: number }> = {};

  questions.forEach((q) => {
    if (q.category) {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, count: 0 };
      }
      categoryScores[q.category].total += q.score || 0;
      categoryScores[q.category].count += 1;
    }

    if (Array.isArray(q.weaknesses)) {
      allMissingConcepts.push(...q.weaknesses);
    }
  });

  const strongTopics: string[] = [];
  const weakTopics: string[] = [];

  Object.entries(categoryScores).forEach(([cat, data]) => {
    const avg = data.count > 0 ? Math.round(data.total / data.count) : 0;
    if (avg >= 75) {
      strongTopics.push(cat);
    } else {
      weakTopics.push(cat);
    }
  });

  // Generate specific actionable recommendations based on weak areas
  const recommendations: string[] = [];
  if (weakTopics.length > 0) {
    weakTopics.forEach((topic) => {
      recommendations.push(
        `Focus on deep-diving into ${topic} fundamentals, core architecture trade-offs, and practical design patterns.`
      );
    });
  }

  if (Math.round(techTotal / count) < 75) {
    recommendations.push(
      "Strengthen precision in explaining technical mechanics, step-by-step lifecycles, and internal data structures."
    );
  }

  if (Math.round(structTotal / count) < 75) {
    recommendations.push(
      "Practice using the STAR framework (Situation, Task, Action, Result) to organize answers systematically."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Excellent performance across all evaluated topics! Continue practicing advanced system design and edge-case scenarios.");
  }

  return {
    overallScore: Math.round(overallTotal / count),
    communication: Math.round(commTotal / count),
    technicalAccuracy: Math.round(techTotal / count),
    confidence: Math.round(confTotal / count),
    completeness: Math.round(compTotal / count),
    structure: Math.round(structTotal / count),
    clarity: Math.round(clarityTotal / count),
    fluency: Math.round(fluencyTotal / count),
    conceptCoverage: Math.round(coverageTotal / count),
    strongTopics,
    weakTopics,
    missingConcepts: Array.from(new Set(allMissingConcepts)).slice(0, 5),
    recommendations: recommendations.slice(0, 4),
  };
}