/**
 * @file src/lib/groq.ts
 * @category Utility / Helper Library
 *
 * Why this code exists:
 * Provides shared helper libraries and initializers (such as DB pools, client instances, cryptography, token management).
 * 
 *
 * What problem it solves:
 * - Avoids duplicate config setup blocks by centralizing libraries (such as Cloudinary connection pools, Groq SDK setups, mailers, JWT checkers) to keep code modular.
 *
 * How it works internally:
 * - Loads environment variables, initializes library clients with fail-fast validation checks, and exports clean utility methods for the services and API routers.
 */

import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API || "";

if (!apiKey) {
  console.warn("Warning: GROQ_API_KEY or GROQ_API is not set in environment variables.");
}

export const groq = new Groq({ apiKey });

/**
 * FILE PURPOSE & HELP:
 * This file sets up and exports a single, shared Groq client instance. 
 * By importing `groq` from this centralized helper file, other services (like 
 * `interview-ai.service.ts` and `interview-evaluation.service.ts`) do not need 
 * to manually retrieve API keys or instantiate the Groq SDK repeatedly.
 * It also warns in the server log if the API keys are missing.
 */
