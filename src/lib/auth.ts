/**
 * @file src/lib/auth.ts
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

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get("accessToken")
        ?.value;

    if (!accessToken) {
      return null;
    }

    const payload =
      verifyAccessToken(
        accessToken
      ) as JwtPayload;

    return payload.userId;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get("accessToken")
        ?.value;

    if (!accessToken) {
      return null;
    }

    const payload =
      verifyAccessToken(
        accessToken
      ) as JwtPayload;

    return payload;
  } catch {
    return null;
  }
}