import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyRefreshToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken) {
      const decoded = verifyRefreshToken<JWTPayload>(refreshToken);
      if (decoded) {
        await User.findByIdAndUpdate(decoded.userId, {
          $unset: { refreshToken: "" }
        });
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
