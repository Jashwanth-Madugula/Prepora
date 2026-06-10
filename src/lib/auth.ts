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