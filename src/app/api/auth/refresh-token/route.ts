/**
 * @file src/app/api/auth/refresh-token/route.ts
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
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { JWTPayload } from "@/types/auth";
import { compareToken, hashToken, isHashed } from "@/lib/token-hash";
import { getIpAddress } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return Response.json(
        { message: "Refresh token is missing" },
        { status: 401 }
      );
    }

    const decoded = verifyRefreshToken<JWTPayload & { rememberMe?: boolean }>(refreshToken);
    if (!decoded) {
      return Response.json(
        { message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Check if the user exists, is not deleted, and refresh token matches
    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted) {
      return Response.json(
        { message: "User not found or account is deactivated" },
        { status: 401 }
      );
    }

    // Find matching session in user.refreshTokens
    let matchingSessionIndex = -1;
    if (user.refreshTokens && user.refreshTokens.length > 0) {
      for (let i = 0; i < user.refreshTokens.length; i++) {
        const session = user.refreshTokens[i];
        if (await compareToken(refreshToken, session.tokenHash)) {
          matchingSessionIndex = i;
          break;
        }
      }
    }

    // Fallback: check legacy single refreshToken field
    let isLegacyMatch = false;
    if (matchingSessionIndex === -1 && user.refreshToken) {
      if (isHashed(user.refreshToken)) {
        isLegacyMatch = await compareToken(refreshToken, user.refreshToken);
      } else {
        isLegacyMatch = user.refreshToken === refreshToken;
      }
    }

    if (matchingSessionIndex === -1 && !isLegacyMatch) {
      return Response.json(
        { message: "Invalid session or token reuse detected" },
        { status: 401 }
      );
    }

    // RTR (Refresh Token Rotation): Generate new access & refresh tokens
    const newAccessToken = signAccessToken({ userId: user._id, email: user.email, role: user.role });
    
    const rememberMe = !!decoded.rememberMe;
    const newRefreshToken = signRefreshToken(
      { userId: user._id, email: user.email, role: user.role, rememberMe },
      rememberMe
    );

    // Save hashed rotated refresh token to user document
    const newHashedToken = await hashToken(newRefreshToken);
    user.refreshToken = newHashedToken;

    const userAgent = req.headers.get("user-agent") || "Unknown Device";
    const ip = getIpAddress(req);

    if (matchingSessionIndex !== -1 && user.refreshTokens) {
      user.refreshTokens[matchingSessionIndex].tokenHash = newHashedToken;
      user.refreshTokens[matchingSessionIndex].lastActive = new Date();
      user.refreshTokens[matchingSessionIndex].ipAddress = ip;
      user.refreshTokens[matchingSessionIndex].userAgent = userAgent;
    } else {
      if (!user.refreshTokens) {
        user.refreshTokens = [];
      }
      user.refreshTokens.push({
        tokenHash: newHashedToken,
        ipAddress: ip,
        userAgent,
        createdAt: new Date(),
        lastActive: new Date(),
      });
    }

    await user.save();

    // Set cookies with rotated values
    const refreshTokenMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    cookieStore.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    cookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: refreshTokenMaxAge,
      path: "/",
    });

    return Response.json(
      { message: "Token refreshed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
