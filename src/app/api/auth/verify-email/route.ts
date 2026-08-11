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

async function verifyToken(token: string) {
  if (!token) {
    return { 
      success: false, 
      status: 400, 
      message: "Verification token is required" 
    };
  }

  // Find user by verification token
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return { 
      success: false, 
      status: 400, 
      message: "Invalid or expired verification token. Please request a new verification email if needed." 
    };
  }

  // Check expiry
  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    return { 
      success: false, 
      status: 400, 
      message: "Verification token has expired. Please request a new verification email." 
    };
  }

  // Update user verification status
  user.isVerified = true;
  user.verificationToken = undefined; // remove the token
  user.verificationTokenExpiry = undefined;
  await user.save();

  return { 
    success: true, 
    status: 200, 
    message: "Email verified successfully. You can now log in." 
  };
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    let token: string | undefined;
    try {
      const body = await req.json();
      token = body?.token;
    } catch {
      token = req.nextUrl.searchParams.get("token") || undefined;
    }

    if (!token) {
      token = req.nextUrl.searchParams.get("token") || undefined;
    }

    const result = await verifyToken(token || "");
    return Response.json(
      { message: result.message, success: result.success },
      { status: result.status }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return Response.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.nextUrl.searchParams.get("token") || "";

    const acceptHeader = req.headers.get("accept") || "";
    // If request comes directly from a browser navigation expecting HTML, redirect to UI page
    if (acceptHeader.includes("text/html")) {
      const redirectUrl = new URL("/verify-email", req.url);
      if (token) {
        redirectUrl.searchParams.set("token", token);
      }
      return Response.redirect(redirectUrl);
    }

    const result = await verifyToken(token);
    return Response.json(
      { message: result.message, success: result.success },
      { status: result.status }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return Response.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

