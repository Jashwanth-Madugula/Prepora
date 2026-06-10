import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { dbConnect } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Resume } from "@/models/Resume";
import { deleteResumeFromCloudinary } from "@/services/cloudinary.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await dbConnect();

    const userId =
      await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid resume id",
        },
        {
          status: 400,
        }
      );
    }

    const resume =
      await Resume.findOne({
        _id: id,
        userId,
      });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resume not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        resume,
      }
    );
  } catch (error) {
    console.error(
      "Get Resume Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch resume",
      },
      {
        status: 500,
      }
    );
  }
}



export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await dbConnect();

    const userId =
      await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid resume id",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const {
      title,
      isDefault,
    } = body;

    const resume =
      await Resume.findOne({
        _id: id,
        userId,
      });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resume not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      typeof title === "string"
    ) {
      resume.title =
        title.trim();
    }

    if (
      isDefault === true
    ) {
      await Resume.updateMany(
        { userId },
        {
          $set: {
            isDefault: false,
          },
        }
      );

      resume.isDefault =
        true;
    }

    await resume.save();

    return NextResponse.json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error(
      "Update Resume Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update resume",
      },
      {
        status: 500,
      }
    );
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await dbConnect();

    const userId =
      await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } =
      await params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid resume id",
        },
        { status: 400 }
      );
    }

    const resume =
      await Resume.findOne({
        _id: id,
        userId,
      });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resume not found",
        },
        { status: 404 }
      );
    }

    const wasDefault =
      resume.isDefault;

    await deleteResumeFromCloudinary(
      resume.cloudinaryPublicId
    );

    await Resume.deleteOne({
      _id: resume._id,
    });

    if (wasDefault) {
      const nextResume =
        await Resume.findOne({
          userId,
        }).sort({
          createdAt: -1,
        });

      if (nextResume) {
        nextResume.isDefault =
          true;

        await nextResume.save();
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Resume deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Resume Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete resume",
      },
      {
        status: 500,
      }
    );
  }
}