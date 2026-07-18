/**
 * @file src/components/resumes/EmptyResumeState.tsx
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

export default function EmptyResumeState() {
  return (
    <div
      className="
      text-center
      py-16
      "
    >
      <h2
        className="
        text-xl
        font-semibold
        "
      >
        No Resumes Yet
      </h2>

      <p
        className="
        text-gray-500
        mt-2
        "
      >
        Upload your first
        resume to start
        preparing for
        interviews.
      </p>
    </div>
  );
}