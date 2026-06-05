import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { JWTPayload } from "@/types/auth";

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

    const decoded = verifyRefreshToken<JWTPayload>(refreshToken);
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

    // Secure validation: match against stored refresh token
    if (user.refreshToken !== refreshToken) {
      return Response.json(
        { message: "Invalid session or token reuse detected" },
        { status: 401 }
      );
    }

    // Sign new access token containing role
    const newAccessToken = signAccessToken({ userId: user._id, email: user.email, role: user.role });

    // Set new access token cookie
    cookieStore.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
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
