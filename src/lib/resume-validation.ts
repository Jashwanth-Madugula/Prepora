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