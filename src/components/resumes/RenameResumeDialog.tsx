"use client";


/**
 * @file src/components/resumes/RenameResumeDialog.tsx
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

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { updateResume } from "@/services/resume.client";

interface Props {
  resumeId: string;
  currentTitle: string;
  onSuccess: () => void;
}

export default function RenameResumeDialog({
  resumeId,
  currentTitle,
  onSuccess,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [title, setTitle] =
    useState(currentTitle);

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    if (!title.trim()) {
      toast.error(
        "Title is required"
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await updateResume(
          resumeId,
          {
            title,
          }
        );

      if (!result.success) {
        throw new Error(
          result.message
        );
      }

      toast.success(
        "Resume renamed"
      );

      setOpen(false);

      onSuccess();
    } catch (error: any) {
      toast.error(
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <button
          className="
          border
          px-4
          py-2
          rounded-lg
          "
        >
          Rename
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Rename Resume
          </DialogTitle>
        </DialogHeader>

        <input
          value={title}
          onChange={(e) =>
            setTitle(
              e.target.value
            )
          }
          className="
          border
          rounded-lg
          px-3
          py-2
          w-full
          "
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="
          bg-black
          text-white
          rounded-lg
          py-2
          "
        >
          {loading
            ? "Saving..."
            : "Save"}
        </button>
      </DialogContent>
    </Dialog>
  );
}