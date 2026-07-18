/**
 * @file src/app/api/auth/register/route.ts
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
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/bcrypt";
import { sendVerificationEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { message: "Invalid input fields", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { fullName, username, email, password } = validation.data;

    // Check if user with this email or username already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return Response.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return Response.json(
        { message: "Username is already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token and expiry (24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
      isDeleted: false,
      role: "USER"
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError);
      if (process.env.NODE_ENV !== "production") {
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
        console.log("\n==================================================");
        console.log("DEVELOPMENT VERIFICATION LINK:");
        console.log(verifyUrl);
        console.log("==================================================\n");
      }
    }

    return Response.json(
      {
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
