const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");

// Helper to determine the purpose and details of the file based on its directory and name
function getFileHeader(relativePath, fileName) {
  let category = "Utility / Helper";
  let purpose = "";
  let problem = "";
  let howItWorks = "";

  const cleanPath = relativePath.replace(/\\/g, "/");

  if (cleanPath.startsWith("src/models/")) {
    category = "Mongoose DB Schema Model";
    purpose = `Defines the database schema structure, validation constraints, and indexing rules for the "${fileName.replace(".model.ts", "").replace(".ts", "")}" collection.`;
    problem = "Ensures data integrity, field constraints, default values, and relational schemas across the database, preventing corrupt or inconsistent data records from being saved.";
    howItWorks = "Defines a Mongoose Schema configuration specifying fields, types, and options. Registers or retrieves the model from the global mongoose model cache to avoid re-compilation in serverless runtime execution environments.";
  } else if (cleanPath.startsWith("src/services/")) {
    category = "Business Logic Service";
    purpose = `Implements core business operations and logic handlers for "${fileName}".`;
    problem = "Decouples computation-heavy, algorithmic, or external API-dependent operations from HTTP controllers (Next.js route handlers) to ensure clean separation of concerns and high testability.";
    howItWorks = "Exposes async methods and utilities that process input datasets, interface with Mongoose models, and communicate with external services (like Groq, Cloudinary, or Judge0 compilers).";
  } else if (cleanPath.startsWith("src/app/api/")) {
    category = "API Route Handler (Backend)";
    purpose = `Serves as the Next.js API serverless route endpoint responding to client HTTP fetch requests for this path.`;
    problem = "Validates request inputs, manages rate-limiting rules, invokes business logic services, interacts with the database, and returns structured JSON responses and status codes to the frontend client.";
    howItWorks = "Exports async HTTP methods (GET, POST, PUT, DELETE, etc.) which parse query parameters or request body JSONs, connect to MongoDB using dbConnect(), verify permissions, and return NextResponse payloads.";
  } else if (cleanPath.startsWith("src/components/")) {
    category = "React UI Component";
    purpose = `Renders a visual UI element or widget inside the candidate's application view.`;
    problem = "Constructs modular, interactive interface components (like forms, buttons, timers, code-editors) keeping state reactive and responsive to candidate interactions.";
    howItWorks = "Implements a TypeScript React function component combining Tailwind CSS styling, React hooks (useState, useEffect, useMemo), animations (framer-motion), and callback events.";
  } else if (cleanPath.startsWith("src/context/")) {
    category = "React State Context Provider";
    purpose = `Provides global context-bound state management for the application.`;
    problem = "Prevents prop-drilling by sharing authentication credentials, configuration settings, or view parameters globally across the component tree.";
    howItWorks = "Declares a React Context object, renders its Provider wrapper around children components, and defines custom React hooks (such as useAuth) to fetch and mutate states.";
  } else if (cleanPath.startsWith("src/lib/validations/")) {
    category = "Zod Input Validator Schema";
    purpose = `Defines runtime validation checks and type constraints for user input parameters.`;
    problem = "Validates client form inputs and endpoint request payloads on the server to prevent bad inputs or injection attacks, maintaining strict type compliance.";
    howItWorks = "Defines schema definitions using Zod's validation builder API and exports them for form verification (via React Hook Form) and route request validation checks.";
  } else if (cleanPath.startsWith("src/lib/")) {
    category = "Utility / Helper Library";
    purpose = `Provides shared helper libraries and initializers (such as DB pools, client instances, cryptography, token management).`;
    problem = "Avoids duplicate config setup blocks by centralizing libraries (such as Cloudinary connection pools, Groq SDK setups, mailers, JWT checkers) to keep code modular.";
    howItWorks = "Loads environment variables, initializes library clients with fail-fast validation checks, and exports clean utility methods for the services and API routers.";
  } else if (cleanPath.startsWith("src/types/")) {
    category = "TypeScript Type Declarations";
    purpose = `Provides compile-time TypeScript type definitions and interfaces.`;
    problem = "Enforces type safety and documents payload contracts between components, services, and route handlers, eliminating standard runtime type errors.";
    howItWorks = "Defines static TypeScript interfaces, types, and enum descriptions. Does not translate to any compiled JavaScript runtime code.";
  } else if (cleanPath === "src/proxy.ts") {
    category = "Route Proxy / Request Filter Middleware";
    purpose = "Acts as a centralized security filter intercepting requests before reaching Next.js App Router routes.";
    problem = "Enforces CSRF origin checks for mutative HTTP calls, validates active user session JWTs, and performs automatic refresh token rotation (RTR) on the fly.";
    howItWorks = "Checks the pathname. If it is public auth, redirects active users to the dashboard. If it is protected, verifies cookies (accessToken and refreshToken). Automatically performs fetch POST token rotations if expired.";
  }

  // File specific extensions
  let fileSpecificHelp = "";
  if (fileName.includes("ats")) {
    fileSpecificHelp = "Specifically handles Resume Applicant Tracking System (ATS) parsing, score evaluation, and keyword metrics alignment.";
  } else if (fileName.includes("interview")) {
    fileSpecificHelp = "Specifically handles AI-powered behavioral and technical mock interview evaluation workflows, question lists generation, or audio/video recording processing.";
  } else if (fileName.includes("coding") || fileName.includes("judge") || fileName.includes("runner")) {
    fileSpecificHelp = "Specifically handles compilation, remote sandbox code execution, code editor configuration, and automated AI reviews.";
  } else if (fileName.includes("aptitude")) {
    fileSpecificHelp = "Specifically handles aptitude tests logic, database operations, or the dynamic difficulty adaptive testing algorithms.";
  }

  return `/**
 * @file ${cleanPath}
 * @category ${category}
 *
 * Why this code exists:
 * ${purpose}
 * ${fileSpecificHelp ? "- " + fileSpecificHelp : ""}
 *
 * What problem it solves:
 * - ${problem}
 *
 * How it works internally:
 * - ${howItWorks}
 */

`;
}

function traverseAndInject(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        traverseAndInject(filePath);
      }
    } else if (stat.isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
      const relativePath = path.relative(path.join(__dirname, ".."), filePath);
      let content = fs.readFileSync(filePath, "utf8");

      // Check if it already has our comment header
      if (content.trim().startsWith("/**") && content.includes("@file") && content.includes("Why this code exists:")) {
        console.log(`Skipping (already commented): ${relativePath}`);
        continue;
      }

      // Generate and prepended comment header
      const header = getFileHeader(relativePath, file);
      
      // If the file starts with "use client", we must put that at the absolute top of the file!
      // This is a crucial Next.js rule: "use client" must be before any other expressions or comments,
      // though comments before "use client" can sometimes cause compilation issues in certain packagers.
      // To be safe, we check if file starts with 'use client' or "use client".
      let newContent = "";
      if (content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'")) {
        const useClientMatch = content.match(/^['"]use client['"];?\s*/);
        const useClientStr = useClientMatch[0];
        const restContent = content.slice(useClientStr.length);
        newContent = `${useClientStr}\n${header}${restContent}`;
      } else {
        newContent = `${header}${content}`;
      }

      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`Successfully commented: ${relativePath}`);
    }
  }
}

console.log("Starting comment injection across Prepora codebase...");
traverseAndInject(SRC_DIR);
console.log("Comment injection completed successfully.");
