/**
 * @file src/lib/jwt.ts
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

import jwt from "jsonwebtoken";

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET environment variable is missing.");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET environment variable is missing.");
}

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: object, rememberMe?: boolean): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: rememberMe ? "30d" : "7d" });
}

export function verifyAccessToken<T extends object>(token: string): T | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as T;
  } catch {
    return null;
  }
}

export function verifyRefreshToken<T extends object>(token: string): T | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as T;
  } catch {
    return null;
  }
}
