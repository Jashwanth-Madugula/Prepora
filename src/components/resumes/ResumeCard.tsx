"use client";

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