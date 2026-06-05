import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import { profileSchema } from "@/lib/validations/auth";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return verifyAccessToken<JWTPayload>(token);
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(payload.userId).select(
      "-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordTokenExpiry -refreshToken"
    );
    
    if (!user || user.isDeleted) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ user }, { status: 200 });
  } catch (error) {
    console.error("GET profile error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = profileSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { message: "Invalid profile fields", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { fullName, username, bio, college, branch, graduationYear, avatar } = validation.data;

    // Check if username is taken by another user
    const existingUser = await User.findOne({ 
      username: username.toLowerCase(), 
      _id: { $ne: payload.userId } 
    });
    
    if (existingUser) {
      return Response.json({ message: "Username is already taken" }, { status: 409 });
    }

    const parsedGraduationYear = (graduationYear === "" || graduationYear === null || graduationYear === undefined) 
      ? null 
      : Number(graduationYear);

    const updatedUser = await User.findByIdAndUpdate(
      payload.userId,
      {
        $set: {
          fullName,
          username: username.toLowerCase(),
          bio,
          college,
          branch,
          graduationYear: parsedGraduationYear,
          avatar,
        },
      },
      { new: true }
    ).select("-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordTokenExpiry -refreshToken");

    if (!updatedUser) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT profile error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
