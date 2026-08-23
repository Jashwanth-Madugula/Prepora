/**
 * @file src/services/aptitude/aptitude-ai.service.ts
 *
 * Generates dynamic aptitude questions using Groq.
 *
 * Strategy:
 * 1. Try Groq AI first.
 * 2. Generate questions in small batches to prevent truncated responses.
 * 3. Validate every generated question.
 * 4. Remove duplicates.
 * 5. If AI fails, use the local question bank.
 * 6. ALWAYS return exactly the requested number of questions.
 */

import Groq from "groq-sdk";
import {
  fallbackQuestions,
  MockQuestion,
} from "./question-bank";

export interface IGeneratedAptitudeQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

/* =========================================================
   LOCAL FALLBACK
   ========================================================= */

function getLocalQuestions(
  category: string,
  difficulty: string,
  totalQuestions: number,
  excludeQuestionTexts: string[] = []
): MockQuestion[] {
  const targetDifficulty =
    difficulty === "adaptive" ? "medium" : difficulty;

  const excluded = new Set(
    excludeQuestionTexts.map((q) =>
      q.trim().toLowerCase()
    )
  );

  /*
   * First preference:
   * category + difficulty
   */
  let pool = fallbackQuestions.filter((q) => {
    const categoryMatches =
      category === "mixed" ||
      q.category === category;

    const difficultyMatches =
      q.difficulty === targetDifficulty;

    const notExcluded =
      !excluded.has(
        q.question.trim().toLowerCase()
      );

    return (
      categoryMatches &&
      difficultyMatches &&
      notExcluded
    );
  });

  /*
   * Second preference:
   * category only
   */
  if (pool.length < totalQuestions) {
    const categoryPool =
      fallbackQuestions.filter((q) => {
        const categoryMatches =
          category === "mixed" ||
          q.category === category;

        const notExcluded =
          !excluded.has(
            q.question.trim().toLowerCase()
          );

        return categoryMatches && notExcluded;
      });

    if (categoryPool.length > 0) {
      pool = categoryPool;
    }
  }

  /*
   * Final preference:
   * Entire question bank
   */
  if (pool.length === 0) {
    pool = fallbackQuestions;
  }

  /*
   * Shuffle
   */
  const shuffled = [...pool].sort(
    () => Math.random() - 0.5
  );

  /*
   * IMPORTANT:
   *
   * The old code used:
   *
   * shuffled.slice(0, totalQuestions)
   *
   * If the bank contains only 8 questions,
   * requesting 10 returns only 8.
   *
   * We instead keep cycling through the bank
   * until we have exactly totalQuestions.
   */
  const result: MockQuestion[] = [];

  let index = 0;

  while (result.length < totalQuestions) {
    result.push(
      shuffled[index % shuffled.length]
    );

    index++;
  }

  return result;
}

/* =========================================================
   VALIDATION
   ========================================================= */

function isValidQuestion(
  question: any
): question is IGeneratedAptitudeQuestion {
  if (
    !question ||
    typeof question !== "object"
  ) {
    return false;
  }

  if (
    typeof question.question !== "string" ||
    question.question.trim().length === 0
  ) {
    return false;
  }

  if (
    !Array.isArray(question.options) ||
    question.options.length !== 4
  ) {
    return false;
  }

  /*
   * All options must be strings
   */
  if (
    question.options.some(
      (option: unknown) =>
        typeof option !== "string" ||
        option.trim().length === 0
    )
  ) {
    return false;
  }

  /*
   * Options must be unique
   */
  const normalizedOptions =
    question.options.map(
      (option: string) =>
        option.trim().toLowerCase()
    );

  if (
    new Set(normalizedOptions).size !== 4
  ) {
    return false;
  }

  /*
   * Correct answer must exist
   */
  if (
    typeof question.correctAnswer !==
      "string" ||
    question.correctAnswer.trim().length === 0
  ) {
    return false;
  }

  /*
   * Correct answer MUST exactly match
   * one of the four options.
   */
  if (
    !question.options.includes(
      question.correctAnswer
    )
  ) {
    return false;
  }

  /*
   * Explanation required
   */
  if (
    typeof question.explanation !==
      "string" ||
    question.explanation.trim().length === 0
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   DUPLICATE REMOVAL
   ========================================================= */

function removeDuplicateQuestions(
  questions: IGeneratedAptitudeQuestion[]
): IGeneratedAptitudeQuestion[] {
  const seen = new Set<string>();

  return questions.filter((question) => {
    const key =
      question.question
        .trim()
        .toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

/* =========================================================
   JSON SCHEMA
   ========================================================= */

const aptitudeJsonSchema = {
  type: "object",

  properties: {
    questions: {
      type: "array",

      items: {
        type: "object",

        properties: {
          question: {
            type: "string",
          },

          options: {
            type: "array",

            items: {
              type: "string",
            },
          },

          correctAnswer: {
            type: "string",
          },

          explanation: {
            type: "string",
          },
        },

        required: [
          "question",
          "options",
          "correctAnswer",
          "explanation",
        ],

        additionalProperties: false,
      },
    },
  },

  required: ["questions"],

  additionalProperties: false,
};

/* =========================================================
   GENERATE ONE BATCH
   ========================================================= */

async function generateBatch(
  category: string,
  difficulty: string,
  count: number,
  company?: string,
  excludeQuestionTexts: string[] = []
): Promise<IGeneratedAptitudeQuestion[]> {
  const model =
    process.env.GROQ_MODEL ||
    "openai/gpt-oss-20b";

  const companyInstruction = company
    ? `
The test should resemble the general aptitude
difficulty and style expected in recruitment
screening for ${company}.

Do NOT claim these questions are actual
questions from ${company}.

Generate completely original questions.
`
    : "";

  const avoidInstruction =
    excludeQuestionTexts.length > 0
      ? `
DO NOT repeat any of these existing questions:

${excludeQuestionTexts
  .slice(0, 50)
  .map((q) => `- ${q}`)
  .join("\n")}
`
      : "";

  const prompt = `
Generate EXACTLY ${count} ORIGINAL aptitude
multiple-choice questions.

Category:
${category}

Difficulty:
${difficulty}

${companyInstruction}

${avoidInstruction}

Rules:

1. Generate exactly ${count} questions.
2. Every question must be original.
3. Do not repeat questions.
4. Every question must have exactly 4 options.
5. There must be exactly one correct answer.
6. correctAnswer must exactly match one option.
7. Every question must contain an explanation.
8. Quantitative questions must include the calculation
   in the explanation.
9. Logical questions must explain the reasoning.
10. Verbal questions must explain the language rule.
11. Do not generate placeholder questions.
12. Do not include markdown.
13. Return only the requested JSON structure.

IMPORTANT:
Keep explanations concise enough to ensure ALL
${count} questions are generated.

The response must contain a "questions" array.
`;

  console.log(
    "----------------------------------------"
  );

  console.log(
    "Generating aptitude batch"
  );

  console.log("Model:", model);
  console.log("Category:", category);
  console.log("Difficulty:", difficulty);
  console.log("Batch size:", count);

  try {
    const completion =
      await groq.chat.completions.create({
        model,

        messages: [
          {
            role: "system",

            content:
              "You are a professional aptitude assessment generator. Generate original, technically accurate multiple-choice questions. Follow the JSON schema exactly.",
          },

          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.7,

        /*
         * GPT-OSS-20B supports strict structured
         * outputs on Groq.
         */
        response_format: {
          type: "json_schema",

          json_schema: {
            name: "aptitude_questions",

            strict: true,

            schema:
              aptitudeJsonSchema,
          },
        },

        /*
         * Enough output space for a batch.
         */
        max_completion_tokens: 6000,

        /*
         * Prevent unnecessary reasoning from
         * consuming the output budget.
         */
        reasoning_effort: "low",
      });

    const responseText =
      completion.choices[0]?.message
        ?.content;

    if (!responseText) {
      throw new Error(
        "Groq returned an empty response."
      );
    }

    console.log(
      "Groq response received."
    );

    const parsed = JSON.parse(
      responseText
    );

    if (
      !parsed ||
      !Array.isArray(parsed.questions)
    ) {
      throw new Error(
        "Groq response does not contain questions array."
      );
    }

    const validQuestions =
      parsed.questions.filter(
        isValidQuestion
      );

    const uniqueQuestions =
      removeDuplicateQuestions(
        validQuestions
      );

    console.log(
      `Requested: ${count}`
    );

    console.log(
      `Received: ${parsed.questions.length}`
    );

    console.log(
      `Valid: ${validQuestions.length}`
    );

    console.log(
      `Unique: ${uniqueQuestions.length}`
    );

    return uniqueQuestions;
  } catch (error: any) {
    console.error(
      "Groq batch generation failed."
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Code:",
      error?.code
    );

    throw error;
  }
}

/* =========================================================
   MAIN GENERATOR
   ========================================================= */

export async function generateAptitudeQuestions(
  category: string,
  difficulty: string,
  totalQuestions: number,
  company?: string,
  excludeQuestionTexts: string[] = []
): Promise<
  IGeneratedAptitudeQuestion[] | MockQuestion[]
> {
  if (
    !totalQuestions ||
    totalQuestions <= 0
  ) {
    throw new Error(
      "totalQuestions must be greater than 0."
    );
  }

  /*
   * Adaptive testing intentionally starts
   * with one question.
   */
  const targetDifficulty =
    difficulty === "adaptive"
      ? "medium"
      : difficulty;

  /*
   * No API key -> fallback.
   */
  if (!process.env.GROQ_API_KEY) {
    console.warn(
      "GROQ_API_KEY is missing."
    );

    return getLocalQuestions(
      category,
      targetDifficulty,
      totalQuestions,
      excludeQuestionTexts
    );
  }

  /*
   * We generate small batches.
   *
   * Example:
   * 10 questions
   *
   * Batch 1 -> 5
   * Batch 2 -> 5
   *
   * This is much safer than asking the model
   * to generate 10 long questions in one response.
   */
  const batchSize = 5;

  const generated: IGeneratedAptitudeQuestion[] =
    [];

  const usedQuestions = [
    ...excludeQuestionTexts,
  ];

  try {
    while (
      generated.length <
      totalQuestions
    ) {
      const remaining =
        totalQuestions -
        generated.length;

      const currentBatchSize =
        Math.min(
          batchSize,
          remaining
        );

      /*
       * Maximum attempts for each batch.
       */
      let batchSuccess = false;

      for (
        let attempt = 1;
        attempt <= 2;
        attempt++
      ) {
        try {
          console.log(
            `Generating batch: ${currentBatchSize}, attempt: ${attempt}`
          );

          const batch =
            await generateBatch(
              category,
              targetDifficulty,
              currentBatchSize,
              company,
              usedQuestions
            );

          if (
            batch.length ===
            currentBatchSize
          ) {
            generated.push(
              ...batch
            );

            usedQuestions.push(
              ...batch.map(
                (q) => q.question
              )
            );

            batchSuccess = true;

            break;
          }

          /*
           * If fewer questions were generated,
           * retry the batch.
           */
          console.warn(
            `AI returned ${batch.length}/${currentBatchSize} questions. Retrying...`
          );
        } catch (error) {
          console.error(
            `Batch attempt ${attempt} failed.`
          );
        }
      }

      /*
       * If AI cannot generate the batch,
       * stop AI generation and use fallback
       * for the remaining questions.
       */
      if (!batchSuccess) {
        console.warn(
          "AI could not generate the required batch."
        );

        break;
      }
    }

    /*
     * Remove duplicates one final time.
     */
    const uniqueGenerated =
      removeDuplicateQuestions(
        generated
      );

    /*
     * If AI generated all requested questions,
     * return them.
     */
    if (
      uniqueGenerated.length >=
      totalQuestions
    ) {
      console.log(
        `SUCCESS: Generated exactly ${totalQuestions} AI questions.`
      );

      return uniqueGenerated.slice(
        0,
        totalQuestions
      );
    }

    /*
     * AI generated some questions but not enough.
     *
     * Fill ONLY the missing questions
     * from local bank.
     */
    const missing =
      totalQuestions -
      uniqueGenerated.length;

    console.warn(
      `AI generated ${uniqueGenerated.length}/${totalQuestions}. Filling ${missing} question(s) from fallback bank.`
    );

    const fallback =
      getLocalQuestions(
        category,
        targetDifficulty,
        missing,
        [
          ...excludeQuestionTexts,
          ...uniqueGenerated.map(
            (q) => q.question
          ),
        ]
      );

    return [
      ...uniqueGenerated,
      ...fallback,
    ].slice(0, totalQuestions);
  } catch (error: any) {
    console.error(
      "========================================"
    );

    console.error(
      "APTITUDE AI GENERATION FAILED"
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "========================================"
    );

    /*
     * Final safety fallback.
     */
    return getLocalQuestions(
      category,
      targetDifficulty,
      totalQuestions,
      excludeQuestionTexts
    );
  }
}