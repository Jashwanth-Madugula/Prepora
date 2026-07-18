"use client";


/**
 * @file src/components/resumes/ResumeCard.tsx
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

import Link from "next/link";

interface ResumeCardProps {
  resume: any;

  onDelete: (
    id: string
  ) => void;

  onMakeDefault: (
    id: string
  ) => void;
}

export default function ResumeCard({
  resume,
  onDelete,
  onMakeDefault,
}: ResumeCardProps) {
  return (
    <div
      className="
      rounded-xl
      border
      p-5
      shadow-sm
      "
    >
      <div
        className="
        flex
        justify-between
        items-start
        "
      >
        <div>
          <h3
            className="
            font-semibold
            text-lg
            "
          >
            {resume.title}
          </h3>

          <p
            className="
            text-sm
            text-gray-500
            "
          >
            {
              resume.originalFileName
            }
          </p>
        </div>

        {resume.isDefault && (
          <span
            className="
            px-2
            py-1
            rounded
            bg-green-100
            text-green-700
            text-xs
            "
          >
            Default
          </span>
        )}
      </div>

      <div
        className="
        flex
        gap-2
        mt-4
        "
      >
        <Link
          href={`/resumes/${resume._id}`}
        >
          View
        </Link>

        {!resume.isDefault && (
          <button
            onClick={() =>
              onMakeDefault(
                resume._id
              )
            }
          >
            Make Default
          </button>
        )}

        <button
          onClick={() =>
            onDelete(
              resume._id
            )
          }
        >
          Delete
        </button>
      </div>
    </div>
  );
}