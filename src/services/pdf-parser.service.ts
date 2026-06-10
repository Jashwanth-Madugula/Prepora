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