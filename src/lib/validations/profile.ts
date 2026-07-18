/**
 * @file src/lib/validations/profile.ts
 * @category Zod Input Validator Schema
 *
 * Why this code exists:
 * Defines runtime validation checks and type constraints for user input parameters.
 * 
 *
 * What problem it solves:
 * - Validates client form inputs and endpoint request payloads on the server to prevent bad inputs or injection attacks, maintaining strict type compliance.
 *
 * How it works internally:
 * - Defines schema definitions using Zod's validation builder API and exports them for form verification (via React Hook Form) and route request validation checks.
 */

import { z } from "zod";

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50)
    .optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20)
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers and underscores"
    )
    .optional(),
  profilePicture: z.string().optional().or(z.literal("")),
  headline: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  college: z.string().optional().or(z.literal("")),
  degree: z.string().optional().or(z.literal("")),
  branch: z.string().optional().or(z.literal("")),
  cgpa: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "CGPA cannot be negative").max(10, "CGPA cannot exceed 10").optional()
  ),
  graduationYear: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  targetRole: z.string().optional().or(z.literal("")),
  targetCompanies: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid Portfolio URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  experienceLevel: z.enum(["student", "fresher", "experienced"]).optional(),
  placementGoal: z.enum(["Product", "Service", "Startup"]).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
