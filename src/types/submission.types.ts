/**
 * @file src/types/submission.types.ts
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

export interface TestCaseResult {
  input: string;

  expected: string;

  actual: string;

  passed: boolean;

  error?: string;
}

export interface SubmissionResult {
  passed: number;

  total: number;

  score: number;

  results: TestCaseResult[];
}