/**
 * @file scripts/seed-rag.ts
 * @category RAG Knowledge Seed Script
 *
 * Why this code exists:
 * Seeds curated, high-quality technical knowledge and interview evaluation rubrics
 * into the MongoDB `ragdocuments` collection. Chunks, hashes, and embeds 20+ computer science
 * and full-stack topics using Gemini Embeddings (768-dim) matching the Atlas vector index.
 *
 * Usage:
 * npx tsx scripts/seed-rag.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import RagDocument from "../src/models/rag-document.model";
import { chunkText, cleanContent } from "../src/services/rag/chunking.service";
import { generateEmbedding, EMBEDDING_DIMENSION } from "../src/services/rag/embedding.service";
import { computeContentHash } from "../src/services/rag/document.service";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not configured in .env.local");
  process.exit(1);
}

interface SeedTopic {
  title: string;
  topic: string;
  subtopic?: string;
  role?: string;
  difficulty: "easy" | "medium" | "hard";
  type: "technical" | "interview" | "evaluation";
  content: string;
}

const SEED_KNOWLEDGE_BASE: SeedTopic[] = [
  // 1. JavaScript
  {
    title: "JavaScript Event Loop and Concurrency Model",
    topic: "JavaScript",
    subtopic: "Event Loop",
    role: "Frontend / Full Stack",
    difficulty: "medium",
    type: "technical",
    content: `
JavaScript is a single-threaded, non-blocking, asynchronous concurrent runtime powered by the V8/SpiderMonkey engine.
The Event Loop constantly monitors the Call Stack and Task Queues to schedule execution.

Core Components:
1. Call Stack: LIFO structure executing synchronous frames.
2. Web APIs / C++ APIs: Handles timers (setTimeout), network requests (fetch), and DOM events off the main thread.
3. Microtask Queue: Highest priority queue. Contains Promise callbacks (.then, .catch, .finally), queueMicrotask, and MutationObserver callbacks. Processed completely after every call stack frame before the macrotask queue.
4. Macrotask Queue (Task Queue): Contains setTimeout, setInterval, setImmediate, and I/O tasks. Executes one task per tick, then yields back to microtasks and rendering.

Common Interview Areas:
- Execution order of synchronous code vs Promises vs setTimeout.
- Starvation: Infinite microtask recursion blocks UI rendering and macrotask execution.
- Node.js vs Browser event loop phases (Timer, I/O Polling, Check/setImmediate, Close).
`,
  },
  {
    title: "JavaScript Closures, Scope Chain, and Memory Management",
    topic: "JavaScript",
    subtopic: "Closures",
    role: "Frontend / Full Stack",
    difficulty: "medium",
    type: "technical",
    content: `
A closure is the combination of a function bundled together with references to its lexical environment.
A closure allows an inner function to access variables from its outer enclosing scope even after the outer function has finished executing and returned.

Practical Applications:
- Data encapsulation and private state variables (factory functions, module pattern).
- Function currying and partial application.
- Event handlers and callbacks retaining contextual state.
- Debouncing and throttling utility implementations.

Trade-offs and Memory Considerations:
- Variables retained by closures cannot be garbage collected while the closure reference is alive.
- Common mistake: Accidentally retaining large DOM elements or arrays in global event listener closures, causing memory leaks.
`,
  },

  // 2. TypeScript
  {
    title: "TypeScript Generics, Type Narrowing, and Utility Types",
    topic: "TypeScript",
    subtopic: "Type System",
    role: "Full Stack / Frontend",
    difficulty: "medium",
    type: "technical",
    content: `
TypeScript adds a static structural type system to JavaScript.

Core Concepts:
1. Generics: Reusable type parameters that enforce type consistency across inputs and outputs (e.g., function identity<T>(arg: T): T).
2. Type Narrowing: Refinement of broad types using typeof, instanceof, 'in' operator, and custom type predicates (x is Type).
3. Discriminated Unions: Union types sharing a common literal tag property, enabling exhaustive compile-time pattern matching with switch statements.
4. Built-in Utility Types:
   - Partial<T>, Required<T>, Readonly<T>
   - Pick<T, K>, Omit<T, K>, Record<K, T>
   - ReturnType<T>, Parameters<T>, NonNullable<T>
5. Interfaces vs Type Aliases:
   - Interfaces support declaration merging and OOP 'implements'/'extends'.
   - Types support unions, intersections, mapped types, and conditional types.
`,
  },

  // 3. React
  {
    title: "React Virtual DOM, Reconciliation, and Fiber Architecture",
    topic: "React",
    subtopic: "Reconciliation",
    role: "Frontend / Full Stack",
    difficulty: "hard",
    type: "technical",
    content: `
React uses an in-memory Virtual DOM tree representation to minimize expensive real DOM mutations.

Fiber Architecture:
- React 16+ introduced Fiber, a complete rewrite of the reconciliation algorithm.
- Replaced recursive stack reconciliation with an incremental, interruptible linked-list data structure (Fibers).
- Enables concurrent rendering, time-slicing, and prioritization of urgent user interactions over background data fetching.

Reconciliation Heuristics (Diffing Algorithm O(n)):
1. Elements of different types tear down the old subtree and mount a fresh one.
2. Elements of the same type update only modified attributes/classes.
3. Keys on list children uniquely identify siblings across renders. Using array index as key causes component state bugs during reordering, deletions, or insertions.
`,
  },
  {
    title: "React Hooks Lifecycle, Performance Optimization, and State",
    topic: "React",
    subtopic: "Hooks & Performance",
    role: "Frontend / Full Stack",
    difficulty: "medium",
    type: "technical",
    content: `
React Hooks enable functional components to maintain state, side effects, and memoized values.

Key Hooks:
- useState & useReducer: Local and complex state management.
- useEffect & useLayoutEffect: Side effect lifecycle management. useLayoutEffect runs synchronously after DOM mutations before browser paint.
- useCallback & useMemo: Memoizes function instances and computed values to avoid unnecessary child re-renders.
- useRef: Mutable ref container that persists across renders without triggering a re-render.

Performance Optimization Strategies:
- React.memo for pure functional component memoization with shallow prop comparison.
- Windowing/Virtualization for huge lists (react-window).
- Code-splitting with React.lazy and Suspense boundaries.
- Avoiding inline object/array allocations inside JSX props when passed to memoized children.
`,
  },

  // 4. Next.js
  {
    title: "Next.js App Router, Server Components, and Server Actions",
    topic: "Next.js",
    subtopic: "App Router",
    role: "Full Stack",
    difficulty: "hard",
    type: "technical",
    content: `
Next.js App Router (built on React Server Components) provides a unified architecture for full-stack React applications.

React Server Components (RSC):
- Render exclusively on the server with zero client bundle impact.
- Direct secure access to databases, file systems, and internal microservices without exposing credentials.
- Client Components ('use client') handle browser interactivity, DOM events, state, and browser APIs.

Server Actions:
- Asynchronous server functions invoked seamlessly from client forms or event handlers.
- Automatic progressive enhancement and POST handling.

Caching and Rendering Modes:
- Static Rendering (SSG/ISR): Pre-rendered at build time with on-demand or time-based revalidation (revalidatePath / revalidateTag).
- Dynamic Rendering (SSR): Rendered on request when dynamic headers/cookies are read.
`,
  },

  // 5. Node.js & Express
  {
    title: "Node.js Architecture, Streams, and Express Middleware",
    topic: "Node.js",
    subtopic: "Architecture & Express",
    role: "Backend / Full Stack",
    difficulty: "medium",
    type: "technical",
    content: `
Node.js is an asynchronous, event-driven JavaScript runtime built on Google's V8 engine and libuv.

Libuv Thread Pool:
- Offloads blocking operations (fs filesystem, DNS lookup, crypto) to a background thread pool (default 4 threads via UV_THREADPOOL_SIZE).
- Network I/O is handled non-blockingly via OS primitives (epoll on Linux, kqueue on macOS, IOCP on Windows).

Streams and Buffers:
- Streams (Readable, Writable, Duplex, Transform) process chunks of data sequentially without loading entire files into RAM.
- Prevents out-of-memory crashes during large file uploads or video streaming.

Express.js Middleware Architecture:
- Functions with signature (req, res, next) executed in pipeline sequence.
- Used for authentication, request parsing, validation, rate limiting, and centralized error handling (err, req, res, next).
`,
  },

  // 6. MongoDB
  {
    title: "MongoDB Indexing, Aggregation Pipeline, and Schema Design",
    topic: "MongoDB",
    subtopic: "Database",
    role: "Backend / Full Stack",
    difficulty: "medium",
    type: "technical",
    content: `
MongoDB is a document-oriented NoSQL database storing data as BSON documents organized in collections.

Indexing Essentials:
- B-Tree based indexes dramatically improve query performance by avoiding full collection scans (COLLSCAN).
- Compound Indexes: Indexing multiple fields. Follow the Equality, Sort, Range (ESR) rule for index field ordering.
- Vector Search Indexes: Enable dense vector similarity search (cosine, dotProduct, euclidean) for AI embeddings.

Aggregation Pipeline:
- Multi-stage pipeline processing ($match, $lookup, $group, $project, $unwind, $vectorSearch).
- Allows fast server-side analytics, relational joins, and transformations.

Schema Design:
- Embedding (1-to-few relationships for atomic updates and fast read locality).
- Referencing (1-to-many or many-to-many to prevent unbounded document growth past the 16MB BSON limit).
`,
  },

  // 7. SQL & Relational Databases
  {
    title: "Relational Databases: ACID Properties, Indexing, and Joins",
    topic: "SQL",
    subtopic: "RDBMS",
    role: "Backend / Full Stack",
    difficulty: "medium",
    type: "technical",
    content: `
Relational databases (PostgreSQL, MySQL) store structured tables with strict foreign key constraints.

ACID Guarantees:
- Atomicity: All operations in a transaction succeed or all rollback.
- Consistency: Transactions maintain schema rules, constraints, and triggers.
- Isolation: Concurrent transactions do not interfere with each other (Read Uncommitted, Read Committed, Repeatable Read, Serializable).
- Durability: Committed data is written to non-volatile storage / WAL and survives power failures.

Joins and Performance:
- INNER JOIN (matching rows), LEFT JOIN (all left rows + matching right), FULL OUTER JOIN.
- Index scans vs Sequential scans: Proper B-Tree indexes on foreign keys and filter columns optimize join efficiency.
`,
  },

  // 8. REST APIs
  {
    title: "RESTful API Design, HTTP Status Codes, and Idempotency",
    topic: "REST APIs",
    subtopic: "API Design",
    role: "Backend / Full Stack",
    difficulty: "easy",
    type: "technical",
    content: `
REST (Representational State Transfer) is an architectural style for distributed hypermedia systems.

Core HTTP Methods and Idempotency:
- GET: Safe and Idempotent. Retrieves a resource without mutating state.
- POST: Neither safe nor idempotent. Creates a new sub-resource.
- PUT: Idempotent. Replaces the target resource entirely.
- PATCH: Non-idempotent by default. Applies partial modifications to a resource.
- DELETE: Idempotent. Removes the resource.

Standard HTTP Status Codes:
- 200 OK, 201 Created, 204 No Content.
- 400 Bad Request, 401 Unauthorized (unauthenticated), 403 Forbidden (authenticated but lacks permissions), 404 Not Found, 409 Conflict, 429 Too Many Requests.
- 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable.
`,
  },

  // 9. Authentication & Security
  {
    title: "JWT Authentication, Refresh Tokens, and Web Security",
    topic: "Authentication",
    subtopic: "JWT & Security",
    role: "Full Stack / Backend",
    difficulty: "medium",
    type: "technical",
    content: `
JSON Web Tokens (JWT) provide stateless authentication between client and server.

JWT Architecture:
1. Header: Signing algorithm (e.g. HS256, RS256) and token type.
2. Payload: Claims containing user ID, role, and expiration timestamp (exp).
3. Signature: Cryptographic hash of header + payload using a server secret or private key.

Token Lifecycle & Security Best Practices:
- Short-lived Access Tokens (5-15 mins) kept in memory or secure httpOnly cookies.
- Long-lived Refresh Tokens (7-30 days) stored in httpOnly, SameSite=Strict secure cookies, backed by database revocation tracking and token rotation.
- Never store sensitive secrets (passwords, PII) in the unencrypted JWT payload.
- Protect against XSS (Content Security Policy, sanitization) and CSRF (SameSite cookies, anti-CSRF tokens).
- Passwords must be hashed using salted algorithms (Bcrypt, Argon2) with appropriate work factor.
`,
  },

  // 10. Redis
  {
    title: "Redis In-Memory Caching, Eviction Policies, and Distributed Locks",
    topic: "Redis",
    subtopic: "Caching",
    role: "Backend / System Design",
    difficulty: "medium",
    type: "technical",
    content: `
Redis is an open-source, in-memory key-value data structure store used as a database, cache, and message broker.

Core Data Structures:
- Strings, Hashes, Lists, Sets, Sorted Sets (ZSET), Bitmaps, HyperLogLogs.

Caching Strategies:
- Cache-Aside (Lazy Loading): Application queries cache first; on cache miss, queries database, populates cache, and returns data.
- Write-Through / Write-Behind: Application writes to cache, which updates DB synchronously or asynchronously.

Eviction Policies & TTL:
- Volatile-LRU / AllKeys-LRU: Evicts least recently used keys.
- AllKeys-LFU: Evicts least frequently used keys.
- TTL (Time To Live): Enforces automatic key expiration to prevent stale data.
- Distributed Locking: Redlock algorithm using SET resource_name my_random_value NX PX 30000.
`,
  },

  // 11. Docker
  {
    title: "Docker Containerization, Multi-Stage Builds, and Networking",
    topic: "Docker",
    subtopic: "DevOps",
    role: "DevOps / Full Stack",
    difficulty: "medium",
    type: "technical",
    content: `
Docker packages applications and their dependencies into immutable, isolated containers sharing the host OS kernel.

Images vs Containers:
- An Image is a read-only layered template defined by a Dockerfile.
- A Container is a runnable, isolated instance of an image with a thin writable container layer.

Multi-Stage Builds:
- Compiles application assets in a heavy build stage (with Node/Rust SDKs) and copies only production artifacts into a minimal alpine/distroless runtime stage.
- Reduces final image size from gigabytes to tens of megabytes, improving security and deployment speed.

Networking & Volumes:
- Bridge networks for container-to-container communication.
- Named Volumes and Bind Mounts for persistent state beyond container lifecycles.
`,
  },

  // 12. Git
  {
    title: "Git Internals, Branching Strategies, and Merge vs Rebase",
    topic: "Git",
    subtopic: "Version Control",
    role: "Software Engineer",
    difficulty: "easy",
    type: "technical",
    content: `
Git is a distributed content-addressable version control system modeled as a Directed Acyclic Graph (DAG) of commit objects.

Key Concepts:
- Objects: Blobs (file contents), Trees (directories), Commits (pointers to tree and parent commits), Tags.
- Merge vs Rebase:
  - 'git merge' preserves exact chronological history and creates a merge commit.
  - 'git rebase' rewrites commit history by replaying commits on top of the target branch, maintaining a clean linear commit history.
- Resolving Merge Conflicts: Inspect conflicting markers (<<<<<<<, =======, >>>>>>>), select correct changes, stage, and commit.
- Stashing: Temporarily shelves uncommitted changes to switch branches without committing dirty state.
`,
  },

  // 13. AWS Basics
  {
    title: "AWS Cloud Fundamentals: Compute, Storage, IAM, and Serverless",
    topic: "AWS",
    subtopic: "Cloud Architecture",
    role: "Cloud / Full Stack",
    difficulty: "medium",
    type: "technical",
    content: `
Amazon Web Services (AWS) provides scalable cloud infrastructure.

Core Services:
- EC2 (Elastic Compute Cloud): Virtual compute instances with configurable CPU/RAM and security groups.
- S3 (Simple Storage Service): Highly available object storage for assets, backups, and static web hosting with bucket policies.
- AWS Lambda: Event-driven serverless compute executing code in response to API Gateway requests, S3 uploads, or SQS messages.
- CloudFront: Global Content Delivery Network (CDN) caching static/dynamic content at edge locations.
- IAM (Identity & Access Management): Enforces least-privilege security using Users, Groups, Roles, and JSON policy documents.
`,
  },

  // 14. System Design Basics
  {
    title: "System Design: Scaling, Load Balancing, and CAP Theorem",
    topic: "System Design",
    subtopic: "Architecture",
    role: "Full Stack / Backend",
    difficulty: "hard",
    type: "technical",
    content: `
System design addresses scaling high-traffic distributed software systems.

Key Principles:
1. Horizontal vs Vertical Scaling: Adding more commodity nodes (scale-out) vs upgrading a single machine's CPU/RAM (scale-up).
2. Load Balancers: Reverse proxies (Nginx, HAProxy, AWS ALB) distributing traffic via Round Robin, Least Connections, or IP Hash algorithms.
3. CAP Theorem: A distributed data store can simultaneously guarantee at most two of:
   - Consistency: Every read receives the most recent write or an error.
   - Availability: Every non-failing node returns a non-error response without guarantee of latest write.
   - Partition Tolerance: System continues operating despite network message drops.
4. Message Queues (Kafka, RabbitMQ, SQS): Decouple slow background processors from user-facing HTTP handlers, providing backpressure and fault tolerance.
`,
  },

  // 15. Data Structures
  {
    title: "Core Data Structures: Hash Tables, Trees, Graphs, and Heaps",
    topic: "Data Structures",
    subtopic: "DSA",
    role: "Software Engineer",
    difficulty: "medium",
    type: "technical",
    content: `
Data structures organize and store data for optimal access and modification.

1. Hash Tables: Key-value storage with O(1) average lookup/insertion. Collision resolution via Chaining (linked lists/trees) or Open Addressing (linear probing).
2. Binary Search Trees (BST): Left child < root < right child. O(log n) search/insert in balanced trees (AVL, Red-Black); degrades to O(n) if unbalanced.
3. Heaps (Min/Max Heap): Complete binary tree satisfying heap property. O(1) find min/max, O(log n) insert/delete. Ideal for priority queues.
4. Graphs: Vertices connected by edges. Represented via Adjacency Lists or Adjacency Matrices. Traversed using BFS (shortest path unweighted) and DFS (cycle detection, backtracking).
`,
  },

  // 16. Algorithms
  {
    title: "Algorithms: Big-O Complexity, Dynamic Programming, and Search",
    topic: "Algorithms",
    subtopic: "DSA",
    role: "Software Engineer",
    difficulty: "medium",
    type: "technical",
    content: `
Algorithm efficiency is measured in asymptotic Time and Space Complexity.

Key Paradigms:
- Binary Search: O(log n) search algorithm on sorted collections using divide-and-conquer.
- Two Pointers & Sliding Window: Efficiently finds sub-arrays/sub-strings in O(n) time avoiding nested loops.
- Dynamic Programming (DP): Solves complex problems with overlapping sub-problems and optimal substructure via:
  - Memoization (Top-Down with recursion and cache).
  - Tabulation (Bottom-Up with iterative table).
- Sorting Algorithms: QuickSort (O(n log n) average), MergeSort (O(n log n) guaranteed stable), HeapSort.
`,
  },

  // 17. OOP
  {
    title: "Object-Oriented Programming (OOP) and SOLID Principles",
    topic: "OOP",
    subtopic: "Software Engineering",
    role: "Software Engineer",
    difficulty: "medium",
    type: "technical",
    content: `
OOP organizes software design around data/objects rather than functions and logic.

Four Pillars of OOP:
1. Encapsulation: Bundling data and methods into objects and hiding internal state via access modifiers.
2. Abstraction: Hiding implementation details and showing only necessary interfaces.
3. Inheritance: Reusing code where derived classes inherit characteristics of base classes.
4. Polymorphism: Objects of different types responding to the same interface method in unique ways (method overriding / overloading).

SOLID Principles:
- Single Responsibility: A class should have only one reason to change.
- Open/Closed: Software entities should be open for extension, closed for modification.
- Liskov Substitution: Subtypes must be substitutable for their base types without breaking correctness.
- Interface Segregation: Clients should not be forced to depend on interfaces they do not use.
- Dependency Inversion: Depend on abstractions, not on concrete implementations.
`,
  },

  // 18. DBMS
  {
    title: "Database Management Systems (DBMS): Transactions and Concurrency",
    topic: "DBMS",
    subtopic: "Database Internals",
    role: "Backend / Database",
    difficulty: "medium",
    type: "technical",
    content: `
DBMS provides an interface between end-users and raw physical storage.

Concurrency Control and Anomaly Prevention:
- Dirty Read: Reading uncommitted data from a concurrent transaction.
- Non-Repeatable Read: Reading different values for the same row across two reads due to concurrent commit.
- Phantom Read: New rows appearing in a range query due to concurrent insertion.
- Two-Phase Locking (2PL): Growing phase (acquires locks) and Shrinking phase (releases locks) ensuring serializability.
- Write-Ahead Logging (WAL): Changes are appended sequentially to log files before data pages are written to disk, ensuring crash recovery.
`,
  },

  // 19. Operating Systems
  {
    title: "Operating Systems: Processes, Threads, Memory, and Scheduling",
    topic: "Operating Systems",
    subtopic: "Core CS",
    role: "Software Engineer",
    difficulty: "medium",
    type: "technical",
    content: `
An Operating System acts as the intermediary between hardware and user software.

Processes vs Threads:
- A Process is an executing program instance with its own dedicated virtual memory address space (text, data, heap, stack).
- A Thread is the smallest unit of CPU execution sharing memory and resources with sibling threads within the same process.
- Context Switching: Saving CPU state (registers, program counter) of an active process/thread and loading state of the next scheduled entity.

Virtual Memory and Paging:
- Translates virtual addresses to physical RAM addresses via Page Tables and the MMU (Memory Management Unit).
- Page Fault: Occurs when accessed page is not loaded in physical RAM, requiring disk swap.
`,
  },

  // 20. Computer Networks
  {
    title: "Computer Networks: OSI Model, TCP vs UDP, DNS, and TLS",
    topic: "Computer Networks",
    subtopic: "Core CS",
    role: "Software Engineer",
    difficulty: "medium",
    type: "technical",
    content: `
Computer networks define protocol suites for reliable data transmission.

TCP/IP & OSI Layers:
- Application (HTTP, DNS, WebSockets), Transport (TCP, UDP), Network (IP, Routing), Data Link, Physical.

TCP vs UDP:
- TCP (Transmission Control Protocol): Connection-oriented, reliable, ordered delivery with flow control and congestion control via 3-Way Handshake (SYN -> SYN-ACK -> ACK).
- UDP (User Datagram Protocol): Connectionless, lightweight, low-latency datagram transmission without retransmission guarantees (streaming, gaming, WebRTC).

DNS Resolution Flow:
- Browser Cache -> OS Resolver -> Recursive DNS Resolver -> Root Server -> TLD Server -> Authoritative DNS Server -> IP address returned.

TLS/SSL Handshake:
- Establishes encrypted symmetric communication using asymmetric key exchange and digital certificate validation.
`,
  },

  // 21. Evaluation Rubrics Knowledge
  {
    title: "Evaluation Rubric: JWT Authentication Mechanism",
    topic: "Authentication",
    subtopic: "JWT Evaluation",
    role: "Full Stack / Backend",
    difficulty: "medium",
    type: "evaluation",
    content: `
Question: How does JWT authentication work and how is token tampering detected?

Expected Candidate Concepts:
1. Three-part structure: Header (algorithm), Payload (claims/userId/exp), Signature (cryptographic hash).
2. Signature verification: Server calculates hash(base64(header) + "." + base64(payload), SECRET) and compares it against the received signature.
3. Tamper detection: Any modification to payload invalidates signature matching without the secret key.
4. Stateless nature: Server does not need database lookups for validation of valid tokens.
5. Expiration and token lifecycle: Short-lived access tokens combined with secure refresh token rotation.
`,
  },
  {
    title: "Evaluation Rubric: React Component Re-rendering and Reconciliation",
    topic: "React",
    subtopic: "React Evaluation",
    role: "Frontend / Full Stack",
    difficulty: "medium",
    type: "evaluation",
    content: `
Question: What causes a React component to re-render, and how does React optimize this?

Expected Candidate Concepts:
1. Triggers for re-renders: State changes (useState/useReducer), Parent component re-renders, Context updates, Prop changes.
2. Virtual DOM Diffing: React renders the component to a new Virtual DOM tree and diffs it with the previous snapshot (Fiber reconciliation).
3. Optimization techniques: React.memo (shallow comparison), useCallback (stable function identity), useMemo (expensive calculations).
4. Keys in lists: Stable keys allow React to identify moved, added, or deleted elements without rebuilding entire DOM subtrees.
`,
  },
];

async function seedRagDatabase() {
  console.log("==========================================");
  console.log("🌱 Starting Prepora RAG Knowledge Base Seeder");
  console.log("==========================================");
  console.log(`Target MongoDB Database: ${MONGODB_URI}`);
  console.log(`Embedding Model: ${process.env.EMBEDDING_MODEL || "gemini-embedding-001"}`);
  console.log(`Embedding Dimensions: ${EMBEDDING_DIMENSION}`);
  console.log(`Total Curated Topics to Ingest: ${SEED_KNOWLEDGE_BASE.length}`);
  console.log("------------------------------------------");

  try {
    await mongoose.connect(MONGODB_URI!);
    console.log(" Connected to MongoDB successfully.");

    let totalChunksIndexed = 0;
    let skippedCount = 0;

    for (let i = 0; i < SEED_KNOWLEDGE_BASE.length; i++) {
      const item = SEED_KNOWLEDGE_BASE[i];
      console.log(`[${i + 1}/${SEED_KNOWLEDGE_BASE.length}] Processing topic: "${item.title}"...`);

      const chunks = chunkText(item.content, { chunkSize: 900, overlap: 130 });

      for (const chunk of chunks) {
        const contentHash = computeContentHash(chunk.content);

        // Duplicate check
        const existing = await RagDocument.findOne({ contentHash });
        if (existing) {
          skippedCount++;
          continue;
        }

        try {
          const embedding = await generateEmbedding(chunk.content);

          await RagDocument.create({
            title: item.title,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            embedding,
            contentHash,
            metadata: {
              type: item.type,
              topic: item.topic,
              subtopic: item.subtopic,
              role: item.role,
              difficulty: item.difficulty,
              source: "prepora-curated-knowledge-v1",
            },
          });

          totalChunksIndexed++;
        } catch (embedError: any) {
          console.error(`  ⚠️ Embedding error for chunk in "${item.title}":`, embedError.message);
        }
      }

      // Small delay between topics to be polite to free-tier API rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log("------------------------------------------");
    console.log("🎉 RAG Knowledge Base Seeding Complete!");
    console.log(`✅ New Chunks Embedded & Inserted: ${totalChunksIndexed}`);
    console.log(`⏭️ Identical Chunks Skipped (Hash Match): ${skippedCount}`);

    const finalCount = await RagDocument.countDocuments();
    console.log(`📚 Total RAG Documents in test.ragdocuments: ${finalCount}`);
    console.log("==========================================");
  } catch (error: any) {
    console.error("❌ Seeding Fatal Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log(" Disconnected from MongoDB.");
  }
}

seedRagDatabase();
