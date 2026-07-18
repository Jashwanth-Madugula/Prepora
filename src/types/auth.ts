/**
 * @file src/types/auth.ts
 * @category TypeScript Type Declarations
 *
 * Why this code exists:
 * Provides compile-time TypeScript type definitions and interfaces.
 * 
 *
 * What problem it solves:
 * - Enforces type safety and documents payload contracts between components, services, and route handlers, eliminating standard runtime type errors.
 *
 * How it works internally:
 * - Defines static TypeScript interfaces, types, and enum descriptions. Does not translate to any compiled JavaScript runtime code.
 */

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
