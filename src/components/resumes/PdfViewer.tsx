"use client";


/**
 * @file src/components/resumes/PdfViewer.tsx
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
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  fileUrl: string;
}

export default function PdfViewer({
  fileUrl,
}: PdfViewerProps) {
  const [numPages, setNumPages] =
    useState(0);

  function onLoadSuccess({
    numPages,
  }: {
    numPages: number;
  }) {
    setNumPages(numPages);
  }

  return (
    <div className="space-y-4">
      <Document
        file={fileUrl}
        onLoadSuccess={onLoadSuccess}
      >
        {Array.from(
          new Array(numPages),
          (_, index) => (
            <Page
              key={index}
              pageNumber={index + 1}
              width={800}
            />
          )
        )}
      </Document>
    </div>
  );
}