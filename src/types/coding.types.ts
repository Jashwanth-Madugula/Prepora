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