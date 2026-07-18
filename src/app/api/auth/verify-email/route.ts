/**
 * @file src/app/api/auth/verify-email/route.ts
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

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { token } = await req.json();

    if (!token) {
      return Response.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return Response.json(
        { message: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check expiry
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      return Response.json(
        { message: "Verification token has expired. Please register again or request another verification email." },
        { status: 400 }
      );
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined; // remove the token
    user.verificationTokenExpiry = undefined;
    await user.save();

    return Response.json(
      { message: "Email verified successfully. You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
