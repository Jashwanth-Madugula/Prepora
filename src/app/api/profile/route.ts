import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Profile } from "@/models/Profile";
import { verifyAccessToken } from "@/lib/jwt";
import { JWTPayload } from "@/types/auth";
import { profileSchema } from "@/lib/validations/profile";

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

    const user = await User.findById(payload.userId).select("-password");
    if (!user || user.isDeleted) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const profile = await Profile.findOne({ userId: payload.userId });
    if (!profile) {
      return Response.json({ message: "Profile not found", profile: null }, { status: 404 });
    }

    const mergedProfile = {
      ...profile.toObject(),
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    };

    return Response.json({ profile: mergedProfile }, { status: 200 });
  } catch (error) {
    console.error("GET profile error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const existingProfile = await Profile.findOne({ userId: payload.userId });
    if (existingProfile) {
      return Response.json({ message: "Profile already exists" }, { status: 409 });
    }

    const body = await req.json();
    const validation = profileSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { message: "Invalid profile fields", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { fullName, username, ...profileData } = validation.data;
    const user = await User.findById(payload.userId);
    if (!user || user.isDeleted) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    if (fullName) user.fullName = fullName;
    if (username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: payload.userId },
      });
      if (existingUser) {
        return Response.json({ message: "Username is already taken" }, { status: 409 });
      }
      user.username = username.toLowerCase();
    }
    await user.save();

    const profile = await Profile.create({
      userId: payload.userId,
      ...profileData,
    });

    const mergedProfile = {
      ...profile.toObject(),
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    };

    return Response.json(
      { message: "Profile created successfully", profile: mergedProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST profile error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    const { fullName, username, ...profileData } = validation.data;
    const user = await User.findById(payload.userId);
    if (!user || user.isDeleted) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    if (fullName) user.fullName = fullName;
    if (username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: payload.userId },
      });
      if (existingUser) {
        return Response.json({ message: "Username is already taken" }, { status: 409 });
      }
      user.username = username.toLowerCase();
    }
    await user.save();

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: payload.userId },
      { $set: profileData },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return Response.json({ message: "Profile not found" }, { status: 404 });
    }

    const mergedProfile = {
      ...updatedProfile.toObject(),
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    };

    return Response.json(
      { message: "Profile updated successfully", profile: mergedProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH profile error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const payload = await getAuthUser();
    if (!payload) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const deletedProfile = await Profile.findOneAndDelete({ userId: payload.userId });
    if (!deletedProfile) {
      return Response.json({ message: "Profile not found" }, { status: 404 });
    }

    return Response.json({ message: "Profile deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE profile error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
