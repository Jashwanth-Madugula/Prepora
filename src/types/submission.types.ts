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