/**
 * @file src/lib/resume-validation.ts
 * @category Utility / Helper Library
 *
 * Why this code exists:
 * Provides shared helper libraries and initializers (such as DB pools, client instances, cryptography, token management).
 * 
 *
 * What problem it solves:
 * - Avoids duplicate config setup blocks by centralizing libraries (such as Cloudinary connection pools, Groq SDK setups, mailers, JWT checkers) to keep code modular.
 *
 * How it works internally:
 * - Loads environment variables, initializes library clients with fail-fast validation checks, and exports clean utility methods for the services and API routers.
 */

import {
  ALLOWED_RESUME_TYPES,
  MAX_RESUME_SIZE,
} from "@/constants/resume";

export function validateResumeFile(
  file: File
) {
  if (
    !ALLOWED_RESUME_TYPES.includes(
      file.type
    )
  ) {
    throw new Error(
      "Only PDF files are allowed"
    );
  }

  if (
    file.size >
    MAX_RESUME_SIZE
  ) {
    throw new Error(
      "File exceeds 5MB limit"
    );
  }
}