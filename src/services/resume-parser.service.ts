export interface ParsedResumeData {
  name?: string;

  email?: string;

  phone?: string;

  skills: string[];

  education: string[];

  projects: string[];

  experience: string[];

  certifications: string[];

  achievements: string[];
}

const SKILLS = [
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "MongoDB",
  "MySQL",
  "PostgreSQL",
  "DBMS",
  "Operating System",
  "Computer Networks",
  "Docker",
  "AWS",
  "Git",
  "Spring Boot",
];

function extractSkills(
  text: string
): string[] {
  const lowerText =
    text.toLowerCase();

  return SKILLS.filter(
    (skill) =>
      lowerText.includes(
        skill.toLowerCase()
      )
  );
}

function extractEmail(
  text: string
): string | undefined {
  const match =
    text.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );

  return match?.[0];
}

function extractPhone(
  text: string
): string | undefined {
  const match =
    text.match(
      /(\+91)?[6-9]\d{9}/
    );

  return match?.[0];
}


function extractName(
  text: string
) {
  const lines =
    text
      .split("\n")
      .map((line) =>
        line.trim()
      )
      .filter(Boolean);

  return lines[0];
}


import Groq from "groq-sdk";

export async function parseResumeWithGroq(
  text: string
): Promise<ParsedResumeData> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API;
  if (!apiKey) {
    console.warn("GROQ_API_KEY / GROQ_API is not defined. Falling back to regex parsing.");
    return parseResume(text);
  }

  try {
    const groq = new Groq({ apiKey });
    const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const prompt = `You are a resume parser. Analyze the following resume text and extract all details in structured JSON format matching the schema below.
Schema:
{
  "name": "string (candidate's name)",
  "email": "string (candidate's email)",
  "phone": "string (candidate's phone number)",
  "skills": ["array of strings (technical skills, tools, languages)"],
  "education": ["array of strings (degrees, colleges, graduation details)"],
  "projects": ["array of strings (projects with titles and quick descriptions)"],
  "experience": ["array of strings (internships or work experiences)"],
  "certifications": ["array of strings"],
  "achievements": ["array of strings"]
}

Make sure to respond with a VALID JSON object ONLY. Do not write any explanations or conversational text before or after the JSON.

Resume Text:
${text}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: modelName,
      response_format: { type: "json_object" },
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    return JSON.parse(responseText) as ParsedResumeData;
  } catch (error) {
    console.error("Groq resume parsing error:", error);
    return parseResume(text);
  }
}

export const parseResumeWithGemini = parseResumeWithGroq;



function extractSection(
  text: string,
  sectionNames: string[]
): string[] {

  const lines =
    text.split("\n");

  let collecting =
    false;

  const result: string[] = [];

  for (const line of lines) {

    const trimmed =
      line.trim();

    const upper =
      trimmed.toUpperCase();

    const isSectionStart =
      sectionNames.some(
        (name) =>
          upper.includes(
            name.toUpperCase()
          )
      );

    const isAnotherSection =
      [
        "EDUCATION",
        "PROJECTS",
        "EXPERIENCE",
        "CERTIFICATIONS",
        "ACHIEVEMENTS",
        "SKILLS",
      ].some(
        (section) =>
          upper.includes(section)
      );

    if (isSectionStart) {
      collecting = true;
      continue;
    }

    if (
      collecting &&
      isAnotherSection
    ) {
      break;
    }

    if (
      collecting &&
      trimmed
    ) {
      result.push(
        trimmed
      );
    }
  }

  return result;
}

function extractEducation(
  text: string
) {
  return extractSection(
    text,
    [
      "EDUCATION",
      "ACADEMICS",
      "QUALIFICATION",
    ]
  );
}

function extractProjects(
  text: string
) {
  return extractSection(
    text,
    [
      "PROJECTS",
      "PERSONAL PROJECTS",
    ]
  );
}

function extractExperience(
  text: string
) {
  return extractSection(
    text,
    [
      "EXPERIENCE",
      "WORK EXPERIENCE",
      "INTERNSHIP",
      "EMPLOYMENT",
    ]
  );
}

function extractCertifications(
  text: string
) {
  return extractSection(
    text,
    [
      "CERTIFICATIONS",
      "CERTIFICATES",
    ]
  );
}

function extractAchievements(
  text: string
) {
  return extractSection(
    text,
    [
      "ACHIEVEMENTS",
      "AWARDS",
    ]
  );
}


export function parseResume(
  text: string
): ParsedResumeData {

  return {

    name:
      extractName(text),

    email:
      extractEmail(text),

    phone:
      extractPhone(text),

    skills:
      extractSkills(text),

    education:
      extractEducation(text),

    projects:
      extractProjects(text),

    experience:
      extractExperience(text),

    certifications:
      extractCertifications(text),

    achievements:
      extractAchievements(text),
  };
}