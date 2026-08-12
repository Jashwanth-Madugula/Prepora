/**
 * @file src/services/interview-analytics.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Computes comprehensive summary performance analytics for completed mock interview sessions.
 * Aggregates scores across 7 core metrics, concept coverage, identified missing concepts,
 * strong/weak topic classifications, and generates targeted, actionable study recommendations.
 */

export interface SpeechAnalyticsSummary {
  averageSpeakingSpeedWpm: number;
  averageFillerRatePer100Words: number;
  totalFillerWords: number;
  totalPauses: number;
  averagePauseDurationSeconds: number;
  averagePauseRatio: number;
  deliveryConfidenceAverage: number;
}

export interface RagCoverageSummary {
  totalExpectedConcepts: number;
  totalCoveredConcepts: number;
  totalMissingConcepts: number;
  overallCoveragePercentage: number;
  allMissingConceptsList: string[];
  allCoveredConceptsList: string[];
}

export interface InterviewAnalyticsResult {
  overallScore: number;
  technicalAccuracy: number;
  conceptCoverage: number;
  completeness: number;
  structure: number;
  communication: number;
  clarity: number;
  fluency: number;
  confidence: number;
  contentScore: number;       // Average of Technical Accuracy, Concept Coverage, Completeness, Structure
  communicationScore: number; // Average of Communication, Clarity, Fluency, Confidence
  speechAnalytics?: SpeechAnalyticsSummary;
  ragCoverage?: RagCoverageSummary;
  strongTopics?: string[];
  weakTopics?: string[];
  missingConcepts?: string[];
  recommendations?: string[];
}

/**
 * Calculates comprehensive summary results, speech delivery metrics, and RAG insights for a completed interview.
 */
export async function calculateInterviewResult(questions: any[]): Promise<InterviewAnalyticsResult> {
  if (!questions || questions.length === 0) {
    return {
      overallScore: 0,
      technicalAccuracy: 0,
      conceptCoverage: 0,
      completeness: 0,
      structure: 0,
      communication: 0,
      clarity: 0,
      fluency: 0,
      confidence: 0,
      contentScore: 0,
      communicationScore: 0,
      strongTopics: [],
      weakTopics: [],
      missingConcepts: [],
      recommendations: ["Complete practice questions to receive personalized recommendations."],
    };
  }

  const answeredQuestions = questions.filter((q) => q.score !== undefined && q.score !== null);
  const count = answeredQuestions.length > 0 ? answeredQuestions.length : questions.length;

  const overallTotal = questions.reduce((sum, q) => sum + (q.score || 0), 0);
  const techTotal = questions.reduce((sum, q) => sum + (q.technicalAccuracyScore || 0), 0);
  const coverageTotal = questions.reduce((sum, q) => sum + (q.conceptCoverage || q.completenessScore || 0), 0);
  const compTotal = questions.reduce((sum, q) => sum + (q.completenessScore || 0), 0);
  const structTotal = questions.reduce((sum, q) => sum + (q.structureScore || 0), 0);
  const commTotal = questions.reduce((sum, q) => sum + (q.communicationScore || 0), 0);
  const clarityTotal = questions.reduce((sum, q) => sum + (q.clarityScore || 0), 0);
  const fluencyTotal = questions.reduce((sum, q) => sum + (q.fluencyScore || 0), 0);
  const confTotal = questions.reduce((sum, q) => sum + (q.confidenceScore || 0), 0);

  const avgTech = Math.round(techTotal / count);
  const avgCoverage = Math.round(coverageTotal / count);
  const avgComp = Math.round(compTotal / count);
  const avgStruct = Math.round(structTotal / count);
  const avgComm = Math.round(commTotal / count);
  const avgClarity = Math.round(clarityTotal / count);
  const avgFluency = Math.round(fluencyTotal / count);
  const avgConf = Math.round(confTotal / count);

  const contentScore = Math.round((avgTech + avgCoverage + avgComp + avgStruct) / 4);
  const communicationScore = Math.round((avgComm + avgClarity + avgFluency + avgConf) / 4);

  // Aggregate RAG Concept Coverage & Missing Concepts
  const allExpected: string[] = [];
  const allCovered: string[] = [];
  const allMissing: string[] = [];
  const categoryScores: Record<string, { total: number; count: number }> = {};

  // Speech delivery aggregations
  let audioResponseCount = 0;
  let totalWpm = 0;
  let totalFillerRate = 0;
  let totalFillerCount = 0;
  let totalPauses = 0;
  let totalPauseSeconds = 0;
  let totalPauseRatio = 0;
  let totalDeliveryConfidence = 0;

  questions.forEach((q) => {
    if (q.category) {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, count: 0 };
      }
      categoryScores[q.category].total += q.score || 0;
      categoryScores[q.category].count += 1;
    }

    if (Array.isArray(q.expectedConcepts)) allExpected.push(...q.expectedConcepts);
    if (Array.isArray(q.coveredConcepts)) allCovered.push(...q.coveredConcepts);
    if (Array.isArray(q.missingConcepts)) allMissing.push(...q.missingConcepts);
    if (Array.isArray(q.weaknesses)) allMissing.push(...q.weaknesses);

    if (q.audioAnalysis) {
      audioResponseCount++;
      const aa = q.audioAnalysis;
      if (aa.speakingRate?.wordsPerMinute) totalWpm += aa.speakingRate.wordsPerMinute;
      if (aa.fillers?.fillerRatePer100Words) totalFillerRate += aa.fillers.fillerRatePer100Words;
      if (aa.fillers?.totalCount) totalFillerCount += aa.fillers.totalCount;
      if (aa.pauses?.pauseCount) totalPauses += aa.pauses.pauseCount;
      if (aa.pauses?.totalPauseSeconds) totalPauseSeconds += aa.pauses.totalPauseSeconds;
      if (aa.pauses?.pauseRatio) totalPauseRatio += aa.pauses.pauseRatio;
      if (aa.vocalDeliveryConfidenceScore) totalDeliveryConfidence += aa.vocalDeliveryConfidenceScore;
    } else if (q.speakingSpeed) {
      audioResponseCount++;
      totalWpm += q.speakingSpeed;
      if (q.fillerWordCount) totalFillerCount += q.fillerWordCount;
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

  // Actionable recommendations based on diagnostic data
  const recommendations: string[] = [];

  if (weakTopics.length > 0) {
    weakTopics.forEach((topic) => {
      recommendations.push(
        `Focus on deep-diving into ${topic} fundamentals, core architecture trade-offs, and practical design patterns.`
      );
    });
  }

  if (avgCoverage < 75) {
    recommendations.push(
      "Improve concept coverage by systematically addressing key principles (e.g. underlying mechanics, lifecycle, trade-offs) before concluding your answer."
    );
  }

  if (avgTech < 75) {
    recommendations.push(
      "Strengthen precision in explaining technical mechanics, step-by-step lifecycles, and internal data structures."
    );
  }

  if (avgStruct < 75) {
    recommendations.push(
      "Practice using the STAR framework (Situation, Task, Action, Result) to organize answers systematically."
    );
  }

  if (audioResponseCount > 0) {
    const avgWpm = Math.round(totalWpm / audioResponseCount);
    if (avgWpm > 175) {
      recommendations.push(
        `Your speaking rate averaged ${avgWpm} WPM (brisk). Consider slowing down slightly to 135-160 WPM to enhance clarity and listener retention.`
      );
    } else if (avgWpm < 110) {
      recommendations.push(
        `Your speaking rate averaged ${avgWpm} WPM. Practice steady vocal pacing to convey energetic command of the topic.`
      );
    }

    const avgFillerRate = Math.round((totalFillerRate / audioResponseCount) * 10) / 10;
    if (avgFillerRate > 3.0) {
      recommendations.push(
        `Filler word density was ${avgFillerRate} per 100 words. Try replacing fillers (um, like, basically) with brief, confident silent pauses.`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Excellent performance across all evaluated topics! Continue practicing advanced system design and edge-case scenarios.");
  }

  const uniqueMissing = Array.from(new Set(allMissing)).slice(0, 6);
  const uniqueCovered = Array.from(new Set(allCovered));

  const speechAnalytics: SpeechAnalyticsSummary | undefined =
    audioResponseCount > 0
      ? {
          averageSpeakingSpeedWpm: Math.round(totalWpm / audioResponseCount),
          averageFillerRatePer100Words: Math.round((totalFillerRate / audioResponseCount) * 10) / 10,
          totalFillerWords: totalFillerCount,
          totalPauses,
          averagePauseDurationSeconds:
            totalPauses > 0 ? Math.round((totalPauseSeconds / totalPauses) * 10) / 10 : 0,
          averagePauseRatio: Math.round((totalPauseRatio / audioResponseCount) * 100) / 100,
          deliveryConfidenceAverage:
            totalDeliveryConfidence > 0 ? Math.round(totalDeliveryConfidence / audioResponseCount) : avgConf,
        }
      : undefined;

  const ragCoverage: RagCoverageSummary = {
    totalExpectedConcepts: allExpected.length > 0 ? allExpected.length : uniqueCovered.length + uniqueMissing.length,
    totalCoveredConcepts: uniqueCovered.length,
    totalMissingConcepts: uniqueMissing.length,
    overallCoveragePercentage: avgCoverage,
    allMissingConceptsList: uniqueMissing,
    allCoveredConceptsList: uniqueCovered,
  };

  return {
    overallScore: Math.round(overallTotal / count),
    technicalAccuracy: avgTech,
    conceptCoverage: avgCoverage,
    completeness: avgComp,
    structure: avgStruct,
    communication: avgComm,
    clarity: avgClarity,
    fluency: avgFluency,
    confidence: avgConf,
    contentScore,
    communicationScore,
    speechAnalytics,
    ragCoverage,
    strongTopics,
    weakTopics,
    missingConcepts: uniqueMissing,
    recommendations: recommendations.slice(0, 5),
  };
}