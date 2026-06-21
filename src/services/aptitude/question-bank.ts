/**
 * File Purpose:
 * This file contains a high-quality local repository of aptitude questions spanning three core areas:
 * - Quantitative Aptitude (Mathematics, percentages, profit & loss, algebra, time/work)
 * - Logical Reasoning (Sequences, coding-decoding, relationships, arrangements)
 * - Verbal Ability (Grammar, vocabulary, sentence completion, analogies)
 *
 * Each question is labeled with a difficulty level ("easy", "medium", "hard") and includes
 * multiple-choice options, a correct answer, and a detailed explanation. This question bank is used:
 * 1. For local testing.
 * 2. As a bulletproof offline fallback if the external AI service (Groq) fails or is throttled.
 */

export interface MockQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  category: "quantitative" | "logical" | "verbal";
}

export const fallbackQuestions: MockQuestion[] = [
  // ==================== QUANTITATIVE APTITUDE ====================
  // EASY
  {
    category: "quantitative",
    difficulty: "easy",
    question: "If a shirt is bought for $80 and sold for $100, what is the profit percentage?",
    options: ["20%", "25%", "15%", "30%"],
    correctAnswer: "25%",
    explanation: "Profit = Selling Price ($100) - Cost Price ($80) = $20. Profit Percentage = (Profit / Cost Price) * 100 = (20 / 80) * 100 = 25%."
  },
  {
    category: "quantitative",
    difficulty: "easy",
    question: "What is 15% of 300?",
    options: ["30", "45", "60", "75"],
    correctAnswer: "45",
    explanation: "15% of 300 = (15 / 100) * 300 = 15 * 3 = 45."
  },
  {
    category: "quantitative",
    difficulty: "easy",
    question: "If the ratio of two numbers is 3:5 and their sum is 80, what is the smaller number?",
    options: ["24", "30", "40", "48"],
    correctAnswer: "30",
    explanation: "Let the numbers be 3x and 5x. 3x + 5x = 80 => 8x = 80 => x = 10. The smaller number is 3x = 3 * 10 = 30."
  },
  // MEDIUM
  {
    category: "quantitative",
    difficulty: "medium",
    question: "A can complete a piece of work in 12 days, and B can complete the same work in 18 days. If they work together, how many days will they take?",
    options: ["6 days", "7.2 days", "8.5 days", "9 days"],
    correctAnswer: "7.2 days",
    explanation: "A's 1-day work = 1/12. B's 1-day work = 1/18. Combined 1-day work = (1/12) + (1/18) = (3 + 2) / 36 = 5/36. Therefore, the time taken working together is 36/5 = 7.2 days."
  },
  {
    category: "quantitative",
    difficulty: "medium",
    question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
    options: ["120 meters", "150 meters", "180 meters", "324 meters"],
    correctAnswer: "150 meters",
    explanation: "Speed in m/s = 60 * (5/18) = 50/3 m/s. Distance (length of train) = Speed * Time = (50/3) * 9 = 50 * 3 = 150 meters."
  },
  {
    category: "quantitative",
    difficulty: "medium",
    question: "The average of 5 consecutive numbers is 20. What is the largest of these numbers?",
    options: ["20", "21", "22", "24"],
    correctAnswer: "22",
    explanation: "Let the five consecutive numbers be x, x+1, x+2, x+3, x+4. Their sum is 5x + 10. Average = (5x + 10) / 5 = x + 2 = 20 => x = 18. The largest number is x + 4 = 18 + 4 = 22."
  },
  // HARD
  {
    category: "quantitative",
    difficulty: "hard",
    question: "In how many different ways can the letters of the word 'LEADING' be arranged in such a way that the vowels always come together?",
    options: ["360", "720", "1440", "5040"],
    correctAnswer: "720",
    explanation: "The word 'LEADING' has 7 letters, where E, A, I are vowels. Group the vowels (EAI) as one entity. Now we have 5 entities to arrange: L, D, N, G, and (EAI), which can be arranged in 5! = 120 ways. Within the vowels group, the 3 vowels can be arranged in 3! = 6 ways. Total arrangements = 120 * 6 = 720."
  },
  {
    category: "quantitative",
    difficulty: "hard",
    question: "A bag contains 4 white, 5 red, and 6 blue balls. Three balls are drawn at random from the bag. What is the probability that all of them are red?",
    options: ["1/22", "2/91", "3/91", "5/143"],
    correctAnswer: "2/91",
    explanation: "Total balls = 4 + 5 + 6 = 15. Total ways of choosing 3 balls = 15C3 = (15 * 14 * 13) / (3 * 2 * 1) = 455. Ways of choosing 3 red balls from 5 = 5C3 = 10. Probability = 10 / 455 = 2 / 91."
  },

  // ==================== LOGICAL REASONING ====================
  // EASY
  {
    category: "logical",
    difficulty: "easy",
    question: "Look at this series: 2, 4, 8, 16, 32, ... What number should come next?",
    options: ["40", "48", "64", "128"],
    correctAnswer: "64",
    explanation: "This is a simple multiplication series. Each number is multiplied by 2 to get the next number: 2*2=4, 4*2=8, 8*2=16, 16*2=32, so 32*2 = 64."
  },
  {
    category: "logical",
    difficulty: "easy",
    question: "If in a certain code, 'COFFEE' is written as 'DPGGFF', how is 'TEA' written in that code?",
    options: ["UFB", "VFB", "SDB", "UGC"],
    correctAnswer: "UFB",
    explanation: "The letters are shifted by: C(+1)=D, O(+1)=P, F(+1)=G, F(+1)=G, E(+1)=F, E(+1)=F. Applying this shift (+1) to TEA: T(+1)=U, E(+1)=F, A(+1)=B. So TEA becomes UFB."
  },
  {
    category: "logical",
    difficulty: "easy",
    question: "Pointing to a photograph, a man said, 'I have no brother or sister, but that man's father is my father's son.' Whose photograph was it?",
    options: ["His own", "His son's", "His father's", "His nephew's"],
    correctAnswer: "His son's",
    explanation: "Since the man has no brother or sister, 'my father's son' is the man himself. Therefore, the statement simplifies to 'that man's father is ME.' This means the photograph is of his son."
  },
  // MEDIUM
  {
    category: "logical",
    difficulty: "medium",
    question: "Find the odd one out from the following list: Gold, Silver, Bronze, Platinum.",
    options: ["Gold", "Silver", "Bronze", "Platinum"],
    correctAnswer: "Bronze",
    explanation: "Gold, Silver, and Platinum are pure chemical elements on the periodic table. Bronze is an alloy (mixture of copper and tin), making it the odd one out."
  },
  {
    category: "logical",
    difficulty: "medium",
    question: "A man walks 5 km toward South and then turns to the right. After walking 3 km, he turns to the left and walks 5 km. In which direction is he now from his starting place?",
    options: ["West", "South", "North-East", "South-West"],
    correctAnswer: "South-West",
    explanation: "Starting point -> 5km South -> turn right means heading West -> 3km West -> turn left means heading South -> 5km South. The final point is South and West of the starting position, i.e., South-West."
  },
  {
    category: "logical",
    difficulty: "medium",
    question: "If '+' means '*', '-' means '/', '*' means '+', and '/' means '-', what is the value of 15 + 3 - 5 / 2 * 4?",
    options: ["11", "13", "15", "17"],
    correctAnswer: "11",
    explanation: "Substituting the signs: 15 * 3 / 5 - 2 + 4. Following BODMAS: 15 * (3/5) = 9. Then 9 - 2 + 4 = 7 + 4 = 11."
  },
  // HARD
  {
    category: "logical",
    difficulty: "hard",
    question: "Five girls are sitting on a bench to be photographed. Seema is to the left of Reha and to the right of Bindu. Mary is to the right of Reha. Rita is between Reha and Mary. Who is sitting in the middle?",
    options: ["Seema", "Reha", "Rita", "Bindu"],
    correctAnswer: "Reha",
    explanation: "Seema is to the left of Reha, and right of Bindu: Bindu -> Seema -> Reha. Mary is to the right of Reha: Reha -> Mary. Rita is between Reha and Mary: Reha -> Rita -> Mary. Combining all clues: Bindu -> Seema -> Reha -> Rita -> Mary. Reha is in the middle (3rd position out of 5)."
  },

  // ==================== VERBAL ABILITY ====================
  // EASY
  {
    category: "verbal",
    difficulty: "easy",
    question: "Select the word that is a synonym of 'RESOLUTE'.",
    options: ["Undecided", "Stubborn", "Determined", "Frail"],
    correctAnswer: "Determined",
    explanation: "Resolute means admirable purposeful, determined, and unwavering. Therefore, 'Determined' is the correct synonym."
  },
  {
    category: "verbal",
    difficulty: "easy",
    question: "Fill in the blank with the correct preposition: 'She has been living here ___ 2018.'",
    options: ["for", "since", "from", "during"],
    correctAnswer: "since",
    explanation: "'Since' is used when referring to a specific starting point in time (2018), while 'for' is used for a duration (e.g., for 5 years)."
  },
  {
    category: "verbal",
    difficulty: "easy",
    question: "Identify the antonym of 'VAGUE'.",
    options: ["Clear", "Dim", "Obscure", "Hazy"],
    correctAnswer: "Clear",
    explanation: "Vague means uncertain, indefinite, or unclear. The direct opposite is Clear."
  },
  // MEDIUM
  {
    category: "verbal",
    difficulty: "medium",
    question: "Choose the word that best completes the analogy: 'Light is to Blind as Sound is to ___.'",
    options: ["Deaf", "Speech", "Silence", "Whisper"],
    correctAnswer: "Deaf",
    explanation: "Someone who cannot perceive light is blind. Similarly, someone who cannot perceive sound is deaf."
  },
  {
    category: "verbal",
    difficulty: "medium",
    question: "Identify the grammatically correct sentence.",
    options: [
      "Neither the teacher nor the students was present.",
      "Neither the teacher nor the students were present.",
      "Neither the teacher or the students were present.",
      "Neither the teacher nor the students is present."
    ],
    correctAnswer: "Neither the teacher nor the students were present.",
    explanation: "With the conjunction 'neither... nor...', the verb agrees with the closer subject. 'students' is plural, so it requires the plural verb 'were' (past) or 'are' (present). 'or' cannot be paired with 'neither'."
  },
  // HARD
  {
    category: "verbal",
    difficulty: "hard",
    question: "Read the sentence and find the error: 'The new software program has not only increased productivity, but also it improved employee morale.'",
    options: [
      "The new software program has",
      "not only increased productivity",
      "but also it improved employee morale",
      "No error"
    ],
    correctAnswer: "but also it improved employee morale",
    explanation: "This is a parallel structure error. The sentence structure should align after 'not only' and 'but also'. Since 'not only' is followed by a verb phrase ('increased productivity'), 'but also' should be followed directly by a verb phrase ('improved employee morale') without the pronoun 'it'."
  }
];