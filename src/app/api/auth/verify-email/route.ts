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
