/**
 * @file src/app/api/user/delete-account/route.ts
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
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import { comparePassword } from "@/lib/bcrypt";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return Response.json({ message: "Password is required" }, { status: 400 });
    }

    const user = await User.findById(payload.userId);
    if (!user || user.isDeleted) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    // Verify password confirmation
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return Response.json(
        { message: "Incorrect password. Account deletion aborted." },
        { status: 400 }
      );
    }

    // Soft delete
    user.isDeleted = true;
    user.refreshToken = undefined;
    await user.save();

    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");

    return Response.json(
      { message: "Your account has been deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete account error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
