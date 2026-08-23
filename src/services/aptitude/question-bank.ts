/**
 * @file src/services/aptitude/question-bank.ts
 *
 * Local fallback question bank.
 *
 * Used only when Groq AI is unavailable,
 * rate-limited, invalid, or fails validation.
 */

export interface MockQuestion {
  question: string;

  options: string[];

  correctAnswer: string;

  explanation: string;

  difficulty:
    | "easy"
    | "medium"
    | "hard";

  category:
    | "quantitative"
    | "logical"
    | "verbal";
}

export const fallbackQuestions: MockQuestion[] =
  [
    /* =====================================================
       QUANTITATIVE - EASY
       ===================================================== */

    {
      category: "quantitative",
      difficulty: "easy",

      question:
        "If a shirt is bought for $80 and sold for $100, what is the profit percentage?",

      options: [
        "20%",
        "25%",
        "15%",
        "30%",
      ],

      correctAnswer: "25%",

      explanation:
        "Profit = 100 - 80 = 20. Profit percentage = (20 / 80) × 100 = 25%.",
    },

    {
      category: "quantitative",
      difficulty: "easy",

      question:
        "What is 15% of 300?",

      options: [
        "30",
        "45",
        "60",
        "75",
      ],

      correctAnswer: "45",

      explanation:
        "15% of 300 = (15/100) × 300 = 45.",
    },

    {
      category: "quantitative",
      difficulty: "easy",

      question:
        "If the ratio of two numbers is 3:5 and their sum is 80, what is the smaller number?",

      options: [
        "24",
        "30",
        "40",
        "48",
      ],

      correctAnswer: "30",

      explanation:
        "Let the numbers be 3x and 5x. 8x = 80, so x = 10. The smaller number is 30.",
    },

    {
      category: "quantitative",
      difficulty: "easy",

      question:
        "What is 25% of 240?",

      options: [
        "40",
        "50",
        "60",
        "80",
      ],

      correctAnswer: "60",

      explanation:
        "25% means one-fourth. 240 / 4 = 60.",
    },

    {
      category: "quantitative",
      difficulty: "easy",

      question:
        "A number is increased from 200 to 250. What is the percentage increase?",

      options: [
        "20%",
        "25%",
        "30%",
        "15%",
      ],

      correctAnswer: "25%",

      explanation:
        "Increase = 250 - 200 = 50. Percentage increase = 50/200 × 100 = 25%.",
    },

    /* =====================================================
       QUANTITATIVE - MEDIUM
       ===================================================== */

    {
      category: "quantitative",
      difficulty: "medium",

      question:
        "A can complete a piece of work in 12 days, and B can complete the same work in 18 days. If they work together, how many days will they take?",

      options: [
        "6 days",
        "7.2 days",
        "8.5 days",
        "9 days",
      ],

      correctAnswer: "7.2 days",

      explanation:
        "A's rate = 1/12 and B's rate = 1/18. Combined rate = 5/36. Therefore time = 36/5 = 7.2 days.",
    },

    {
      category: "quantitative",
      difficulty: "medium",

      question:
        "A train running at 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",

      options: [
        "120 meters",
        "150 meters",
        "180 meters",
        "324 meters",
      ],

      correctAnswer: "150 meters",

      explanation:
        "60 km/hr = 60 × 5/18 = 50/3 m/s. Distance = speed × time = 50/3 × 9 = 150 meters.",
    },

    {
      category: "quantitative",
      difficulty: "medium",

      question:
        "The average of 5 consecutive numbers is 20. What is the largest number?",

      options: [
        "20",
        "21",
        "22",
        "24",
      ],

      correctAnswer: "22",

      explanation:
        "The middle number is the average, so the numbers are 18, 19, 20, 21, 22. Largest = 22.",
    },

    {
      category: "quantitative",
      difficulty: "medium",

      question:
        "A product costs $500 and is sold at a 20% profit. What is the selling price?",

      options: [
        "$550",
        "$575",
        "$600",
        "$625",
      ],

      correctAnswer: "$600",

      explanation:
        "Profit = 20% of 500 = 100. Selling price = 500 + 100 = 600.",
    },

    {
      category: "quantitative",
      difficulty: "medium",

      question:
        "A car travels 240 km in 4 hours. What is its average speed?",

      options: [
        "50 km/hr",
        "60 km/hr",
        "70 km/hr",
        "80 km/hr",
      ],

      correctAnswer: "60 km/hr",

      explanation:
        "Average speed = distance / time = 240 / 4 = 60 km/hr.",
    },

    /* =====================================================
       QUANTITATIVE - HARD
       ===================================================== */

    {
      category: "quantitative",
      difficulty: "hard",

      question:
        "In how many different ways can the letters of the word 'LEADING' be arranged so that the vowels always come together?",

      options: [
        "360",
        "720",
        "1440",
        "5040",
      ],

      correctAnswer: "720",

      explanation:
        "Treat the three vowels as one block. There are 5 objects, giving 5! arrangements. The three vowels can be arranged in 3! ways. Total = 5! × 3! = 720.",
    },

    {
      category: "quantitative",
      difficulty: "hard",

      question:
        "A bag contains 4 white, 5 red, and 6 blue balls. Three balls are drawn at random. What is the probability that all are red?",

      options: [
        "1/22",
        "2/91",
        "3/91",
        "5/143",
      ],

      correctAnswer: "2/91",

      explanation:
        "Total balls = 15. Total ways = 15C3 = 455. Red selections = 5C3 = 10. Probability = 10/455 = 2/91.",
    },

    {
      category: "quantitative",
      difficulty: "hard",

      question:
        "If x + 1/x = 5, what is x² + 1/x²?",

      options: [
        "21",
        "23",
        "25",
        "27",
      ],

      correctAnswer: "23",

      explanation:
        "Squaring gives x² + 2 + 1/x² = 25. Therefore x² + 1/x² = 23.",
    },

    /* =====================================================
       LOGICAL - EASY
       ===================================================== */

    {
      category: "logical",
      difficulty: "easy",

      question:
        "Look at the series: 2, 4, 8, 16, 32. What comes next?",

      options: [
        "40",
        "48",
        "64",
        "128",
      ],

      correctAnswer: "64",

      explanation:
        "Each number is multiplied by 2. Therefore 32 × 2 = 64.",
    },

    {
      category: "logical",
      difficulty: "easy",

      question:
        "If COFFEE is written as DPGGFF, how is TEA written?",

      options: [
        "UFB",
        "VFB",
        "SDB",
        "UGC",
      ],

      correctAnswer: "UFB",

      explanation:
        "Each letter is shifted forward by one position. T becomes U, E becomes F, and A becomes B.",
    },

    {
      category: "logical",
      difficulty: "easy",

      question:
        "Find the odd one out: Apple, Mango, Carrot, Banana.",

      options: [
        "Apple",
        "Mango",
        "Carrot",
        "Banana",
      ],

      correctAnswer: "Carrot",

      explanation:
        "Apple, mango, and banana are fruits. Carrot is a vegetable.",
    },

    {
      category: "logical",
      difficulty: "easy",

      question:
        "Find the next number: 3, 6, 12, 24, ?",

      options: [
        "36",
        "42",
        "48",
        "54",
      ],

      correctAnswer: "48",

      explanation:
        "Each number is multiplied by 2. Therefore 24 × 2 = 48.",
    },

    /* =====================================================
       LOGICAL - MEDIUM
       ===================================================== */

    {
      category: "logical",
      difficulty: "medium",

      question:
        "Find the odd one out: Gold, Silver, Bronze, Platinum.",

      options: [
        "Gold",
        "Silver",
        "Bronze",
        "Platinum",
      ],

      correctAnswer: "Bronze",

      explanation:
        "Gold, silver, and platinum are elements. Bronze is an alloy.",
    },

    {
      category: "logical",
      difficulty: "medium",

      question:
        "A man walks 5 km south, turns right and walks 3 km, then turns left and walks 5 km. In which direction is he from the starting point?",

      options: [
        "West",
        "South",
        "North-East",
        "South-West",
      ],

      correctAnswer: "South-West",

      explanation:
        "He moves south, then west, then south again. Therefore he is southwest of the starting point.",
    },

    {
      category: "logical",
      difficulty: "medium",

      question:
        "If '+' means '*', '-' means '/', '*' means '+', and '/' means '-', what is 15 + 3 - 5 / 2 * 4?",

      options: [
        "11",
        "13",
        "15",
        "17",
      ],

      correctAnswer: "11",

      explanation:
        "Replace the operators: 15 × 3 ÷ 5 - 2 + 4. This gives 9 - 2 + 4 = 11.",
    },

    {
      category: "logical",
      difficulty: "medium",

      question:
        "If all roses are flowers and some flowers fade quickly, which statement is definitely true?",

      options: [
        "All roses fade quickly",
        "Some roses fade quickly",
        "Roses are flowers",
        "No flowers are roses",
      ],

      correctAnswer: "Roses are flowers",

      explanation:
        "The first statement directly establishes that roses belong to the category of flowers.",
    },

    /* =====================================================
       LOGICAL - HARD
       ===================================================== */

    {
      category: "logical",
      difficulty: "hard",

      question:
        "Five girls are sitting in a row. Bindu is left of Seema, Seema is left of Reha, and Reha is left of Rita. Who is in the middle?",

      options: [
        "Bindu",
        "Seema",
        "Reha",
        "Rita",
      ],

      correctAnswer: "Reha",

      explanation:
        "The order is Bindu, Seema, Reha, Rita. With five positions, Reha would occupy the middle position when the remaining person is placed consistently.",
    },

    {
      category: "logical",
      difficulty: "hard",

      question:
        "A clock shows 3:00. What is the angle between the hour and minute hands?",

      options: [
        "60 degrees",
        "90 degrees",
        "120 degrees",
        "180 degrees",
      ],

      correctAnswer: "90 degrees",

      explanation:
        "At 3:00, the minute hand is at 12 and the hour hand is at 3. The angle is 90 degrees.",
    },

    /* =====================================================
       VERBAL - EASY
       ===================================================== */

    {
      category: "verbal",
      difficulty: "easy",

      question:
        "Select the synonym of 'RESOLUTE'.",

      options: [
        "Undecided",
        "Stubborn",
        "Determined",
        "Frail",
      ],

      correctAnswer: "Determined",

      explanation:
        "Resolute means determined, firm, and unwavering.",
    },

    {
      category: "verbal",
      difficulty: "easy",

      question:
        "She has been living here ___ 2018.",

      options: [
        "for",
        "since",
        "from",
        "during",
      ],

      correctAnswer: "since",

      explanation:
        "'Since' is used with a specific point in time such as 2018.",
    },

    {
      category: "verbal",
      difficulty: "easy",

      question:
        "Identify the antonym of 'VAGUE'.",

      options: [
        "Clear",
        "Dim",
        "Obscure",
        "Hazy",
      ],

      correctAnswer: "Clear",

      explanation:
        "Vague means unclear or uncertain. Its opposite is clear.",
    },

    {
      category: "verbal",
      difficulty: "easy",

      question:
        "Choose the correctly spelled word.",

      options: [
        "Accomodation",
        "Accommodation",
        "Acommodation",
        "Accommadation",
      ],

      correctAnswer: "Accommodation",

      explanation:
        "The correct spelling is Accommodation, with double c and double m.",
    },

    /* =====================================================
       VERBAL - MEDIUM
       ===================================================== */

    {
      category: "verbal",
      difficulty: "medium",

      question:
        "Light is to Blind as Sound is to ___.",

      options: [
        "Deaf",
        "Speech",
        "Silence",
        "Whisper",
      ],

      correctAnswer: "Deaf",

      explanation:
        "A person unable to perceive light is blind. A person unable to perceive sound is deaf.",
    },

    {
      category: "verbal",
      difficulty: "medium",

      question:
        "Identify the grammatically correct sentence.",

      options: [
        "Neither the teacher nor the students was present.",
        "Neither the teacher nor the students were present.",
        "Neither the teacher or the students were present.",
        "Neither the teacher nor the students is present.",
      ],

      correctAnswer:
        "Neither the teacher nor the students were present.",

      explanation:
        "With neither...nor, the verb agrees with the nearer subject. Students is plural, so 'were' is correct.",
    },

    {
      category: "verbal",
      difficulty: "medium",

      question:
        "Choose the best synonym for 'ABUNDANT'.",

      options: [
        "Scarce",
        "Plentiful",
        "Rare",
        "Limited",
      ],

      correctAnswer: "Plentiful",

      explanation:
        "Abundant means available in large quantities, so plentiful is the correct synonym.",
    },

    /* =====================================================
       VERBAL - HARD
       ===================================================== */

    {
      category: "verbal",
      difficulty: "hard",

      question:
        "Find the error: 'The new software has not only increased productivity, but also it improved employee morale.'",

      options: [
        "The new software has",
        "not only increased productivity",
        "but also it improved employee morale",
        "No error",
      ],

      correctAnswer:
        "but also it improved employee morale",

      explanation:
        "The sentence violates parallel structure. It should say 'not only increased productivity but also improved employee morale.'",
    },

    {
      category: "verbal",
      difficulty: "hard",

      question:
        "Choose the word that best completes the sentence: 'Had I known about the meeting, I ___ attended it.'",

      options: [
        "will have",
        "would have",
        "would",
        "will",
      ],

      correctAnswer: "would have",

      explanation:
        "This is a third conditional sentence describing an unreal past situation. The correct form is 'would have attended.'",
    },
  ];