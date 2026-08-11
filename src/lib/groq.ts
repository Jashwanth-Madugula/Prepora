/**
 * @file src/lib/groq.ts
 * @category Utility / Helper Library
 *
 * Why this code exists:
 * Provides shared Groq client instance and initializers with lazy evaluation.
 * Avoids module top-level crashes when environment variables are loaded dynamically.
 */

import Groq from "groq-sdk";

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (groqInstance) {
    return groqInstance;
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API || "";
  if (!apiKey) {
    console.warn("Warning: GROQ_API_KEY or GROQ_API is not set in environment variables.");
  }

  groqInstance = new Groq({ apiKey });
  return groqInstance;
}

export const groq = {
  get chat() {
    return getGroqClient().chat;
  },
  get audio() {
    return getGroqClient().audio;
  },
};
