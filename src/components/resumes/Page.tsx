"use client";


/**
 * @file src/components/resumes/Page.tsx
 * @category React UI Component
 *
 * Why this code exists:
 * Renders a visual UI element or widget inside the candidate's application view.
 * 
 *
 * What problem it solves:
 * - Constructs modular, interactive interface components (like forms, buttons, timers, code-editors) keeping state reactive and responsive to candidate interactions.
 *
 * How it works internally:
 * - Implements a TypeScript React function component combining Tailwind CSS styling, React hooks (useState, useEffect, useMemo), animations (framer-motion), and callback events.
 */

import {
  useEffect,
  useState,
} from "react";

import ResumeCard from "@/components/resumes/ResumeCard";
import EmptyResumeState from "@/components/resumes/EmptyResumeState";
import ResumeUploader from "@/components/resumes/ResumeUploader";

import {
  getResumes,
  deleteResume,
  updateResume,
} from "@/services/resume.client";

export default function ResumesPage() {
  const [
    resumes,
    setResumes,
  ] = useState([]);

  async function loadResumes() {
    const data =
      await getResumes();

    setResumes(
      data.resumes || []
    );
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadResumes();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleDelete(
    id: string
  ) {
    await deleteResume(id);

    loadResumes();
  }

  async function handleDefault(
    id: string
  ) {
    await updateResume(
      id,
      {
        isDefault: true,
      }
    );

    loadResumes();
  }

  return (

    <div
      className="
      container
      py-10
      "
    >
      <div
  className="
  mb-8
  "
>
  <h1
    className="
    text-3xl
    font-bold
    mb-4
    "
  >
    My Resumes
  </h1>

  <ResumeUploader
    onSuccess={
      loadResumes
    }
  />
</div>
      <div
        className="
        flex
        justify-between
        items-center
        mb-8
        "
      >
        <h1
          className="
          text-3xl
          font-bold
          "
        >
          My Resumes
        </h1>
      </div>

      {resumes.length ===
      0 ? (
        <EmptyResumeState />
      ) : (
        <div
          className="
          grid
          gap-4
          md:grid-cols-2
          "
        >
          {resumes.map(
            (resume: any) => (
              <ResumeCard
                key={
                  resume._id
                }
                resume={
                  resume
                }
                onDelete={
                  handleDelete
                }
                onMakeDefault={
                  handleDefault
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}