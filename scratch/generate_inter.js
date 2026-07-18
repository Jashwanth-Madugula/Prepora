const fs = require("fs");
const path = require("path");

const INTER_FILE = path.join(__dirname, "..", "inter.txt");

const questions = [
  // --- BEGINNER QUESTIONS (1-20) ---
  {
    num: 1,
    round: "Beginner Questions",
    ref: "src/lib/db.ts",
    q: "Why does db.ts cache the connection on global.mongoose instead of creating a new connection with mongoose.connect() on every invocation?",
    why: "Evaluates basic understanding of serverless backend architectures (like Next.js API Route Handlers) and connection management.",
    ans: "Next.js API routes run in serverless environments, meaning instances can be created and destroyed dynamically. If we call mongoose.connect() directly in every route, each API call spawns a new connection to MongoDB. Under load, this quickly exhausts MongoDB's available connection pool. By caching the connection on the global object (which persists across serverless hot starts), subsequent invocations reuse the active connection pool instance."
  },
  {
    num: 2,
    round: "Beginner Questions",
    ref: "src/services/aptitude/aptitude-ai.service.ts",
    q: "How does the AI question generator generate new aptitude questions without duplicating questions that the candidate has already answered?",
    why: "Tests practical knowledge of prompt engineering and parameter passing to external LLM APIs.",
    ans: "The function generateAptitudeQuestions() takes an optional array parameter `excludeQuestionTexts`. If populated, it dynamically constructs an avoid instruction block: `CRITICAL: Do NOT generate any of the following questions...`. This text is appended to the prompt sent to Groq. If the Groq API call fails or is skipped, the local fallback method getLocalQuestions() uses this exclude list to filter questions out of the static question bank."
  },
  {
    num: 3,
    round: "Beginner Questions",
    ref: "src/components/auth/LoginForm.tsx & src/lib/validations/auth.ts",
    q: "Explain how the login form is validated before the submit payload is sent to the server.",
    why: "Assesses client-side form validation practices, Zod schema usage, and UI reactivity.",
    ans: "The application defines a strict input verification schema `loginSchema` using Zod in `src/lib/validations/auth.ts`. In `LoginForm.tsx`, this schema is integrated into React Hook Form via the `@hookform/resolvers/zod` resolver. When the user submits the form, React Hook Form interceptively runs Zod's validation. If validation fails (e.g. empty password or invalid email format), errors are set reactively in state, preventing the network fetch request."
  },
  {
    num: 4,
    round: "Beginner Questions",
    ref: "src/components/resumes/ResumeUploader.tsx",
    q: "How does the application restrict user resume uploads to PDFs?",
    why: "Checks understanding of HTML5 file drop zones and input validation guards.",
    ans: "The uploader uses the react-dropzone library. It configures the dropzone hook to accept only `application/pdf` MIME types. If a candidate drops a JPEG or DOCX file, it is automatically rejected before upload logic is invoked."
  },
  {
    num: 5,
    round: "Beginner Questions",
    ref: "src/lib/bcrypt.ts",
    q: "What is the purpose of hashing user passwords, and what library wrapper does Reheasa use for this?",
    why: "Validates basic concepts of password security and cryptographic hashing.",
    ans: "Passwords must never be stored in plain text to prevent compromises in the event of database leaks. Reheasa hashes passwords using `bcryptjs` (salt strength 10). It provides wrappers `hashPassword()` and `comparePassword()` to standardize secure storage and validation check calls."
  },
  {
    num: 6,
    round: "Beginner Questions",
    ref: "src/lib/file.ts",
    q: "How does file.ts check if an uploaded file is a valid image or PDF?",
    why: "Tests basic knowledge of helper files and input file checking.",
    ans: "It checks the file's MIME type against a list of allowed types (e.g. `application/pdf`, `image/png`, `image/jpeg`). This acts as a first line of defense before files are sent to Cloudinary or parsed."
  },
  {
    num: 7,
    round: "Beginner Questions",
    ref: "src/lib/utils.ts",
    q: "Explain the utility function `cn` in utils.ts. Why is it used in Tailwind project components?",
    why: "Checks understanding of merging Tailwind utility classes dynamically.",
    ans: "The `cn` function combines `clsx` and `tailwind-merge`. It allows components to take dynamic class parameters and resolves styling conflicts (e.g. if a component has default class `px-4` but receives `px-6` as a prop, tailwind-merge resolves it to `px-6` correctly)."
  },
  {
    num: 8,
    round: "Beginner Questions",
    ref: "src/models/RateLimit.ts",
    q: "What properties does the RateLimit schema track, and what database engine handles it?",
    why: "Checks basic schema knowledge and database architecture understanding.",
    ans: "The RateLimit schema tracks the `ip` address (as a string), the request `count` (as a number), and the last request `createdAt` timestamp. It is backed by MongoDB and managed via Mongoose."
  },
  {
    num: 9,
    round: "Beginner Questions",
    ref: "src/types/auth.ts",
    q: "Explain the `JWTPayload` interface. What fields are encrypted within our user tokens?",
    why: "Tests understanding of custom type declarations and token metadata schemas.",
    ans: "The `JWTPayload` interface specifies the user's identification keys: `userId` (string), `email` (string), and `role` (USER, ADMIN, or SUPER_ADMIN). These fields are embedded in access and refresh tokens."
  },
  {
    num: 10,
    round: "Beginner Questions",
    ref: "src/context/AuthContext.tsx",
    q: "What state properties does the AuthContext provider manage?",
    why: "Validates basic React context and user session state tracking.",
    ans: "It tracks: `user` (holding user metadata or null), `loading` (boolean indicating if the me-auth API check has completed), and exports `login()`, `logout()`, and `refreshUser()` functions."
  },
  {
    num: 11,
    round: "Beginner Questions",
    ref: "src/components/coding/CodingTimer.tsx",
    q: "How does the CodingTimer track elapsed time, and what happens when the timer reaches zero?",
    why: "Checks basic hooks rendering logic and lifecycle callback handling.",
    ans: "It takes a `duration` prop, sets up a React state for time remaining, and runs a `setInterval` ticking down every second inside `useEffect`. When the counter reaches zero, it clears the interval and invokes a callback (e.g., `onTimeout` or `autoSubmit()`)."
  },
  {
    num: 12,
    round: "Beginner Questions",
    ref: "src/services/pdf-parser.service.ts",
    q: "What library does pdf-parser.service.ts use to convert PDF binaries to raw text strings?",
    why: "Evaluates knowledge of text extraction libraries.",
    ans: "It uses the `pdf-parse` npm package. It receives a binary buffer of the uploaded file and returns a Promise containing the extracted text data."
  },
  {
    num: 13,
    round: "Beginner Questions",
    ref: "src/models/Profile.ts",
    q: "What sections of user details are configured in the Profile schema?",
    why: "Checks database schema models structure knowledge.",
    ans: "The Profile schema tracks: reference to `userId` (User collection), `bio`, social links (`github`, `linkedin`, `portfolio`), `skills` (array of strings), `education`, and `experience` arrays."
  },
  {
    num: 14,
    round: "Beginner Questions",
    ref: "src/app/api/auth/logout/route.ts",
    q: "How does the logout API route tell the user's browser to discard active credentials?",
    why: "Tests basic knowledge of HTTP cookies management in Next.js routes.",
    ans: "The logout route returns a response that sets the `accessToken` and `refreshToken` cookies to an empty string, sets their `maxAge` to `0`, and sets their expiration date to the past. This forces the browser to delete the cookies."
  },
  {
    num: 15,
    round: "Beginner Questions",
    ref: "src/constants/index.ts",
    q: "Why do we keep static configurations like compiler language options in a constants folder?",
    why: "Checks understanding of clean code organization practices.",
    ans: "Storing static values (e.g. supported languages: Python, Java, JS, C++) in constants prevents hardcoding values throughout multiple files. It makes modifications easy since we only have to update them in one place."
  },
  {
    num: 16,
    round: "Beginner Questions",
    ref: "src/app/api/admin/route.ts",
    q: "How does the admin API verify if an requesting user has the authority to view admin metrics?",
    why: "Tests basic role-based access control checking in endpoints.",
    ans: "It checks the requester's JWT token payload. If the token is missing, invalid, or the user's role is not 'ADMIN' or 'SUPER_ADMIN', it rejects the call immediately with a 403 Forbidden status."
  },
  {
    num: 17,
    round: "Beginner Questions",
    ref: "src/components/resumes/RenameResumeDialog.tsx",
    q: "What event triggers the visibility toggle of the Rename Dialog box?",
    why: "Checks basic modal state management understanding in React.",
    ans: "The visibility is controlled by an `isOpen` boolean state, which is toggled to true when the user clicks 'Rename' from the resume action cards, and set to false when they click 'Cancel' or close the dialog."
  },
  {
    num: 18,
    round: "Beginner Questions",
    ref: "src/app/api/subjects/route.ts",
    q: "What operation does a GET call on the subjects API route perform?",
    why: "Checks basic HTTP routing controller knowledge.",
    ans: "It queries the `SubjectAttempt` collection to fetch a list of all subject assessments attempted by the currently logged-in candidate, ordered by date."
  },
  {
    num: 19,
    round: "Beginner Questions",
    ref: "src/lib/cloudinary.ts",
    q: "What happens if CLOUDINARY_URL is missing in our env settings on startup?",
    why: "Validates fail-safe configuration handling.",
    ans: "The script will output a warning to console during configuration import but will not crash the entire app unless a file upload service is triggered, which will then throw an upload initialization error."
  },
  {
    num: 20,
    round: "Beginner Questions",
    ref: "src/models/aptitude-question.model.ts",
    q: "How are multiple choice options stored in the AptitudeQuestion schema?",
    why: "Checks database array schema modeling.",
    ans: "They are stored as an array of strings: `options: { type: [String], required: true }`. The model also stores `correctAnswer` as a string matching one of the options."
  },

  // --- INTERMEDIATE QUESTIONS (21-50) ---
  {
    num: 21,
    round: "Intermediate Questions",
    ref: "src/proxy.ts",
    q: "In your proxy middleware, you check the 'origin', 'referer', and 'host' headers for POST, PUT, DELETE, and PATCH requests, but not for GET requests. Why?",
    why: "Tests security knowledge of Cross-Site Request Forgery (CSRF) and safe vs. unsafe HTTP methods.",
    ans: "GET requests are safe/idempotent and should not change system state. CSRF attacks exploit cookie auth to force users to perform state-changing operations (like changing passwords, deleting accounts, or initiating actions). By validating that the Origin or Referer domain matches the Host header on mutative requests, we block cross-origin form submissions and scripts from executing actions on behalf of authenticated users."
  },
  {
    num: 22,
    round: "Intermediate Questions",
    ref: "src/lib/rateLimit.ts",
    q: "Explain how the sliding-window rate limiter works using the database. What is a potential performance bottleneck here, and how does your database schema address it?",
    why: "Assesses understanding of rate-limiting algorithms and database query optimizations.",
    ans: "The rate limiter logs a document for each request in a `RateLimit` collection containing the IP address and request timestamp. On each incoming request, it queries the database for logs matching the client's IP within the sliding window window. If the count exceeds the threshold, the request is blocked. The bottleneck is that this collection grows rapidly. The schema addresses this by defining a TTL index on the `createdAt` timestamp, allowing MongoDB to automatically delete expired logs."
  },
  {
    num: 23,
    round: "Intermediate Questions",
    ref: "src/services/ats.service.ts",
    q: "In analyzeATSWithGroq(), if the Groq API fails or rate limits, how does your application ensure the user still receives an ATS report?",
    why: "Tests system resilience, graceful degradation, and offline strategy design patterns.",
    ans: "If the Groq AI service throws an error (e.g. API key mismatch, network timeouts), the catch block invokes `parseResume()` in `resume-parser.service.ts` to extract skills and sections using local regex/keyword matching, and passes that to `analyzeATS()` which computes a local heuristic score based on predefined weights. This guarantees high availability."
  },
  {
    num: 24,
    round: "Intermediate Questions",
    ref: "src/app/api/auth/reset-password/route.ts",
    q: "Why does changing or resetting a user's password invalidate their refresh tokens in the database?",
    why: "Tests session security management, authorization flows, and session invalidation.",
    ans: "If an account is compromised or a user resets their password, all other active sessions (browsers, devices) must be invalidated immediately. By deleting the stored refresh token hashes (`refreshToken` and `refreshTokens` array) in the User document upon password change, any other device attempting to perform an auto-refresh check will fail validation in the proxy middleware, forcing them to log out."
  },
  {
    num: 25,
    round: "Intermediate Questions",
    ref: "src/services/cloudinary.service.ts",
    q: "Explain how uploading a file buffer directly to Cloudinary via uploadStream works in Node.js. What is the benefit over local disk storage?",
    why: "Checks knowledge of stream handling and serverless infrastructure limits.",
    ans: "Cloudinary's `upload_stream` receives buffer streams over network pipes. Instead of writing file buffers to local disk storage (`/tmp`), we use a stream converter that pipes the file data buffer directly. This is crucial for serverless systems (like Next.js Route Handlers) which have constrained read-write disk access."
  },
  {
    num: 26,
    round: "Intermediate Questions",
    ref: "src/lib/jwt.ts",
    q: "What is a 'fail-fast' configuration pattern, and how is it implemented inside jwt.ts?",
    why: "Checks backend configuration validation best practices.",
    ans: "Fail-fast means checking configurations during compilation/initialization and crashing the process immediately if mandatory env parameters are missing. In `jwt.ts`, the file checks `process.env.JWT_ACCESS_SECRET` at the top level and throws a hard error if it is not defined, preventing the app from starting up with insecure or default keys."
  },
  {
    num: 27,
    round: "Intermediate Questions",
    ref: "src/services/aptitude/aptitude-ai.service.ts",
    q: "In generateAptitudeQuestions(), if the Groq LLM response returns markdown blocks (e.g. ```json ... ```), how does your service sanitize it before parsing?",
    why: "Tests handling of LLM outputs and regex formatting cleaning.",
    ans: "The parser runs `response.replace(/```json/g, '').replace(/```/g, '').trim()` to strip out code blocks before calling `JSON.parse()`. This handles instances where the AI outputs markdown formatting tags despite prompt instructions."
  },
  {
    num: 28,
    round: "Intermediate Questions",
    ref: "src/app/api/auth/me/route.ts",
    q: "Why does the me/ route sanitize the returned user object by deleting fields like password and refreshTokens?",
    why: "Tests security best practices regarding data sanitization.",
    ans: "We must never expose critical credentials or session hashes to client-side JS. The backend explicitly structures the payload response to include only metadata (name, email, role, etc.), omitting sensitive details."
  },
  {
    num: 29,
    round: "Intermediate Questions",
    ref: "src/app/api/auth/refresh-token/route.ts",
    q: "Explain why we hash refresh tokens using bcrypt before saving them to MongoDB in refresh-token/route.ts.",
    why: "Tests database security, JWT management, and credential protection.",
    ans: "If an attacker compromises the MongoDB database, they could steal raw refresh tokens to forge access cookies. By hashing tokens with bcrypt (`token-hash.ts`), a database compromise does not yield active session hijack codes since hashes cannot be reversed back to active tokens."
  },
  {
    num: 30,
    round: "Intermediate Questions",
    ref: "src/components/coding/CodeEditor.tsx",
    q: "Why do we use the Monaco editor component in React? How does it configure state bindings?",
    why: "Checks frontend coding integrations and state synchronization.",
    ans: "Monaco provides IDE-like editing features (completion, styling) in the browser. In React, we hook the component with a `value` state representing the solution text, and update it inside the editor's `onChange` event callback."
  },
  {
    num: 31,
    round: "Intermediate Questions",
    ref: "src/services/resume-parser.service.ts",
    q: "How does resume-parser.service.ts structure its prompt to extract fields like skills and education in structured JSON from resume strings?",
    why: "Tests prompt engineering schemas and structural response generation.",
    ans: "It provides a clear schema format in the instructions, specifying field types, array parameters, and enforces json mode (`response_format: { type: 'json_object' }`). This forces Groq to map parsed resume strings directly to JSON keys."
  },
  {
    num: 32,
    round: "Intermediate Questions",
    ref: "src/models/User.ts",
    q: "Explain the lock-out logic fields (loginAttempts and lockUntil) in the User model.",
    why: "Tests basic authorization security rules.",
    ans: "To prevent brute-force attacks, we count failed logins. If `loginAttempts` reaches a threshold (e.g. 5), the account is locked until the timestamp in `lockUntil`. Future login attempts are rejected during this window."
  },
  {
    num: 33,
    round: "Intermediate Questions",
    ref: "src/lib/validations/profile.ts",
    q: "How does the Zod profile schema validation handle links (like GitHub/LinkedIn) optionally?",
    why: "Tests partial field validations using Zod schema builders.",
    ans: "It uses `.optional().or(z.literal(''))` or URL validations `z.string().url().optional()`. This allows forms to submit blank links without triggering validation schema errors."
  },
  {
    num: 34,
    round: "Intermediate Questions",
    ref: "src/components/interview/audio-recorder.tsx",
    q: "What HTML5 API records voice signals in audio-recorder.tsx?",
    why: "Tests media processing APIs knowledge.",
    ans: "It uses the `MediaRecorder` API. It captures the candidate's audio stream chunks from `navigator.mediaDevices.getUserMedia()`, collects them in a blob array, and compiles them into a single audio file upon stopping."
  },
  {
    num: 35,
    round: "Intermediate Questions",
    ref: "src/models/coding-round-attempt.model.ts",
    q: "How does coding-round-attempt.model.ts represent the status of a multi-question coding assessment?",
    why: "Checks schema design state tracking.",
    ans: "It tracks candidate attempt metadata: `status` ('started' | 'in-progress' | 'completed'), `questions` array referencing coding attempt subdocuments, and `score` tracking overall test marks."
  },
  {
    num: 36,
    round: "Intermediate Questions",
    ref: "src/services/ai-code-review.service.ts",
    q: "What prompts does ai-code-review.service.ts use to evaluate candidates' code quality?",
    why: "Checks AI code rating logic.",
    ans: "It asks the LLM to inspect the code's complexity, naming conventions, safety concerns, and potential memory leaks. It then outputs detailed feedback and rates correctness, style, and efficiency."
  },
  {
    num: 37,
    round: "Intermediate Questions",
    ref: "src/app/api/coding/run/route.ts",
    q: "What does the run/ API route perform before calling the code compilation runner service?",
    why: "Checks route validation and input sanitization.",
    ans: "It establishes the DB connection, verifies the candidate's token, checks rate limits, and validates that the code, language, and inputs are present in the request body."
  },
  {
    num: 38,
    round: "Intermediate Questions",
    ref: "src/lib/mail.ts",
    q: "What is the fallback configuration for email notifications in mail.ts?",
    why: "Tests application notifications configurations.",
    ans: "It checks for SMTP passes or EmailJS keys. If SMTP is configured, it initializes a nodemailer transporter; if EmailJS is present, it uses HTTP posts. If both are missing, it logs a fail-fast warning."
  },
  {
    num: 39,
    round: "Intermediate Questions",
    ref: "src/app/api/resumes/ats-compare/route.ts",
    q: "What request payload fields are parsed inside the resume ATS compare route?",
    why: "Tests API schema parameters processing.",
    ans: "It parses `resumeId` (to query resume text from MongoDB) and `jobDescription` (raw string input by user to evaluate matching compatibility)."
  },
  {
    num: 40,
    round: "Intermediate Questions",
    ref: "src/services/subject-ai.service.ts",
    q: "How are subject assessment questions generated inside subject-ai.service.ts?",
    why: "Tests subject test logic parameters.",
    ans: "The service queries Groq to create multiple-choice questions for subjects like DBMS, OS, or CN, utilizing templates to format categories, options, and explanations."
  },
  {
    num: 41,
    round: "Intermediate Questions",
    ref: "src/app/api/interviews/upload-video/route.ts",
    q: "What request parser parses multipart video uploads in upload-video/route.ts?",
    why: "Checks multipart parser integrations.",
    ans: "It reads the request as form-data using `req.formData()`, retrieves the video file blob under the key 'video', converts it to a buffer, and uploads it to Cloudinary."
  },
  {
    num: 42,
    round: "Intermediate Questions",
    ref: "src/app/api/coding/round/[roundId]/save-draft/route.ts",
    q: "Explain how save-draft/ allows candidates to preserve work-in-progress code solutions.",
    why: "Tests session draft persistence logic.",
    ans: "It takes the current editor solution buffer from the client and updates the corresponding subdocument in the `CodingRoundAttempt` collection without triggering test case evaluations."
  },
  {
    num: 43,
    round: "Intermediate Questions",
    ref: "src/models/aptitude-attempt.model.ts",
    q: "How does the AptitudeAttempt schema track candidate answers to individual questions?",
    why: "Checks candidate attempt validation schemas.",
    ans: "It uses a nested array of objects containing `questionId` references, `selectedAnswer` string values, `isCorrect` booleans, and `timeSpent` counters."
  },
  {
    num: 44,
    round: "Intermediate Questions",
    ref: "src/app/api/user/delete-account/route.ts",
    q: "What cascading database deletions are executed when a user deletes their account?",
    why: "Tests cascading deletion strategies in databases.",
    ans: "It deletes the user's core document in `User` and cascades to delete profiles, resumes, aptitude attempts, coding round attempts, and interview records matching the user's ID."
  },
  {
    num: 45,
    round: "Intermediate Questions",
    ref: "src/services/ats.service.ts",
    q: "What factors determine the local match score calculations in ats.service.ts compareResumeWithJD?",
    why: "Checks grading heuristic algorithm weights.",
    ans: "It computes local match scores by comparing keywords in the JD against resume skills, measuring keyword overlap, density, and experience metrics."
  },
  {
    num: 46,
    round: "Intermediate Questions",
    ref: "src/app/api/interviews/transcribe/route.ts",
    q: "How is transcription triggered after audio files are uploaded in the interview flow?",
    why: "Checks async audio processing flow.",
    ans: "After audio blobs are sent to Cloudinary, the transcription endpoint is called to process the audio URL and extract candidate speech text using transcription APIs."
  },
  {
    num: 47,
    round: "Intermediate Questions",
    ref: "src/components/interview/video-recorder.tsx",
    q: "How does video-recorder.tsx display real-time preview streams to candidates?",
    why: "Tests HTML5 video preview rendering.",
    ans: "It assigns the browser's active `MediaStream` object directly to the `srcObject` property of a React `<video>` reference element."
  },
  {
    num: 48,
    round: "Intermediate Questions",
    ref: "src/components/landing/ReadinessScore.tsx",
    q: "How is the dynamic progress wheel rendered reactively in ReadinessScore.tsx?",
    why: "Tests SVG styling transformations in react components.",
    ans: "It calculates an SVG stroke dashoffset based on the readiness score (e.g. mapping 0-100 to arc lengths) and animates the transition using CSS or framer-motion."
  },
  {
    num: 49,
    round: "Intermediate Questions",
    ref: "src/models/interview-question.model.ts",
    q: "What properties in interview-question.model.ts store candidate response analytics?",
    why: "Checks schema metrics structures.",
    ans: "It stores the candidate's transcript text, video reference link, and AI grading parameters: accuracy, confidence, clarity, and overall score."
  },
  {
    num: 50,
    round: "Intermediate Questions",
    ref: "src/app/api/coding/[attemptId]/route.ts",
    q: "What does the GET request return for a specific coding attempt route?",
    why: "Tests attempt reporting APIs.",
    ans: "It returns the user's code, compile logs, test cases outcomes, pass percentages, and the AI code review feedback."
  },

  // --- ADVANCED QUESTIONS (51-80) ---
  {
    num: 51,
    round: "Advanced Questions",
    ref: "src/app/api/auth/refresh-token/route.ts",
    q: "Explain Refresh Token Rotation (RTR). What concurrency issue occurs when a user opens multiple dashboard tabs, and how do we mitigate it?",
    why: "Tests deep security design, API transaction flow, and lock validations.",
    ans: "RTR invalidates the used refresh token and issues a new pair on every refresh. If a user opens 3 tabs concurrently, all 3 might trigger token refreshes. The first request updates the DB. Tabs 2 and 3 present the old refresh token, triggering a reuse detection warning. Mitigation requires implementing a temporary grace period (e.g., 5 seconds) where the old token is still accepted, or synchronization via client-side locks."
  },
  {
    num: 52,
    round: "Advanced Questions",
    ref: "src/services/interview-evaluation.service.ts",
    q: "How does evaluateAnswer() parse unstructured text responses using LLMs to ensure strict JSON adherence?",
    why: "Evaluates production-level prompt engineering and parsing strategies.",
    ans: "We use three mechanisms: (1) System prompts with formatting templates, (2) native json mode parameter options (`response_format: { type: 'json_object' }`), and (3) a low temperature (0.1 - 0.3) for deterministic generation. We also implement fallback regex parsers to strip markdown tags if returned."
  },
  {
    num: 53,
    round: "Advanced Questions",
    ref: "src/app/api/aptitude/[id]/adaptive-next/route.ts",
    q: "Explain the difficulty state transitions in the adaptive next question API route. How is difficulty updated after a user response?",
    why: "Tests state transition design and logic flow execution.",
    ans: "It uses a state transition machine based on correctness: If correct: Easy -> Medium -> Hard -> Hard. If incorrect: Hard -> Medium -> Easy -> Easy. This dynamically adjusts the test complexity based on candidate performance."
  },
  {
    num: 54,
    round: "Advanced Questions",
    ref: "src/proxy.ts",
    q: "Explain the routing proxy middleware configuration matcher rules. What routes are excluded, and why?",
    why: "Tests Next.js middleware execution path mapping.",
    ans: "The matcher configures a regular expression: `/((?!_next/static|_next/image|favicon.ico|.*\\.).*)`. This excludes static resources, bundle assets, and favicons from triggering the middleware, optimizing routing latency."
  },
  {
    num: 55,
    round: "Advanced Questions",
    ref: "src/services/ats.service.ts",
    q: "Why was the local keyword parser fallback implemented inside the ATS evaluation logic? What are the limitations of local parser algorithms?",
    why: "Evaluates system design trade-offs between LLMs and local heuristics.",
    ans: "It was implemented to guarantee service availability if the Groq API fails. The limitation is that local parser regexes only perform simple string matching and keyword checks. They lack semantic understanding and cannot evaluate factors like content impact, formatting, or project description strength."
  },
  {
    num: 56,
    round: "Advanced Questions",
    ref: "src/services/code-runner.service.ts",
    q: "How does the Llama code-runner service simulate code execution? What are the limitations compared to a container sandbox like Judge0?",
    why: "Tests understanding of LLM-based compilation simulation vs. sandbox compilers.",
    ans: "It prompts the LLM to trace the code and return stdout/stderr. The limitations are that LLMs can hallucinate logic outputs for complex inputs, cannot guarantee strict execution limits, and are slower than compiled execution in a sandbox."
  },
  {
    num: 57,
    round: "Advanced Questions",
    ref: "src/services/judge.service.ts",
    q: "Explain how judgeSubmission() programmatically overrides the AI review when a solution is optimal (passed === total).",
    why: "Checks understanding of clean data normalization before database writes.",
    ans: "If the test cases pass completely, the code overrides the AI review fields, setting `edgeCasesMissing` and `improvements` to empty arrays and the comment to 'Your solution is optimal.' This overrides conversational suggestions."
  },
  {
    num: 58,
    round: "Advanced Questions",
    ref: "src/lib/jwt.ts",
    q: "Explain how verifyAccessToken() decodes access tokens. Why does it use generic typings (`<T extends object>`)?",
    why: "Tests type safety practices and generic definitions in TypeScript.",
    ans: "It genericizes the signature verification callback `verifyAccessToken<T>(token)`. This allows callers to specify custom payload interfaces (e.g. `JWTPayload`) when parsing user identities."
  },
  {
    num: 59,
    round: "Advanced Questions",
    ref: "src/app/api/auth/verify-email/route.ts",
    q: "How is email verification token expiration validated inside the database?",
    why: "Checks security lifecycle validation schemas.",
    ans: "It retrieves the User document using the token, checks if `verificationTokenExpiry` exists, and verifies it is in the future. If expired, it rejects the verification check."
  },
  {
    num: 60,
    round: "Advanced Questions",
    ref: "src/app/api/coding/round/[roundId]/submit-round/route.ts",
    q: "Explain the final scoring and test aggregation logic executed when a candidate submits their coding round.",
    why: "Tests core scoring models calculations.",
    ans: "It calculates the average correctness score across all attempted questions, updates the `CodingRoundAttempt` status to 'completed', and records total elapsed test time."
  },
  {
    num: 61,
    round: "Advanced Questions",
    ref: "src/services/pdf-parser.service.ts",
    q: "How does pdf-parser.service.ts handle issues with scanned PDFs that contain only image content?",
    why: "Tests input file handling limits.",
    ans: "Scanned PDFs contain no digital text, so `pdf-parse` returns an empty string. The system intercepts this condition and returns an error suggestion advising the user to upload a text-based resume."
  },
  {
    num: 62,
    round: "Advanced Questions",
    ref: "src/components/interview/audio-recorder.tsx",
    q: "How does audio-recorder.tsx manage browser media permissions dynamically?",
    why: "Checks HTML5 devices access permissions flow.",
    ans: "It invokes `getUserMedia` inside a try-catch block. If permissions are denied, it catches the exception and updates the UI state to show permission warnings."
  },
  {
    num: 63,
    round: "Advanced Questions",
    ref: "src/models/aptitude-attempt.model.ts",
    q: "How is the total score computed dynamically upon test completion in aptitude attempts?",
    why: "Checks aggregation and math calculations.",
    ans: "It aggregates correct selections, calculates the percentage score, updates the attempt status, and flags areas of weakness."
  },
  {
    num: 64,
    round: "Advanced Questions",
    ref: "src/app/api/auth/forgot-password/route.ts",
    q: "What security risks exist when returning user-existence confirmations in forgot-password API routes?",
    why: "Tests user enumeration security mitigations.",
    ans: "If the API returns 'User does not exist', attackers can query the database to verify registrations. To mitigate this, the API should return a generic success message regardless of whether the email exists."
  },
  {
    num: 65,
    round: "Advanced Questions",
    ref: "src/services/interview-analytics.service.ts",
    q: "How does interview-analytics.service.ts aggregate data to display trend charts on user dashboards?",
    why: "Tests query aggregations logic.",
    ans: "It executes MongoDB aggregation pipelines to group attempts by date and calculate average values for communication, clarity, and confidence."
  },
  {
    num: 66,
    round: "Advanced Questions",
    ref: "src/components/landing/AIRecommendations.tsx",
    q: "What optimization prevents AIRecommendations.tsx from calling the recommendations API unnecessarily?",
    why: "Tests component rendering performance improvements.",
    ans: "It checks if the current profile data matches cached recommendations. It also uses React state boundaries to skip fetches on minor profile modifications."
  },
  {
    num: 67,
    round: "Advanced Questions",
    ref: "src/lib/bcrypt.ts",
    q: "Why was bcryptjs chosen over native crypto modules for password hashing?",
    why: "Checks cryptographic utility considerations.",
    ans: "bcryptjs is a pure JavaScript implementation that requires no native dependencies, ensuring platform compatibility and ease of deployment across serverless environments."
  },
  {
    num: 68,
    round: "Advanced Questions",
    ref: "src/app/api/coding/round/[roundId]/submit-question/route.ts",
    q: "Explain how submit-question/ isolates and evaluates a single coding question within a test round.",
    why: "Checks state updates within arrays.",
    ans: "It executes the code, matches standard output structures, updates the subdocument score inside the `CodingRoundAttempt` questions array, and persists the draft."
  },
  {
    num: 69,
    round: "Advanced Questions",
    ref: "src/services/ats.service.ts",
    q: "How are missing keywords extracted during job description comparisons?",
    why: "Checks keyword parsing logic.",
    ans: "The prompt instructs the LLM to extract key requirements from the job description and compare them against the resume skills, listing missing keywords in the JSON response."
  },
  {
    num: 70,
    round: "Advanced Questions",
    ref: "src/services/aptitude/question-bank.ts",
    q: "Why is question-bank.ts kept as a static module fallback in memory?",
    why: "Tests backup state structures design.",
    ans: "Keeping it as a static array in memory provides a fast, zero-query fallback for questions if the database is unreachable or the LLM is rate-limited."
  },

  // --- SYSTEM DESIGN ROUND (81-90) ---
  {
    num: 71,
    round: "System Design Round",
    ref: "src/app/api/interviews/upload-audio/route.ts",
    q: "If our platform grows to 100,000 active interview sessions per day, how would you scale the audio/video upload and speech-to-text transcription flows?",
    why: "Evaluates systems scaling, microservices decoupling, and queueing theories.",
    ans: "I would decouple the upload from the transcription. The client requests a presigned upload URL, uploads the file directly to object storage, which then triggers an event notification to a message queue. Dedicated worker instances pull from the queue to process transcriptions asynchronously."
  },
  {
    num: 72,
    round: "System Design Round",
    ref: "src/models/interview.model.ts & src/models/User.ts",
    q: "Why was MongoDB chosen for Reheasa? If we need to perform complex aggregations across 50,000 users, how does this schema hold up, and what optimizations would you recommend?",
    why: "Evaluates NoSQL scaling trade-offs and analytical query designs.",
    ans: "MongoDB is optimal for flexible document schemas. However, complex joins can be slow. To scale, we can implement read-write segregation, mirror data to a relational warehouse, or pre-aggregate daily statistics using background cron jobs."
  },
  {
    num: 73,
    round: "System Design Round",
    ref: "src/services/judge.service.ts",
    q: "Explain how you would design a sandboxed code execution environment if we migrated from Llama simulation to a containerized solution.",
    why: "Tests sandbox container environment design knowledge.",
    ans: "I would set up a cluster of isolated Docker containers. A queue worker picks up submissions, runs the code inside a container with resource limits (e.g. CPU, RAM, disk write limits), and returns the execution outputs."
  },
  {
    num: 74,
    round: "System Design Round",
    ref: "src/lib/rateLimit.ts",
    q: "How would you scale the rate limiter to support millions of requests per second across a global server cluster?",
    why: "Tests scaling rate limiters via caching layers.",
    ans: "I would migrate the rate-limiting store from MongoDB to Redis. Redis runs in-memory and supports fast sliding window operations using sorted sets (`ZADD`), keeping latency minimal."
  },
  {
    num: 75,
    round: "System Design Round",
    ref: "src/app/api/auth/refresh-token/route.ts",
    q: "How would you design a session dashboard tracking active logged-in devices using the User schema refreshTokens array?",
    why: "Tests session management schema scaling designs.",
    ans: "I would log metadata (user agent, IP address, creation and active times) with each token. A dashboard UI fetches this array and calls the logout endpoint to invalidate specific session hashes in MongoDB."
  },
  {
    num: 76,
    round: "System Design Round",
    ref: "src/services/cloudinary.service.ts",
    q: "Cloudinary has storage caps. How would you design an archival pipeline for videos over 30 days old to reduce hosting costs?",
    why: "Checks file archiving systems scaling.",
    ans: "I would run a nightly cron job that queries MongoDB for completed interviews older than 30 days, downloads the video files, writes them to a cheaper cold storage bucket (e.g. AWS S3 Glacier), and deletes the Cloudinary assets."
  },
  {
    num: 77,
    round: "System Design Round",
    ref: "src/app/api/aptitude/create/route.ts",
    q: "How would you scale question generation if multiple users started tests concurrently, causing LLM rate limits?",
    why: "Tests caching and pre-generation design strategies.",
    ans: "I would decouple generation by pre-generating a large pool of questions for categories and difficulties using background cron jobs, and seeding tests from this pre-populated database pool instead of querying the LLM synchronously."
  },
  {
    num: 78,
    round: "System Design Round",
    ref: "src/services/ats.service.ts",
    q: "How would you design a real-time matching service comparing resumes against job listings as users scroll through a job board?",
    why: "Tests real-time scoring data pipeline designs.",
    ans: "I would pre-calculate and index vector embeddings for all resumes and job listings using vector databases (like Pinecone or pgvector), allowing fast similarity lookups."
  },
  {
    num: 79,
    round: "System Design Round",
    ref: "src/proxy.ts",
    q: "If the Next.js middleware proxy becomes a bottleneck, how would you design edge routing to improve response speeds?",
    why: "Tests edge network routing implementations.",
    ans: "I would deploy the routing proxy logic directly on CDN edge workers (like Cloudflare Workers). This verifies headers and token validity close to the user, reducing round-trip latency."
  },
  {
    num: 80,
    round: "System Design Round",
    ref: "src/services/interview-evaluation.service.ts",
    q: "AI evaluation returns structured data. If a user loses connection mid-interview, how do you prevent data loss?",
    why: "Tests resilient state synchronization design patterns.",
    ans: "I would implement autosaving on the client side. Responses are stored in IndexedDB/localStorage. If connection is lost, the client attempts to upload cached responses once the connection is restored."
  },

  // --- DEBUGGING ROUND (91-100) ---
  {
    num: 81,
    round: "Debugging Round",
    ref: "src/services/pdf-parser.service.ts",
    q: "Users report that uploading a PDF resume with many pages (e.g. 50 pages) causes the container instance to crash with an Out Of Memory (OOM) error. How would you debug and fix this?",
    why: "Tests troubleshooting skills for memory leaks and resource limits.",
    ans: "I would profile the memory heap using standard Node.js inspection flags (`--inspect`) and generate heap dumps before and after the upload. The library `pdf-parse` loads the entire file binary buffer into memory, which can scale exponentially with large documents. Fix: (1) Implement a request validation rule checking the file size (e.g., limit to 2MB) and count page metrics before full extraction. (2) Offload the file parsing to a separate worker thread or process queue so that main Web router containers do not crash, preserving overall system availability."
  },
  {
    num: 82,
    round: "Debugging Round",
    ref: "src/components/coding/CodeEditor.tsx",
    q: "In the Coding round screen, typing a single character causes the entire page UI to freeze, indicating a React infinite re-render loop. What is the cause of this, and how would you debug the state hook bindings?",
    why: "Focuses on React performance, component cycles, and prop comparisons.",
    ans: "Cause: This happens when the CodeEditor component triggers an `onChange` event, updating a parent state variable. If that parent state variable passes a newly constructed object reference or array as a prop back to the editor, the editor detects it as a new value, triggers a value update, fires `onChange` again, and loops infinitely. Debug: Use React DevTools Profiler to track what component triggers the render. Inspect hooks dependencies. Fix: Memoize callbacks using `useCallback()`, keep states simple (strings, not objects), and use `useRef` for tracking Monaco editor instance states to avoid re-rendering."
  },
  {
    num: 83,
    round: "Debugging Round",
    ref: "src/lib/db.ts",
    q: "A developer reports that in production, MongoDB logs show 'Too many connections' and the database rejects queries. What is the cause?",
    why: "Checks connection leaks troubleshooting.",
    ans: "The cause is typically failing to cache connection pools in serverless Next.js route files. If files define a local `mongoose.connect()` connection call instead of checking the cached connection, every invocation spawns a new connection pool instance. Fix: Ensure all route queries import and await `dbConnect()` from `src/lib/db.ts` to reuse the cached pool."
  },
  {
    num: 84,
    round: "Debugging Round",
    ref: "src/app/api/auth/refresh-token/route.ts",
    q: "Users report getting randomly logged out when navigating between tabs. The logs show 'Invalid session or token reuse detected'. How do you troubleshoot this?",
    why: "Checks token rotation synchronization debugging.",
    ans: "I would check the network logs to see if multiple tabs are requesting refreshes concurrently. If tab 1 refreshes the token, the database updates. If tab 2 sends the old token before updating its local state, it triggers the token reuse alert. Fix: Trace cookie updates and synchronize token requests across tabs using BroadcastChannel or page focus events."
  },
  {
    num: 85,
    round: "Debugging Round",
    ref: "src/services/cloudinary.service.ts",
    q: "Cloudinary media uploads fail with a 'Signature verification failed' error. What is the cause, and how do you resolve it?",
    why: "Tests integration credentials debugging.",
    ans: "This indicates that Cloudinary API credentials (API key, API secret, cloud name) are incorrect or missing from env variables. Fix: Check server environment settings, verify the API secret is parsed correctly, and ensure they match the credentials in the Cloudinary console."
  },
  {
    num: 86,
    round: "Debugging Round",
    ref: "src/services/ats.service.ts",
    q: "A user reports that their resume ATS score is 0, but they have projects and experience. What is the cause?",
    why: "Checks resume data extraction parsing errors.",
    ans: "This occurs if the resume text extraction fails or returns blank, causing the parser to output empty arrays. Fix: Add debug logs to print the parsed text, verify the PDF has copyable text, and ensure the schema parsing gracefully handles empty fields."
  },
  {
    num: 87,
    round: "Debugging Round",
    ref: "src/components/interview/audio-recorder.tsx",
    q: "During mock interviews, users report that the audio recorder doesn't capture sound, and logs show 'DOMException: Requested device not found'. How do you debug this?",
    why: "Tests user hardware integrations debugging.",
    ans: "This occurs if the browser has no audio input device (microphone) connected or if access is blocked by browser permissions. Fix: Add validation checks to verify available devices using `navigator.mediaDevices.enumerateDevices()` before starting the recorder."
  },
  {
    num: 88,
    round: "Debugging Round",
    ref: "src/app/api/auth/login/route.ts",
    q: "The login API is taking 10+ seconds to respond, causing request timeouts. How would you diagnose this bottleneck?",
    why: "Tests database query bottlenecks debugging.",
    ans: "I would check query execution times using MongoDB database profiling. A slow lookup on email or username indicates a missing index. Fix: Verify that the `email` and `username` fields in `src/models/User.ts` have `unique: true` and index configurations enabled."
  },
  {
    num: 89,
    round: "Debugging Round",
    ref: "src/proxy.ts",
    q: "Mutative API requests (POST/PUT) work fine on localhost but fail with a 403 status in production. What is the cause?",
    why: "Tests production environment configurations debugging.",
    ans: "The proxy middleware's CSRF check compares the request origin against the host. In production, proxy setups (like Nginx or Vercel routing) can rewrite headers, causing mismatches. Fix: Log the origin, referer, and host headers to verify alignment."
  },
  {
    num: 90,
    round: "Debugging Round",
    ref: "src/services/judge.service.ts",
    q: "The coding compiler simulator returns 'JSON parsing error: Unexpected token <'. What is the cause?",
    why: "Checks parsing errors from LLM APIs.",
    ans: "This occurs when the LLM outputs HTML tags (like `<` or markdown warnings) instead of clean JSON. Fix: Update prompt rules to restrict output, and implement robust string cleanups before calling `JSON.parse`."
  },

  // --- BEHAVIORAL ROUND (91-100) ---
  {
    num: 91,
    round: "Behavioral Round",
    ref: "src/services/interview-evaluation.service.ts",
    q: "You decided to use Groq Llama-3-70b versatility models for resume ATS checks and code simulations. What were the latency, cost, and accuracy trade-offs you considered, and how did you resolve them?",
    why: "Evaluates ownership, pragmatism, financial engineering, and product-level thinking.",
    ans: "Latency: Running LLM completions on 70B models can take up to 2-3 seconds, which is a bottleneck for active UI dashboards. Cost: Commercial APIs like OpenAI GPT-4 are expensive for student practice runs. Resolution: We utilized Groq, which offers high-speed execution at a fraction of the cost. We designed UI skeletons and loaders to handle the 2-second wait. We also implemented local, offline fallbacks (local ATS scoring and simple regex skills parsers) to guarantee service even if APIs are down or cost limits are reached."
  },
  {
    num: 92,
    round: "Behavioral Round",
    ref: "src/app/api/auth/refresh-token/route.ts",
    q: "Describe a situation where you had to upgrade the authentication security of Reheasa without logging out active users. How did you plan it?",
    why: "Focuses on risk management, backward compatibility, and execution planning.",
    ans: "Problem: We upgraded the database to store refresh token hashes rather than plain text tokens. If we simply deployed this, all active user tokens would fail validation, logging out every active user simultaneously. Plan/Resolution: We implemented a zero-downtime migration check in the refresh endpoint. The server checks the token prefix: if it is a bcrypt hash, it compares using bcrypt; if it is plain text, it does an exact string match. Once verified, RTR takes over, rotates the token, and writes a new hashed token to the DB, silently migrating sessions on the fly."
  },
  {
    num: 93,
    round: "Behavioral Round",
    ref: "src/services/judge.service.ts",
    q: "How did you handle the situation when a team member suggested using an online sandbox execution environment instead of AI compilation simulation for code submissions?",
    why: "Tests team alignment and compromise management.",
    ans: "I acknowledged the benefits of sandbox container runtimes (absolute correctness, safety limits). However, setting up compiler clusters increases complexity, costs, and infrastructure dependencies. We compromised by using the AI compilation simulator as the primary interface wrapper, while structuring the compiler service with an abstract interface to allow swap-ins of actual sandbox API runners (like Judge0) as we scale."
  },
  {
    num: 94,
    round: "Behavioral Round",
    ref: "src/services/cloudinary.service.ts",
    q: "Why did you choose to use Cloudinary for video hosting rather than self-hosting media assets on your server?",
    why: "Checks pragmatic infrastructure selection.",
    ans: "Self-hosting media requires high bandwidth, disk storage, and complex video encoding. Cloudinary offloads this processing. This saved us weeks of development time, allowing us to focus on the core AI evaluation tools."
  },
  {
    num: 95,
    round: "Behavioral Round",
    ref: "src/proxy.ts",
    q: "Explain why you chose a custom proxy middleware solution rather than implementing a third-party auth service like NextAuth or Auth0.",
    why: "Tests technical stack decision ownership.",
    ans: "Third-party services are powerful but add dependencies and can lock user session data behind external configurations. Implementing custom proxy middlewares using JWTs gave us full control over RTR, custom database session indexing, and zero-downtime password invalidation migrations."
  },
  {
    num: 96,
    round: "Behavioral Round",
    ref: "src/components/coding/CodeEditor.tsx",
    q: "Describe a challenge you faced when integrating Monaco Editor in React, and how you resolved it.",
    why: "Checks frontend integration problem-solving.",
    ans: "Integrating Monaco caused page bundle sizes to grow significantly, slow page loads, and layout shifts during rendering. I resolved this by utilizing lazy loading imports for Monaco and rendering loading skeletons to maintain UI stability."
  },
  {
    num: 97,
    round: "Behavioral Round",
    ref: "src/app/api/aptitude/[id]/adaptive-next/route.ts",
    q: "What design trade-offs did you make when building the adaptive test algorithm? What would you improve?",
    why: "Checks incremental design iterations ownership.",
    ans: "Trade-off: We chose a simple 3-stage difficulty state transition matrix. This is easy to test and run, but does not calculate exact skill ratings (like Item Response Theory). For future improvements, I would implement actual probability models to dynamically estimate skill levels."
  },
  {
    num: 98,
    round: "Behavioral Round",
    ref: "src/services/resume-parser.service.ts",
    q: "How did you validate that user resume uploads do not contain malicious executable files disguised as PDFs?",
    why: "Tests security ownership and defensive validation.",
    ans: "We implemented two checks: (1) Client-side Dropzone restrictions, (2) Server-side validation of file extension metadata. We also parse binary content using `pdf-parse` without saving the file on local disk, neutralizing executable code runs."
  },
  {
    num: 99,
    round: "Behavioral Round",
    ref: "src/context/AuthContext.tsx",
    q: "What were the design goals behind the global state structures in Reheasa?",
    why: "Tests component architecture design ownership.",
    ans: "The goal was to build a clean dashboard layout where sidebars, analytics charts, and testing modules adapt dynamically. Keeping auth states centralized in `AuthContext` provides a clean interface for checking access."
  },
  {
    num: 100,
    round: "Behavioral Round",
    ref: "src/lib/rateLimit.ts",
    q: "Why did you implement IP-based rate limiting on auth endpoints, and what feedback did you receive from security audits?",
    why: "Tests security integration and defense-in-depth strategies.",
    ans: "We implemented rate limiting on login, signup, and reset routes to prevent brute-force attacks. The audit validated this, and we improved it by adding client IP detection logic to prevent bypasses via proxy headers."
  }
];

function generateFile() {
  let fileContent = `================================================================================
                    REHEASA AI MOCK ASSESSMENT PLATFORM
                        TECH INTERVIEW QUESTION KEY
================================================================================

This document contains a curated list of technical, architectural, debugging,
and behavioral interview questions directly mapped to the implementation details,
files, and code blocks of the Reheasa AI mock assessment platform.

`;

  let currentRound = "";
  for (const q of questions) {
    if (q.round !== currentRound) {
      currentRound = q.round;
      fileContent += `\n--------------------------------------------------------------------------------\n`;
      fileContent += `                         ${currentRound.toUpperCase()}\n`;
      fileContent += `--------------------------------------------------------------------------------\n\n`;
    }

    fileContent += `QUESTION ${q.num}: ${q.q}\n`;
    fileContent += `- File Reference: ${q.ref}\n`;
    fileContent += `- Why Interviewer Asks It: ${q.why}\n`;
    fileContent += `- Strong Answer:\n  ${q.ans}\n\n`;
  }

  fileContent += `================================================================================\n`;
  
  fs.writeFileSync(INTER_FILE, fileContent, "utf8");
  console.log(`Successfully generated 100 questions into ${INTER_FILE}`);
}

generateFile();
