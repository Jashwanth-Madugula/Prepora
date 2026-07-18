/**
 * @file src/types/coding.types.ts
 * @category TypeScript Type Declarations
 *
 * Why this code exists:
 * Provides compile-time TypeScript type definitions and interfaces.
 * - Specifically handles compilation, remote sandbox code execution, code editor configuration, and automated AI reviews.
 *
 * What problem it solves:
 * - Enforces type safety and documents payload contracts between components, services, and route handlers, eliminating standard runtime type errors.
 *
 * How it works internally:
 * - Defines static TypeScript interfaces, types, and enum descriptions. Does not translate to any compiled JavaScript runtime code.
 */

export type Difficulty =
  | "easy"
  | "medium"
  | "hard";

export interface CodingQuestion {
  title: string;

  description: string;

  difficulty: Difficulty;

  topic: string;

  constraints: string[];

  examples: {
    input: string;
    output: string;
    explanation: string;
  }[];

  starterCode: string;

  timeLimit: number;

  memoryLimit: number;
}