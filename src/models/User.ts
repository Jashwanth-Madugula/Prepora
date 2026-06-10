import mongoose, { Document, Model } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  username: string;
  email: string;
  password: string;

  role: "USER" | "ADMIN" | "SUPER_ADMIN";

  isVerified: boolean;
  isDeleted: boolean;

  verificationToken?: string;
  verificationTokenExpiry?: Date;

  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;

  refreshToken?: string;

  loginAttempts: number;
  lockUntil?: Date;
}


const UserSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN", "SUPER_ADMIN"],
      default: "USER",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,

    verificationTokenExpiry: Date,

    resetPasswordToken: String,

    resetPasswordTokenExpiry: Date,

    refreshToken: String,

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);