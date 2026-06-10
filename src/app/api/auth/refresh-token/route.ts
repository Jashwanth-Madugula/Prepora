import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { JWTPayload } from "@/types/auth";
import { compareToken, hashToken, isHashed } from "@/lib/token-hash";

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

    if (!user.refreshToken) {
      return Response.json(
        { message: "Invalid session or no active session found" },
        { status: 401 }
      );
    }

    // Match refresh token (with support for legacy plain-text migration)
    let isTokenMatch = false;
    if (isHashed(user.refreshToken)) {
      isTokenMatch = await compareToken(refreshToken, user.refreshToken);
    } else {
      isTokenMatch = user.refreshToken === refreshToken;
    }

    if (!isTokenMatch) {
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
    user.refreshToken = await hashToken(newRefreshToken);
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
