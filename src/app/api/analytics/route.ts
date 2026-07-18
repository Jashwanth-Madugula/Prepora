/**
 * @file src/app/api/analytics/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.
 * 
 *
 * What problem it solves:
 * - Validates request inputs, manages rate-limiting rules, invokes business logic services, interacts with the database, and returns structured JSON responses and status codes to the frontend client.
 *
 * How it works internally:
 * - Exports async HTTP methods (GET, POST, PUT, DELETE, etc.) which parse query parameters or request body JSONs, connect to MongoDB using dbConnect(), verify permissions, and return NextResponse payloads.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Resume } from "@/models/Resume";
import Interview from "@/models/interview.model";
import InterviewQuestion from "@/models/interview-question.model";
import AptitudeAttempt from "@/models/aptitude-attempt.model";
import CodingAttempt from "@/models/coding-attempt.model";
import CodingQuestion from "@/models/coding-question.model";
import SubjectAttempt from "@/models/subject-attempt.model";
import CodingRoundAttempt from "@/models/coding-round-attempt.model";

/**
 * File Purpose:
 * This API endpoint retrieves a consolidated report of the user's performance across the Prepora platform:
 * 1. Resume ATS Analytics (Matched/Missing keywords, highest and average scores).
 * 2. AI Mock Interview Analytics (Sessions, overall scores, and averages across the 7 evaluation dimensions).
 * 3. Aptitude Test Analytics (Attempts, average accuracy, and category performance breakdown).
 * 4. Cross-Module AI Career Insights & Actionable Recommendations.
 */

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Ensure mongoose models are registered to avoid MissingSchemaError during populates
    const _models = [CodingQuestion, CodingAttempt, CodingRoundAttempt, SubjectAttempt];

    // Authenticate the user.
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // ==========================================
    // 1. RESUME / ATS ANALYTICS
    // ==========================================
    const resumes = await Resume.find({ userId });
    let totalResumes = resumes.length;
    let highestAtsScore = 0;
    let averageAtsScore = 0;
    let latestResume = null;
    let missingKeywords: string[] = [];
    let matchedKeywords: string[] = [];
    let atsSuggestions: string[] = [];

    if (totalResumes > 0) {
      let sumAts = 0;
      let analyzedCount = 0;

      resumes.forEach((r) => {
        if (r.atsScore !== undefined) {
          sumAts += r.atsScore;
          analyzedCount++;
          if (r.atsScore > highestAtsScore) {
            highestAtsScore = r.atsScore;
          }
        }
      });

      averageAtsScore = analyzedCount > 0 ? Math.round(sumAts / analyzedCount) : 0;

      // Find the latest uploaded resume
      const sortedResumes = [...resumes].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      latestResume = sortedResumes[0];

      if (latestResume) {
        missingKeywords = latestResume.atsKeywordsMissing || [];
        matchedKeywords = latestResume.atsKeywordsMatched || [];
        atsSuggestions = latestResume.atsSuggestions || [];
      }
    }

    // ==========================================
    // 2. AI MOCK INTERVIEWS ANALYTICS
    // ==========================================
    const interviews = await Interview.find({ userId, status: "completed" });
    const totalInterviews = interviews.length;
    let averageInterviewScore = 0;
    
    // Detailed Interview Metrics Averages
    const interviewMetrics = {
      technicalAccuracy: 0,
      communication: 0,
      confidence: 0,
      completeness: 0,
      structure: 0,
      clarity: 0,
      fluency: 0,
    };

    if (totalInterviews > 0) {
      let interviewScoreSum = 0;
      interviews.forEach((i) => {
        interviewScoreSum += i.score || 0;
      });
      averageInterviewScore = Math.round(interviewScoreSum / totalInterviews);

      // Fetch all questions for completed interviews to extract granular metrics
      const interviewIds = interviews.map((i) => i._id);
      const questions = await InterviewQuestion.find({ interviewId: { $in: interviewIds } });
      const qCount = questions.length;

      if (qCount > 0) {
        let techSum = 0, commSum = 0, confSum = 0, compSum = 0, structSum = 0, claritySum = 0, fluencySum = 0;
        
        questions.forEach((q) => {
          techSum += q.technicalAccuracyScore || 0;
          commSum += q.communicationScore || 0;
          confSum += q.confidenceScore || 0;
          compSum += q.completenessScore || 0;
          structSum += q.structureScore || 0;
          claritySum += q.clarityScore || 0;
          fluencySum += q.fluencyScore || 0;
        });

        interviewMetrics.technicalAccuracy = Math.round(techSum / qCount);
        interviewMetrics.communication = Math.round(commSum / qCount);
        interviewMetrics.confidence = Math.round(confSum / qCount);
        interviewMetrics.completeness = Math.round(compSum / qCount);
        interviewMetrics.structure = Math.round(structSum / qCount);
        interviewMetrics.clarity = Math.round(claritySum / qCount);
        interviewMetrics.fluency = Math.round(fluencySum / qCount);
      }
    }

    // ==========================================
    // 3. APTITUDE TEST ANALYTICS
    // ==========================================
    const attempts = await AptitudeAttempt.find({ userId });
    const totalAptitudeTests = attempts.length;
    let averageAptitudeScore = 0;

    const aptitudeCategoryAccuracy = {
      quantitative: 0,
      logical: 0,
      verbal: 0,
      mixed: 0,
    };

    if (totalAptitudeTests > 0) {
      let scoreSum = 0;
      const categoryStats = {
        quantitative: { correct: 0, total: 0 },
        logical: { correct: 0, total: 0 },
        verbal: { correct: 0, total: 0 },
        mixed: { correct: 0, total: 0 },
      };

      attempts.forEach((a) => {
        scoreSum += a.score || 0;
        const cat = a.category || "mixed";
        if (categoryStats[cat]) {
          categoryStats[cat].correct += a.correctAnswers || 0;
          categoryStats[cat].total += a.totalQuestions || 0;
        }
      });

      averageAptitudeScore = Math.round(scoreSum / totalAptitudeTests);

      Object.keys(categoryStats).forEach((key) => {
        const stats = categoryStats[key as keyof typeof categoryStats];
        if (stats.total > 0) {
          aptitudeCategoryAccuracy[key as keyof typeof aptitudeCategoryAccuracy] = Math.round(
            (stats.correct / stats.total) * 100
          );
        }
      });
    }

    // ==========================================
    // 3.5 CODING / DSA ROUNDS ANALYTICS
    // ==========================================
    const codingAttempts = await CodingAttempt.find({ userId, status: "submitted" })
      .populate("questionId");
    const codingRoundAttempts = await CodingRoundAttempt.find({ userId, status: "submitted" })
      .populate("questions.questionId");

    const totalCodingAttempts = codingAttempts.length;
    const totalCodingRounds = codingRoundAttempts.length;
    let averageCodingScore = 0;
    const dsaTopicAccuracy: Record<string, { sum: number; count: number }> = {};

    let totalAttemptsCount = totalCodingAttempts + (totalCodingRounds * 3);
    let codingScoreSum = 0;

    codingAttempts.forEach((a) => {
      codingScoreSum += a.score || 0;
      if (a.questionId) {
        const topic = a.questionId.topic || "General";
        if (!dsaTopicAccuracy[topic]) {
          dsaTopicAccuracy[topic] = { sum: 0, count: 0 };
        }
        dsaTopicAccuracy[topic].sum += a.score || 0;
        dsaTopicAccuracy[topic].count += 1;
      }
    });

    codingRoundAttempts.forEach((r: any) => {
      r.questions.forEach((q: any) => {
        codingScoreSum += q.score || 0;
        if (q.questionId) {
          const topic = q.questionId.topic || "General";
          if (!dsaTopicAccuracy[topic]) {
            dsaTopicAccuracy[topic] = { sum: 0, count: 0 };
          }
          dsaTopicAccuracy[topic].sum += q.score || 0;
          dsaTopicAccuracy[topic].count += 1;
        }
      });
    });

    if (totalAttemptsCount > 0) {
      averageCodingScore = Math.round(codingScoreSum / totalAttemptsCount);
    }

    const dsaTopicsBreakdown = Object.entries(dsaTopicAccuracy).map(([topic, data]) => ({
      topic,
      accuracy: Math.round(data.sum / data.count),
      count: data.count,
    }));

    // ==========================================
    // 3.6 CORE SUBJECTS ANALYTICS
    // ==========================================
    const subjectAttempts = await SubjectAttempt.find({ userId, status: "completed" });
    const totalSubjectAttempts = subjectAttempts.length;
    let averageSubjectScore = 0;
    const subjectAccuracy: Record<string, { sum: number; count: number }> = {
      DBMS: { sum: 0, count: 0 },
      OS: { sum: 0, count: 0 },
      CN: { sum: 0, count: 0 },
      OOPS: { sum: 0, count: 0 },
    };

    if (totalSubjectAttempts > 0) {
      let subjectScoreSum = 0;
      subjectAttempts.forEach((a) => {
        subjectScoreSum += a.score || 0;
        const subj = a.subject;
        if (subjectAccuracy[subj]) {
          subjectAccuracy[subj].sum += a.score || 0;
          subjectAccuracy[subj].count += 1;
        }
      });
      averageSubjectScore = Math.round(subjectScoreSum / totalSubjectAttempts);
    }

    const subjectBreakdown = Object.entries(subjectAccuracy).map(([subj, data]) => ({
      subject: subj,
      accuracy: data.count > 0 ? Math.round(data.sum / data.count) : 0,
      count: data.count,
    }));

    // ==========================================
    // PLACEMENT READINESS SCORE CALCULATION
    // ==========================================
    // Resume: 15%, Aptitude: 15%, Coding/DSA: 40%, Interviews: 15%, Core Subjects: 15%
    const readinessScore = Math.round(
      (highestAtsScore * 0.15) +
      (averageAptitudeScore * 0.15) +
      (averageCodingScore * 0.40) +
      (averageInterviewScore * 0.15) +
      (averageSubjectScore * 0.15)
    );

    let readinessClassification: "Not Ready" | "Needs Improvement" | "Interview Ready" | "Placement Ready" = "Not Ready";
    if (readinessScore >= 80) {
      readinessClassification = "Placement Ready";
    } else if (readinessScore >= 60) {
      readinessClassification = "Interview Ready";
    } else if (readinessScore >= 40) {
      readinessClassification = "Needs Improvement";
    }

    // ==========================================
    // 4. CROSS-MODULE AI CAREER PLAN
    // ==========================================
    const recommendations: string[] = [];

    // Resume Suggestions
    if (totalResumes === 0) {
      recommendations.push("You haven't uploaded a resume yet. Upload a resume to analyze your ATS score and keywords matching.");
    } else if (highestAtsScore < 70) {
      recommendations.push(
        `Your highest resume ATS score is ${highestAtsScore}%. Try updating your resume to include missing target keywords: ${missingKeywords.slice(0, 4).join(", ")}.`
      );
    }

    // Interview Performance Suggestions
    if (totalInterviews === 0) {
      recommendations.push("Take your first AI Mock Interview to evaluate your technical accuracy, confidence, and communication skills.");
    } else {
      // Find weakest interview metric
      const metricsList = [
        { name: "Technical Accuracy", val: interviewMetrics.technicalAccuracy },
        { name: "Communication", val: interviewMetrics.communication },
        { name: "Confidence", val: interviewMetrics.confidence },
        { name: "Completeness", val: interviewMetrics.completeness },
        { name: "Structure", val: interviewMetrics.structure },
      ];
      metricsList.sort((a, b) => a.val - b.val);
      const weakest = metricsList[0];

      if (weakest.val < 70) {
        recommendations.push(
          `Your interview skill '${weakest.name}' is currently low (${weakest.val}%). Practice situational HR or technical questions to work on this area.`
        );
      }
    }

    // Aptitude suggestions
    if (totalAptitudeTests === 0) {
      recommendations.push("Start a Mixed Diagnostic Aptitude test to evaluate your quantitative, logical, and verbal foundations.");
    } else {
      const aptList = [
        { name: "Quantitative", val: aptitudeCategoryAccuracy.quantitative },
        { name: "Logical Reasoning", val: aptitudeCategoryAccuracy.logical },
        { name: "Verbal Ability", val: aptitudeCategoryAccuracy.verbal },
      ];
      aptList.sort((a, b) => a.val - b.val);
      const weakestApt = aptList[0];

      if (weakestApt.val < 70) {
        recommendations.push(
          `Your aptitude area '${weakestApt.name}' is your main weakness (${weakestApt.val}% accuracy). Try starting a focused practice session of this category.`
        );
      }
    }

    // Coding suggestions
    if (totalCodingAttempts === 0) {
      recommendations.push("Launch your first AI Coding Round or Topic-Wise DSA practice to evaluate your programming capabilities.");
    } else if (averageCodingScore < 70) {
      recommendations.push(`Your average AI coding score is low (${averageCodingScore}%). Practice easy and medium DSA topics like Arrays and Strings to build logic.`);
    }

    // Core Subjects suggestions
    if (totalSubjectAttempts === 0) {
      recommendations.push("Attempt a Core Subject assessment quiz in DBMS, OS, Networks, or OOPS to gauge your computer science basics.");
    } else {
      const weakSubject = subjectBreakdown.sort((a, b) => a.accuracy - b.accuracy)[0];
      if (weakSubject && weakSubject.accuracy < 70) {
        recommendations.push(`Your accuracy in '${weakSubject.subject}' is currently '${weakSubject.accuracy}%'. Practice specific quizzes on this subject.`);
      }
    }

    // Cross-module balance advice
    if (totalInterviews > 0 && totalAptitudeTests > 0) {
      if (interviewMetrics.technicalAccuracy > 80 && averageAptitudeScore < 75) {
        recommendations.push(
          "Excellent technical depth in interviews! However, your aptitude baseline is holding you back. Focus on daily aptitude tests to pass early round screening tests."
        );
      } else if (averageAptitudeScore > 85 && interviewMetrics.communication < 70) {
        recommendations.push(
          "Great logical and math aptitude! But your interview communication scores are low. Utilize the AI interview simulators to practice speaking clearly and confidently."
        );
      }
    }

    // Fallback recommendation
    if (recommendations.length === 0) {
      recommendations.push("Fantastic performance overall! Keep sharpening your skills by trying hard-difficulty mock interviews or company challenge tests.");
    }

    return NextResponse.json({
      success: true,
      readiness: {
        score: readinessScore,
        classification: readinessClassification,
      },
      resume: {
        totalResumes,
        highestAtsScore,
        averageAtsScore,
        latestResumeTitle: latestResume ? latestResume.title : null,
        missingKeywords,
        matchedKeywords,
        atsSuggestions,
      },
      interviews: {
        totalInterviews,
        averageInterviewScore,
        metrics: interviewMetrics,
      },
      aptitude: {
        totalAptitudeTests,
        averageAptitudeScore,
        categoryAccuracy: aptitudeCategoryAccuracy,
      },
      coding: {
        totalCodingAttempts,
        averageCodingScore,
        topics: dsaTopicsBreakdown,
      },
      subjects: {
        totalSubjectAttempts,
        averageSubjectScore,
        breakdown: subjectBreakdown,
      },
      recommendations,
    });
  } catch (error: any) {
    console.error("GET analytics error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
