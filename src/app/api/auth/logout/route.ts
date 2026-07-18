/**
 * @file src/app/api/auth/logout/route.ts
 * @category API Route Handler (Backend)
 *
 * Why this code exists:
 * Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.
 * 
 *
 * What problem it solves:
 * - Validates request inputs, manages rate-limiting rules, invokes business logic services, interacts with the database, and returns structured JSON responses and status codes to the frontend client.
 *
 * How it works internally:
 * - Exports async HTTP methods (GET, POST, PUT, DELETE, etc.) which parse query parameters or request body JSONs, connect to MongoDB using dbConnect(), verify permissions, and return NextResponse payloads.
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyRefreshToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import { compareToken } from "@/lib/token-hash";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken) {
      const decoded = verifyRefreshToken<JWTPayload>(refreshToken);
      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user) {
          if (user.refreshTokens && user.refreshTokens.length > 0) {
            const remainingSessions = [];
            for (const s of user.refreshTokens) {
              const isMatch = await compareToken(refreshToken, s.tokenHash);
              if (!isMatch) {
                remainingSessions.push(s);
              }
            }
            user.refreshTokens = remainingSessions;
          }
          if (user.refreshToken) {
            const isMatchLegacy = await compareToken(refreshToken, user.refreshToken);
            if (isMatchLegacy || user.refreshToken === refreshToken) {
              user.refreshToken = undefined;
            }
          }
          await user.save();
        }
      }
    }

    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");

    return Response.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
