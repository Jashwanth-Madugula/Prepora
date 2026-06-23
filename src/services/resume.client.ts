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