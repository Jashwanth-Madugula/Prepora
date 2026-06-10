"use client";

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