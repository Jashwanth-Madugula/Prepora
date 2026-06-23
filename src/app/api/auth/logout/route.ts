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
