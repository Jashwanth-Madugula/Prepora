import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Resume } from "@/models/Resume";
import Interview from "@/models/interview.model";
import InterviewQuestion from "@/models/interview-question.model";
import AptitudeAttempt from "@/models/aptitude-attempt.model";
import CodingAttempt from "@/models/coding-attempt.model";
import SubjectAttempt from "@/models/subject-attempt.model";
import CodingRoundAttempt from "@/models/coding-round-attempt.model";
import mongoose from "mongoose";

/**
 * File Purpose:
 * Secure API endpoint that provides aggregate statistics and diagnostic overview for admins:
 * - Counts total registered users and active concurrent web sessions.
 * - Computes the platform-wide average Placement Readiness Score.
 * - Tabulates AI API call volumes across Whisper (speech transcription) and Llama (evaluations, quiz generators, resumes).
 * - Reports system status, db status, Node version, and platform uptime.
 */

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Check auth roles: user must have ADMIN or SUPER_ADMIN role
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access. Administrator privileges required." },
        { status: 403 }
      );
    }

    // 1. Platform users & active sessions
    const totalUsers = await User.countDocuments({ isDeleted: false });

    const sessionsResult = await User.aggregate([
      { $project: { sessionsCount: { $size: { $ifNull: ["$refreshTokens", []] } } } },
      { $group: { _id: null, totalSessions: { $sum: "$sessionsCount" } } }
    ]);
    const activeSessionsCount = sessionsResult[0]?.totalSessions || 0;

    // 2. Platform-wide average Placement Readiness Score
    const resumeStats = await Resume.aggregate([
      { $group: { _id: "$userId", highestAtsScore: { $max: "$atsScore" } } }
    ]);
    const aptitudeStats = await AptitudeAttempt.aggregate([
      { $group: { _id: "$userId", averageAptitudeScore: { $avg: "$score" } } }
    ]);
    const codingStats = await CodingAttempt.aggregate([
      { $match: { status: "submitted" } },
      { $group: { _id: "$userId", averageCodingScore: { $avg: "$score" } } }
    ]);
    const codingRoundStats = await CodingRoundAttempt.aggregate([
      { $match: { status: "submitted" } },
      { $group: { _id: "$userId", averageCodingScore: { $avg: "$score" } } }
    ]);
    const interviewStats = await Interview.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$userId", averageInterviewScore: { $avg: "$score" } } }
    ]);
    const subjectStats = await SubjectAttempt.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$userId", averageSubjectScore: { $avg: "$score" } } }
    ]);

    const resumeMap = new Map(resumeStats.map(r => [r._id?.toString() || "", r.highestAtsScore || 0]));
    const aptitudeMap = new Map(aptitudeStats.map(a => [a._id?.toString() || "", a.averageAptitudeScore || 0]));
    
    // Merge coding maps
    const codingMap = new Map();
    codingStats.forEach(c => codingMap.set(c._id?.toString() || "", c.averageCodingScore || 0));
    codingRoundStats.forEach(r => {
      const uId = r._id?.toString() || "";
      if (codingMap.has(uId)) {
        codingMap.set(uId, Math.round((codingMap.get(uId) + r.averageCodingScore) / 2));
      } else {
        codingMap.set(uId, r.averageCodingScore || 0);
      }
    });

    const interviewMap = new Map(interviewStats.map(i => [i._id?.toString() || "", i.averageInterviewScore || 0]));
    const subjectMap = new Map(subjectStats.map(s => [s._id?.toString() || "", s.averageSubjectScore || 0]));

    const users = await User.find({ isDeleted: false }, "_id");
    let totalReadinessSum = 0;
    let usersWithScoresCount = 0;

    users.forEach(user => {
      const userIdStr = user._id.toString();
      const resumeScore = resumeMap.get(userIdStr) || 0;
      const aptitudeScore = aptitudeMap.get(userIdStr) || 0;
      const codingScore = codingMap.get(userIdStr) || 0;
      const interviewScore = interviewMap.get(userIdStr) || 0;
      const subjectScore = subjectMap.get(userIdStr) || 0;

      const hasActivity = resumeMap.has(userIdStr) || aptitudeMap.has(userIdStr) || codingMap.has(userIdStr) || interviewMap.has(userIdStr) || subjectMap.has(userIdStr);
      
      const score = Math.round(
        (resumeScore * 0.15) +
        (aptitudeScore * 0.15) +
        (codingScore * 0.40) +
        (interviewScore * 0.15) +
        (subjectScore * 0.15)
      );

      totalReadinessSum += score;
      if (hasActivity) {
        usersWithScoresCount++;
      }
    });

    const averageReadinessScore = users.length > 0 ? Math.round(totalReadinessSum / users.length) : 0;

    // 3. AI API Usage statistics estimation based on completed assessment counts
    const whisperTranscriptions = await InterviewQuestion.countDocuments({
      answerType: { $in: ["audio", "video"] },
      transcript: { $exists: true, $ne: "" }
    });

    const llamaInterviewEvaluations = await InterviewQuestion.countDocuments({
      feedback: { $exists: true, $ne: "" }
    });

    const llamaInterviewGenerations = await Interview.countDocuments();
    const resumeParses = await Resume.countDocuments();
    const atsJobMatches = await Resume.countDocuments({ jdText: { $exists: true, $ne: "" } });
    const subjectAssessments = await SubjectAttempt.countDocuments();
    const codingRounds = await CodingAttempt.countDocuments();
    const codingRound3Q = await CodingRoundAttempt.countDocuments();

    const totalAIApiCalls = 
      whisperTranscriptions + 
      llamaInterviewEvaluations + 
      llamaInterviewGenerations + 
      resumeParses + 
      atsJobMatches + 
      subjectAssessments + 
      codingRounds +
      (codingRound3Q * 3);

    // 4. System Health Status
    const dbState = mongoose.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeSessionsCount,
        averageReadinessScore,
        usersWithScoresCount,
      },
      apiUsage: {
        whisperTranscriptions,
        llamaInterviewEvaluations,
        llamaInterviewGenerations,
        resumeParses,
        atsJobMatches,
        subjectAssessments,
        codingRounds: codingRounds + (codingRound3Q * 3),
        totalAIApiCalls,
      },
      system: {
        database: dbStatusMap[dbState] || "Unknown",
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
      }
    });
  } catch (error: any) {
    console.error("GET admin stats route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
