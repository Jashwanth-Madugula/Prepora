/**
 * @file src/app/api/auth/sessions/route.ts
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

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import { compareToken } from "@/lib/token-hash";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

// GET: Returns list of active sessions
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const currentRefreshToken = cookieStore.get("refreshToken")?.value;

    const user = await User.findById(payload.userId);
    if (!user || user.isDeleted) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const sessions = [];
    if (user.refreshTokens && user.refreshTokens.length > 0) {
      for (const s of user.refreshTokens) {
        let isCurrent = false;
        if (currentRefreshToken) {
          isCurrent = await compareToken(currentRefreshToken, s.tokenHash);
        }
        sessions.push({
          id: s._id?.toString() || "",
          ipAddress: s.ipAddress || "Unknown IP",
          userAgent: s.userAgent || "Unknown Device",
          createdAt: s.createdAt,
          lastActive: s.lastActive,
          isCurrent,
        });
      }
    }

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error("GET sessions error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Terminate a specific session or logout all other devices
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId, logoutOthers } = body;

    const cookieStore = await cookies();
    const currentRefreshToken = cookieStore.get("refreshToken")?.value;

    const user = await User.findById(payload.userId);
    if (!user || user.isDeleted) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (logoutOthers) {
      if (!currentRefreshToken) {
        return NextResponse.json({ success: false, error: "Current session token missing" }, { status: 400 });
      }

      // Filter sessions array to keep only the one matching currentRefreshToken
      const preservedSessions = [];
      for (const s of user.refreshTokens || []) {
        const isCurrent = await compareToken(currentRefreshToken, s.tokenHash);
        if (isCurrent) {
          preservedSessions.push(s);
        }
      }
      user.refreshTokens = preservedSessions;
      await user.save();
      return NextResponse.json({ success: true, message: "Logged out other devices successfully" });
    }

    if (sessionId) {
      // Find the session to remove
      const sessionToRemove = user.refreshTokens?.find((s) => s._id?.toString() === sessionId);
      if (!sessionToRemove) {
        return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
      }

      // Check if candidate is trying to log out current session via this endpoint
      let isCurrent = false;
      if (currentRefreshToken) {
        isCurrent = await compareToken(currentRefreshToken, sessionToRemove.tokenHash);
      }

      // Remove the session from list
      user.refreshTokens = user.refreshTokens?.filter((s) => s._id?.toString() !== sessionId) || [];
      await user.save();

      // If revoking current session, clear cookies
      if (isCurrent) {
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");
        return NextResponse.json({ success: true, message: "Current session ended. Logged out.", loggedOutSelf: true });
      }

      return NextResponse.json({ success: true, message: "Session ended successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action parameter" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE session error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
