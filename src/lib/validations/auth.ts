import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50),

  username: z
    .string()
    .min(3)
    .max(20)
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers and underscores"
    ),

  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number")
    .regex(
      /[^A-Za-z0-9]/,
      "Must contain special character"
    ),

  confirmPassword: z.string()
})
.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  }
);

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password required"),

  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema =
  z.object({
    email: z
      .string()
      .email("Invalid email address")
  });


  export const resetPasswordSchema =
  z.object({
    token: z.string(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),

    confirmPassword: z.string()
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }
  );

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20)
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers and underscores"
    ),

  bio: z.string().max(250).optional().or(z.literal("")),
  college: z.string().optional().or(z.literal("")),
  branch: z.string().optional().or(z.literal("")),
  graduationYear: z.union([z.number(), z.string(), z.null()]).optional(),
  avatar: z.string().optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  confirmPassword: z.string()
})
.refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "New passwords do not match",
    path: ["confirmPassword"]
  }
);

  export type RegisterInput =
  z.infer<typeof registerSchema>;

export type LoginInput =
  z.infer<typeof loginSchema>;

export type ForgotPasswordInput =
  z.infer<typeof forgotPasswordSchema>;

export type ResetPasswordInput =
  z.infer<typeof resetPasswordSchema>;

export type ProfileInput =
  z.infer<typeof profileSchema>;

export type ChangePasswordInput =
  z.infer<typeof changePasswordSchema>;