"use client";

import {
  useState,
} from "react";

import {
  useDropzone,
} from "react-dropzone";

import { toast } from "sonner";

import {
  uploadResume,
} from "@/services/resume.client";

interface Props {
  onSuccess: () => void;
}

export default function ResumeUploader({
  onSuccess,
}: Props) {
  const [
    file,
    setFile,
  ] = useState<File | null>(
    null
  );

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const {
    getRootProps,
    getInputProps,
  } = useDropzone({
    accept: {
      "application/pdf":
        [".pdf"],
    },

    maxFiles: 1,

    onDrop: (
      acceptedFiles
    ) => {
      const selected =
        acceptedFiles[0];

      if (
        !selected
      )
        return;

      setFile(
        selected
      );

      if (
        !title
      ) {
        setTitle(
          selected.name.replace(
            ".pdf",
            ""
          )
        );
      }
    },
  });

  const [progress, setProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "analyzing">("idle");

  async function handleUpload() {
    if (!file) {
      toast.error(
        "Select a PDF file"
      );
      return;
    }

    if (!title.trim()) {
      toast.error(
        "Enter a title"
      );
      return;
    }

    let intervalId: any;
    try {
      setLoading(true);
      setUploadStep("uploading");
      setProgress(15);

      // Animate progress to show upload and analysis step feedback
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev < 45) {
            return prev + 5;
          }
          if (prev === 45) {
            setUploadStep("analyzing");
            return 50;
          }
          if (prev < 95) {
            return prev + 3;
          }
          return prev;
        });
      }, 250);

      const result =
        await uploadResume(
          file,
          title
        );

      if (
        !result.success
      ) {
        throw new Error(
          result.message
        );
      }

      setProgress(100);
      toast.success(
        "Resume uploaded and analyzed successfully!"
      );

      setFile(null);
      setTitle("");
      onSuccess();
    } catch (
      error: any
    ) {
      toast.error(
        error.message ||
          "Upload failed"
      );
    } finally {
      clearInterval(intervalId);
      setLoading(false);
      setUploadStep("idle");
      setTimeout(() => setProgress(0), 800);
    }
  }

  return (
    <div
      className="
      border
      border-zinc-200/50
      dark:border-zinc-800/80
      rounded-xl
      p-6
      space-y-4
      "
    >
      <div
        {...getRootProps()}
        className="
        border-2
        border-dashed
        border-zinc-300
        dark:border-zinc-850
        hover:border-black
        dark:hover:border-white
        rounded-lg
        p-8
        text-center
        cursor-pointer
        transition
        duration-200
        "
      >
        <input
          {...getInputProps()}
        />

        {file ? (
          <div className="space-y-1">
            <p className="font-semibold text-sm truncate max-w-[200px] mx-auto text-zinc-800 dark:text-zinc-200">
              {file.name}
            </p>

            <p
              className="
              text-xs
              text-zinc-500
              dark:text-zinc-400
              "
            >
              {(
                file.size /
                1024 /
                1024
              ).toFixed(
                2
              )}{" "}
              MB
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-xl">📄</div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Drag & Drop PDF Here
            </p>
            <p className="text-xs text-zinc-400">PDF formats only (max 10MB)</p>
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Resume Title"
        value={title}
        onChange={(e) =>
          setTitle(
            e.target.value
          )
        }
        className="
        w-full
        border
        border-zinc-200
        dark:border-zinc-850
        bg-white/50
        dark:bg-zinc-950/50
        rounded-lg
        px-3
        py-2
        text-sm
        focus:outline-none
        focus:ring-2
        focus:ring-black
        dark:focus:ring-white
        "
      />

      {loading && progress > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase">
            <span>
              {uploadStep === "uploading" ? "Uploading to Cloud..." : "AI Engine Analyzing..."}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={
          handleUpload
        }
        disabled={
          loading
        }
        className="
        w-full
        rounded-xl
        bg-black
        hover:opacity-90
        dark:bg-white
        dark:hover:opacity-95
        text-white
        dark:text-black
        font-semibold
        py-2.5
        text-sm
        transition
        duration-200
        disabled:opacity-50
        cursor-pointer
        "
      >
        {loading
          ? uploadStep === "uploading" ? "Uploading PDF..." : "Analyzing with AI..."
          : "Upload & Analyze"}
      </button>
    </div>
  );
}