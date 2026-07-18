/**
 * @file src/lib/token-hash.ts
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

import bcrypt from "bcryptjs";

export async function hashToken(token: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
}

export async function compareToken(token: string, hashedToken: string): Promise<boolean> {
  return bcrypt.compare(token, hashedToken);
}

export function isHashed(token: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(token);
}
