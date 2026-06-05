import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit, getIpAddress } from "@/lib/rateLimit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. IP Rate Limiting (3 attempts / 1 hour)
    const ip = getIpAddress(req);
    const rateLimitResult = await checkRateLimit({
      key: `forgot-password:${ip}`,
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.success) {
      const waitMinutes = Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / (60 * 1000));
      return Response.json(
        { message: `Too many password reset requests. Please try again in ${waitMinutes} minutes.` },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { message: "Please enter a valid email address", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't disclose that the user doesn't exist
      return Response.json(
        { message: "If that email address exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    // Generate reset token and expiry (15 minutes)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiry = resetPasswordTokenExpiry;
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (mailError) {
      console.error("Failed to send reset password email:", mailError);
      if (process.env.NODE_ENV !== "production") {
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
        console.log("\n==================================================");
        console.log("DEVELOPMENT RESET PASSWORD LINK:");
        console.log(resetUrl);
        console.log("==================================================\n");
      }
    }

    return Response.json(
      { message: "If that email address exists, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
