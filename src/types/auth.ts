export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

export interface AuthResponse {
  user: Omit<User, "createdAt" | "updatedAt">;
  accessToken: string;
}
