/**
 * @file src/services/subject-ai.service.ts
 * @category Business Logic Service
 *
 * Why this code exists:
 * Implements core business operations and logic handlers for "subject-ai.service.ts".
 * 
 *
 * What problem it solves:
 * - Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.
 *
 * How it works internally:
 * - Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).
 */

import Groq from "groq-sdk";

export interface IGeneratedSubjectQuestion {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

const fallbackSubjectQuestions: Record<string, IGeneratedSubjectQuestion[]> = {
  DBMS: [
    {
      question: "Which of the following is not a characteristic of a relational database?",
      options: [
        "Data stored in tables",
        "Support for SQL",
        "Enforcement of referential integrity",
        "Hierarchical parent-child nodes structure only"
      ],
      correct: "Hierarchical parent-child nodes structure only",
      explanation: "Relational databases store data in tables (relations) with keys, whereas hierarchical databases use tree structures."
    },
    {
      question: "What does the ACID acronym stand for in DBMS?",
      options: [
        "Atomicity, Consistency, Isolation, Durability",
        "Algorithm, Consistency, Iteration, Data",
        "Atomicity, Concurrency, Isolation, Database",
        "Access, Control, Indexing, Distribution"
      ],
      correct: "Atomicity, Consistency, Isolation, Durability",
      explanation: "ACID properties (Atomicity, Consistency, Isolation, Durability) guarantee that database transactions are processed reliably."
    },
    {
      question: "Which SQL join returns all records when there is a match in either left or right table?",
      options: [
        "INNER JOIN",
        "LEFT JOIN",
        "RIGHT JOIN",
        "FULL OUTER JOIN"
      ],
      correct: "FULL OUTER JOIN",
      explanation: "FULL OUTER JOIN returns all records from both tables when there is a match in either left or right table."
    }
  ],
  OS: [
    {
      question: "What is a deadlock in Operating Systems?",
      options: [
        "A process terminates prematurely",
        "A state where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process",
        "The CPU executes instructions at maximum speed",
        "A process is allocated more memory than it needs"
      ],
      correct: "A state where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process",
      explanation: "Deadlock is a state where processes wait indefinitely for resources held by each other, blocking further execution."
    },
    {
      question: "Which scheduling algorithm can cause starvation?",
      options: [
        "Round Robin",
        "First-Come, First-Served (FCFS)",
        "Priority Scheduling",
        "None of the above"
      ],
      correct: "Priority Scheduling",
      explanation: "Priority Scheduling can cause starvation for low-priority processes if high-priority processes keep arriving."
    },
    {
      question: "What is virtual memory?",
      options: [
        "Extremely fast CPU registers",
        "A storage allocation scheme in which secondary memory can be addressed as though it were part of main memory",
        "RAM that is cooled using liquid nitrogen",
        "Memory that does not lose data when power is turned off"
      ],
      correct: "A storage allocation scheme in which secondary memory can be addressed as though it were part of main memory",
      explanation: "Virtual memory acts as an extension of main memory using disk storage, allowing programs to exceed physical RAM limits."
    }
  ],
  CN: [
    {
      question: "Which layer of the OSI model is responsible for routing packets?",
      options: [
        "Physical Layer",
        "Data Link Layer",
        "Network Layer",
        "Transport Layer"
      ],
      correct: "Network Layer",
      explanation: "The Network Layer handles packet routing, logical addressing (IP addresses), and path determination."
    },
    {
      question: "What is the primary function of DNS (Domain Name System)?",
      options: [
        "To encrypt network traffic",
        "To map human-readable domain names to machine-readable IP addresses",
        "To allocate dynamic IP addresses to devices",
        "To filter malicious incoming web requests"
      ],
      correct: "To map human-readable domain names to machine-readable IP addresses",
      explanation: "DNS acts as the phonebook of the internet, resolving domain names (like google.com) to IP addresses."
    },
    {
      question: "Which protocol is connection-oriented and guarantees delivery of packets?",
      options: [
        "UDP",
        "TCP",
        "IP",
        "ICMP"
      ],
      correct: "TCP",
      explanation: "TCP (Transmission Control Protocol) is connection-oriented and provides reliable, ordered, and error-checked delivery."
    }
  ],
  OOPS: [
    {
      question: "What is polymorphism in Object-Oriented Programming?",
      options: [
        "Hiding internal implementation details",
        "The ability of a single interface/method to take on multiple forms depending on the object it is acting upon",
        "Restricting access to class variables",
        "Inheriting fields and methods from a parent class"
      ],
      correct: "The ability of a single interface/method to take on multiple forms depending on the object it is acting upon",
      explanation: "Polymorphism (meaning 'many forms') allows methods to perform different actions based on the object instance."
    },
    {
      question: "Which OOPS concept is achieved by using access specifiers like private, protected, and public?",
      options: [
        "Inheritance",
        "Encapsulation",
        "Polymorphism",
        "Abstraction"
      ],
      correct: "Encapsulation",
      explanation: "Encapsulation wraps variables and methods into a single class unit, controlling visibility via access specifiers."
    },
    {
      question: "What is a constructor in OOP?",
      options: [
        "A special method used to destroy an object",
        "A class that inherits from another class",
        "A special method invoked automatically when an object of a class is instantiated",
        "A variable that is shared across all instances"
      ],
      correct: "A special method invoked automatically when an object of a class is instantiated",
      explanation: "Constructors initialize newly created objects and typically match the class name."
    }
  ]
};

export async function generateSubjectQuestions(
  subject: "DBMS" | "OS" | "CN" | "OOPS",
  difficulty: "easy" | "medium" | "hard",
  totalQuestions: number = 10
): Promise<IGeneratedSubjectQuestion[]> {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY is not defined. Using local fallback for subject assessment.");
      return getFallbackQuestions(subject, totalQuestions);
    }

    const prompt = `
Generate EXACTLY ${totalQuestions} multiple-choice questions for the computer science subject: "${subject}".
The target difficulty level is: "${difficulty}".

Each question must be challenging, technically accurate, and contain exactly 4 options.
Return ONLY valid JSON. Do not include any markdown formatting, markdown blocks, code blocks, or introductory text. Return only the raw JSON.

Format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": "Option A",
    "explanation": "Detailed explanation of why Option A is correct."
  }
]
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (responseText) {
      const cleanResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanResponse);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, totalQuestions);
      }
    }
    throw new Error("Invalid response from Groq AI");
  } catch (error) {
    console.error("Failed to generate subject questions via Groq, falling back:", error);
    return getFallbackQuestions(subject, totalQuestions);
  }
}

function getFallbackQuestions(subject: string, total: number): IGeneratedSubjectQuestion[] {
  const list = fallbackSubjectQuestions[subject] || fallbackSubjectQuestions.DBMS;
  // Pad list if total > list.length
  let result = [...list];
  while (result.length < total) {
    result = result.concat(list);
  }
  return result.slice(0, total).sort(() => 0.5 - Math.random());
}
