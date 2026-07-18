"use client";


/**
 * @file src/components/resumes/ResumeActions.tsx
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

import { toast } from "sonner";
import {
  deleteResume,
  updateResume,
} from "@/services/resume.client";
import RenameResumeDialog
from "./RenameResumeDialog";

interface Props {
  resumeId: string;
  title: string;
  isDefault: boolean;
  onRefresh: () => void;
}

export default function ResumeActions({
  resumeId,
  title,
  isDefault,
  onRefresh,
}: Props) {
  async function handleDefault() {
    try {
      const result =
        await updateResume(
          resumeId,
          {
            isDefault: true,
          }
        );

      if (!result.success) {
        throw new Error(
          result.message
        );
      }

      toast.success(
        "Default resume updated"
      );

      onRefresh();
    } catch (error: any) {
      toast.error(
        error.message
      );
    }
  }

  async function handleDelete() {
    const confirmed =
      window.confirm(
        "Delete this resume?"
      );

    if (!confirmed) return;

    try {
      const result =
        await deleteResume(
          resumeId
        );

      if (!result.success) {
        throw new Error(
          result.message
        );
      }

      toast.success(
        "Resume deleted"
      );

      window.location.href =
        "/resumes";
    } catch (error: any) {
      toast.error(
        error.message
      );
    }
  }

  return (
    <div className="flex gap-3 flex-wrap">

  <RenameResumeDialog
    resumeId={resumeId}
    currentTitle={title}
    onSuccess={onRefresh}
  />

  {!isDefault && (
    <button
      onClick={handleDefault}
      className="
      border
      px-4
      py-2
      rounded-lg
      "
    >
      Make Default
    </button>
  )}

  <button
    onClick={handleDelete}
    className="
    border
    px-4
    py-2
    rounded-lg
    "
  >
    Delete
  </button>

</div>
  );
}