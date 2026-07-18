/**
 * @file src/components/resumes/ResumeInfo.tsx
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

interface Props {
  resume: any;
}

export default function ResumeInfo({
  resume,
}: Props) {
  return (
    <div
      className="
      border
      rounded-xl
      p-6
      "
    >
      <h1
        className="
        text-2xl
        font-bold
        "
      >
        {resume.title}
      </h1>

      {resume.isDefault && (
        <div
          className="
          mt-2
          inline-block
          bg-green-100
          text-green-700
          px-3
          py-1
          rounded-full
          text-sm
          "
        >
          Default Resume
        </div>
      )}

      <div
        className="
        mt-6
        space-y-2
        "
      >
        <p>
          <strong>
            File:
          </strong>{" "}
          {
            resume.originalFileName
          }
        </p>

        <p>
          <strong>
            Status:
          </strong>{" "}
          {resume.status}
        </p>

        <p>
          <strong>
            Size:
          </strong>{" "}
          {(
            resume.fileSize /
            1024
          ).toFixed(
            1
          )}{" "}
          KB
        </p>

        <p>
          <strong>
            Uploaded:
          </strong>{" "}
          {new Date(
            resume.createdAt
          ).toLocaleDateString()}
        </p>
      </div>

      <a
        href={
          resume.fileUrl
        }
        target="_blank"
        className="
        inline-block
        mt-4
        border
        rounded-lg
        px-4
        py-2
        "
      >
        Download Resume
      </a>
    </div>
  );
}