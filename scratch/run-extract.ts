import { extractPdfText } from "../src/services/pdf-parser.service";
import fs from "fs";
import path from "path";

async function main() {
  try {
    const pdfPath = path.join(__dirname, "sample.pdf");
    console.log("Reading sample PDF file:", pdfPath);
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log("Calling extractPdfText...");
    const text = await extractPdfText(pdfBuffer);
    console.log("Extracted text successfully:", JSON.stringify(text));
  } catch (error) {
    console.error("extractPdfText threw an error:", error);
  }
}

main();
