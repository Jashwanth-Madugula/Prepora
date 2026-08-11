/**
 * @file src/services/rag/chunking.service.ts
 * @category RAG Service
 *
 * Why this code exists:
 * Provides robust text splitting and chunking logic for RAG document ingestion.
 * Ensures text is cleanly normalized, preserves semantic boundaries (paragraphs, code blocks,
 * markdown headers, lists), and enforces sensible chunk sizes with configurable overlap.
 */

export interface TextChunk {
  content: string;
  chunkIndex: number;
  charCount: number;
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
  minChunkLength?: number;
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 150;
const DEFAULT_MIN_CHUNK_LENGTH = 100;

/**
 * Normalizes text content by cleaning excessive whitespace, invisible characters, and non-standard line breaks.
 */
export function cleanContent(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Splits text into paragraph-aware chunks with sliding overlap.
 * Keeps related sentences together where possible and avoids splitting in the middle of words.
 */
export function chunkText(
  rawText: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const overlap = Math.min(options.overlap ?? DEFAULT_OVERLAP, Math.floor(chunkSize / 2));
  const minChunkLength = options.minChunkLength || DEFAULT_MIN_CHUNK_LENGTH;

  const text = cleanContent(rawText);
  if (!text) {
    return [];
  }

  // If entire text fits inside one chunk, return immediately
  if (text.length <= chunkSize) {
    return [
      {
        content: text,
        chunkIndex: 0,
        charCount: text.length,
      },
    ];
  }

  // Split text into semantic segments (paragraphs or markdown sections)
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // If single paragraph exceeds chunkSize, split it by sentence or hard boundary
    if (trimmedPara.length > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          charCount: currentChunk.trim().length,
        });
        currentChunk = "";
      }

      // Sentence level splitting
      const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [trimmedPara];
      let subChunk = "";

      for (const sentence of sentences) {
        if ((subChunk + " " + sentence).length <= chunkSize) {
          subChunk = subChunk ? `${subChunk} ${sentence}` : sentence;
        } else {
          if (subChunk.length >= minChunkLength) {
            chunks.push({
              content: subChunk.trim(),
              chunkIndex: chunkIndex++,
              charCount: subChunk.trim().length,
            });
            // Carry over overlap from previous sentence if reasonable
            const overlapText = subChunk.slice(-overlap);
            subChunk = overlapText + " " + sentence;
          } else {
            subChunk = subChunk ? `${subChunk} ${sentence}` : sentence;
          }
        }
      }

      if (subChunk.trim().length >= minChunkLength) {
        chunks.push({
          content: subChunk.trim(),
          chunkIndex: chunkIndex++,
          charCount: subChunk.trim().length,
        });
      }
      continue;
    }

    // Normal paragraph accumulation
    if ((currentChunk + "\n\n" + trimmedPara).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentChunk.length >= minChunkLength) {
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          charCount: currentChunk.trim().length,
        });
      }

      // Overlap: take trailing part of currentChunk and prepend to next
      const overlapText = currentChunk.length > overlap ? currentChunk.slice(-overlap).trim() : "";
      currentChunk = overlapText ? `${overlapText}\n\n${trimmedPara}` : trimmedPara;
    }
  }

  if (currentChunk.trim().length >= minChunkLength) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex++,
      charCount: currentChunk.trim().length,
    });
  }

  // Filter out any accidentally tiny or empty chunks
  return chunks.filter((c) => c.content.length >= minChunkLength);
}