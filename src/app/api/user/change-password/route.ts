/**
 * @file src/app/api/user/change-password/route.ts
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
import { changePasswordSchema } from "@/lib/validations/auth";
import { comparePassword, hashPassword } from "@/lib/bcrypt";

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

    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { message: "Invalid input fields", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await User.findById(payload.userId);
    if (!user || user.isDeleted) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return Response.json(
        { message: "Incorrect current password" },
        { status: 400 }
      );
    }

    // Hash and save new password
    user.password = await hashPassword(newPassword);
    
    // Clear all active sessions / refresh token
    user.refreshToken = undefined;
    
    await user.save();

    // Sign out user by clearing cookies
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");

    return Response.json(
      { message: "Password changed successfully. Please log in again." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
