/**
 * @file src/app/api/auth/login/route.ts
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
import { loginSchema } from "@/lib/validations/auth";
import { comparePassword } from "@/lib/bcrypt";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { checkRateLimit, getIpAddress } from "@/lib/rateLimit";
import { hashToken } from "@/lib/token-hash";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. IP Rate Limiting (5 attempts / 15 minutes)
    const ip = getIpAddress(req);
    const rateLimitResult = await checkRateLimit({
      key: `login:${ip}`,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimitResult.success) {
      const waitMinutes = Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / (60 * 1000));
      return Response.json(
        { message: `Too many login attempts. Please try again in ${waitMinutes} minutes.` },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { message: "Invalid input fields", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = validation.data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 2. Check soft delete
    if (user.isDeleted) {
      return Response.json(
        { message: "This account has been deactivated." },
        { status: 403 }
      );
    }

    // 3. Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      return Response.json(
        { message: `Account is temporarily locked. Try again in ${waitMinutes} minutes.` },
        { status: 403 }
      );
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 10 failed attempts
      if (user.loginAttempts >= 10) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }
      
      await user.save();

      return Response.json(
        { 
          message: "Invalid email or password",
          remainingAttempts: Math.max(0, 10 - user.loginAttempts),
        },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      return Response.json(
        { message: "Please verify your email address before logging in." },
        { status: 403 }
      );
    }

    // Reset lockout counters on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Dynamic expiry for Refresh Token based on Remember Me
    const refreshTokenExpiryString = rememberMe ? "30d" : "7d";
    const refreshTokenMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    // Sign tokens (containing userId, email, role, and rememberMe flag)
    const accessToken = signAccessToken({ userId: user._id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id, email: user.email, role: user.role, rememberMe }, rememberMe);

    // Save hashed refresh token to user document and session list
    const tokenHash = await hashToken(refreshToken);
    user.refreshToken = tokenHash;

    const userAgent = req.headers.get("user-agent") || "Unknown Device";
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push({
      tokenHash,
      ipAddress: ip,
      userAgent,
      createdAt: new Date(),
      lastActive: new Date(),
    });

    // Limit concurrent sessions to 5 to prevent document bloat
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }

    await user.save();

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: refreshTokenMaxAge,
      path: "/",
    });

    return Response.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
