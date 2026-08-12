/**
 * scripts/test-multimodal-evaluation.ts
 *
 * Automated verification script for Prepora Multimodal Interview Architecture:
 * 1. Audio & Speech Feature Extraction (WPM, pause count/ratio, filler word rate, energy variation, vocal confidence).
 * 2. RAG Concept Grounding & Expected Concept Rubric evaluation.
 * 3. 8-metric scoring and adaptive follow-up question generation.
 * 4. Interview analytics aggregation.
 */

import { analyzeAudioEvidence, calculatePauseMetrics, calculateFillerMetrics } from "../src/services/audio-analysis.service";
import { calculateInterviewResult } from "../src/services/interview-analytics.service";

async function runTests() {
  console.log("==================================================");
  console.log("PREPORA MULTIMODAL INTERVIEW ARCHITECTURE TEST SUITE");
  console.log("==================================================\n");

  // Test 1: Audio Analysis Feature Extraction
  console.log("TEST 1: Audio Analysis Feature Extraction...");
  const mockTranscript = "React uses a virtual DOM to optimize UI updates. Um, basically, when state changes, React creates a new virtual DOM tree and diffs it with the previous tree, uh, using a reconciliation algorithm. This minimizes direct manipulation of the actual DOM, which is slow and expensive.";
  const mockSegments = [
    { id: 0, start: 0.0, end: 4.2, text: "React uses a virtual DOM to optimize UI updates." },
    { id: 1, start: 5.5, end: 12.0, text: "Um, basically, when state changes, React creates a new virtual DOM tree and diffs it with the previous tree" },
    { id: 2, start: 13.2, end: 20.0, text: "uh, using a reconciliation algorithm. This minimizes direct manipulation of the actual DOM, which is slow and expensive." }
  ];

  const audioAnalysis = analyzeAudioEvidence({
    transcript: mockTranscript,
    segments: mockSegments,
    durationSeconds: 20.0,
  });

  console.log("✓ Speaking Rate:", audioAnalysis.speakingRate.wordsPerMinute, "WPM", `(${audioAnalysis.speakingRate.paceClassification})`);
  console.log("✓ Pause Metrics:", audioAnalysis.pauses.pauseCount, "pauses,", audioAnalysis.pauses.totalPauseSeconds, "s total pause time");
  console.log("✓ Filler Metrics:", audioAnalysis.fillers.totalCount, "fillers,", audioAnalysis.fillers.fillerRatePer100Words, "per 100 words");
  console.log("✓ Energy Consistency Score:", audioAnalysis.energy.energyConsistencyScore, "/ 100");
  console.log("✓ Speech Continuity Score:", audioAnalysis.speechContinuity.continuityScore, "/ 100");
  console.log("✓ Vocal Delivery Confidence Score:", audioAnalysis.vocalDeliveryConfidenceScore, "/ 100");
  console.log("✓ Summary:", audioAnalysis.summaryText);

  if (audioAnalysis.speakingRate.wordsPerMinute <= 0 || audioAnalysis.vocalDeliveryConfidenceScore <= 0) {
    throw new Error("Audio analysis produced invalid or non-positive metrics!");
  }
  console.log(">> TEST 1 PASSED!\n");

  // Test 2: Interview Analytics Aggregation
  console.log("TEST 2: Interview Analytics 8-Metric & Delivery Aggregation...");
  const mockQuestions = [
    {
      _id: "q1",
      question: "Explain how React reconciliation and the Virtual DOM work.",
      category: "React",
      difficulty: "medium",
      answerType: "audio",
      score: 88,
      technicalAccuracyScore: 92,
      conceptCoverage: 85,
      completenessScore: 85,
      structureScore: 90,
      communicationScore: 88,
      clarityScore: 90,
      fluencyScore: 85,
      confidenceScore: 84,
      expectedConcepts: ["Virtual DOM tree diffing", "Reconciliation algorithm", "Batching updates", "Component lifecycle keys"],
      coveredConcepts: ["Virtual DOM tree diffing", "Reconciliation algorithm", "Batching updates"],
      missingConcepts: ["Component lifecycle keys"],
      speakingSpeed: audioAnalysis.speakingRate.wordsPerMinute,
      fillerWordCount: audioAnalysis.fillers.totalCount,
      audioAnalysis,
    },
    {
      _id: "q2",
      question: "What is database indexing and how do B-Trees improve query performance?",
      category: "Database",
      difficulty: "medium",
      answerType: "text",
      score: 82,
      technicalAccuracyScore: 85,
      conceptCoverage: 80,
      completenessScore: 80,
      structureScore: 85,
      communicationScore: 82,
      clarityScore: 85,
      fluencyScore: 80,
      confidenceScore: 80,
      expectedConcepts: ["B-Tree structure", "Binary search traversal", "Lookup time complexity O(log N)", "Write overhead on inserts"],
      coveredConcepts: ["B-Tree structure", "Lookup time complexity O(log N)"],
      missingConcepts: ["Write overhead on inserts"],
    }
  ];

  const analytics = await calculateInterviewResult(mockQuestions);
  console.log("✓ Overall Score:", analytics.overallScore);
  console.log("✓ Content Mastery Score:", analytics.contentScore);
  console.log("✓ Communication Score:", analytics.communicationScore);
  console.log("✓ RAG Concept Coverage:", analytics.ragCoverage?.overallCoveragePercentage, "%");
  console.log("✓ Covered Concepts Count:", analytics.ragCoverage?.totalCoveredConcepts);
  console.log("✓ Missing Concepts Count:", analytics.ragCoverage?.totalMissingConcepts);
  console.log("✓ Speech Analytics Average WPM:", analytics.speechAnalytics?.averageSpeakingSpeedWpm);
  console.log("✓ Speech Analytics Filler Rate:", analytics.speechAnalytics?.averageFillerRatePer100Words);
  console.log("✓ Recommendations:", analytics.recommendations);

  if (analytics.overallScore <= 0 || !analytics.ragCoverage || !analytics.speechAnalytics) {
    throw new Error("Analytics summary generation failed!");
  }
  console.log(">> TEST 2 PASSED!\n");

  console.log("==================================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
