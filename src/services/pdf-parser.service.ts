/**
 * @file src/services/pdf-parser.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "pdf-parser.service.ts".
 * 
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

import { PDFParse } from "pdf-parse";

export async function extractPdfText(
  buffer: Buffer
): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    return textResult.text || "";
  } finally {
    await parser.destroy();
  }
}