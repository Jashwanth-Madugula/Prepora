/**
 * @file src/services/interview.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "interview.service.ts".
 * - Specifically handles AI-powered behavioral and technical mock interview evaluation workflows, question lists generation, or audio/video recording processing.
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

import { Resume } from "@/models/Resume";

export class InterviewService {
  static async generateResumeQuestions(
    resumeId: string
  ) {
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      throw new Error("Resume not found");
    }

    const questions: any[] = [];

    // Skills Questions
    if (resume.parsedData?.skills?.length) {
      resume.parsedData.skills.forEach(
        (skill: string) => {
          questions.push({
            category: "skill",
            difficulty: "medium",
            question: `Explain your experience with ${skill}.`,
          });
        }
      );
    }

    // Project Questions
    if (resume.parsedData?.projects?.length) {
      resume.parsedData.projects.forEach(
        (project: any) => {
          questions.push({
            category: "project",
            difficulty: "medium",
            question: `Explain the project "${project.name}".`,
          });

          questions.push({
            category: "project",
            difficulty: "hard",
            question: `What challenges did you face while building "${project.name}"?`,
          });
        }
      );
    }

    // Experience Questions
    if (resume.parsedData?.experience?.length) {
      questions.push({
        category: "experience",
        difficulty: "medium",
        question:
          "Tell me about your most impactful professional experience.",
      });
    }

    return questions.slice(0, 15);
  }
}

/**
 * FILE PURPOSE & HELP:
 * This service class is a legacy helper for local resume question extraction.
 * It provides basic rule-based question templates derived from skills, projects, and experiences
 * listed on a candidate's profile. This acts as a robust fallback fallback pattern or reference structure
 * when performing local client-side question parsing.
 */