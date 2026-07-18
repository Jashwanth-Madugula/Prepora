/**
 * @file src/services/resume.client.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "resume.client.ts".
 * 
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

export async function getResumes() {
  const response =
    await fetch("/api/resumes");

  return response.json();
}

export async function getResume(
  id: string
) {
  const response =
    await fetch(
      `/api/resumes/${id}`
    );

  return response.json();
}

export async function deleteResume(
  id: string
) {
  const response =
    await fetch(
      `/api/resumes/${id}`,
      {
        method: "DELETE",
      }
    );

  return response.json();
}

export async function updateResume(
  id: string,
  data: {
    title?: string;
    isDefault?: boolean;
  }
) {
  const response =
    await fetch(
      `/api/resumes/${id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          data
        ),
      }
    );

  return response.json();
}

export async function uploadResume(
  file: File,
  title: string,
  jobDescription?: string
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "title",
    title
  );

  if (jobDescription) {
    formData.append(
      "jobDescription",
      jobDescription
    );
  }

  const response =
    await fetch(
      "/api/resumes",
      {
        method: "POST",
        body: formData,
      }
    );

  return response.json();
}

export async function getResumeById(
  id: string
) {
  const response =
    await fetch(
      `/api/resumes/${id}`
    );

  return response.json();
}