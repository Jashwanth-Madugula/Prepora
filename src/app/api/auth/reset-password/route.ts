import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/bcrypt";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { message: "Invalid input fields", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Find user with active token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return Response.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (user.isDeleted) {
      return Response.json(
        { message: "This account has been deactivated." },
        { status: 403 }
      );
    }

    // Update password
    user.password = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    
    // Invalidate all active sessions upon password reset
    user.refreshToken = undefined;
    
    // Automatically verify user if they were not verified yet (since they completed email flow)
    if (!user.isVerified) {
      user.isVerified = true;
    }
    
    await user.save();

    return Response.json(
      { message: "Password reset successful. You can now log in with your new password." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
