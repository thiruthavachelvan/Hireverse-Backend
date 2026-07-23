const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const QuestionBank = require('./models/QuestionBank');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hireverse';

const sampleQuestions = [
  // ── 1. Aptitude MCQs ──────────────────────────────────────────────────
  {
    category: 'Aptitude',
    subCategory: 'Quantitative Aptitude',
    difficulty: 'Easy',
    type: 'MCQ',
    question: 'A train 150m long is running at a speed of 54 km/hr. How much time will it take to cross a platform 210m long?',
    options: ['18 seconds', '24 seconds', '20 seconds', '22 seconds'],
    correctAnswer: '24 seconds',
    explanation: 'Total distance = 150 + 210 = 360m. Speed in m/s = 54 * (5/18) = 15 m/s. Time = 360 / 15 = 24 seconds.',
    expectedTime: 2,
    marks: 5,
    tags: ['speed', 'distance', 'trains'],
    technology: 'General',
  },
  {
    category: 'Aptitude',
    subCategory: 'Permutation & Combination',
    difficulty: 'Medium',
    type: 'MCQ',
    question: 'In how many different ways can the letters of the word "STARTUP" be arranged so that vowels always come together?',
    options: ['360', '720', '1440', '2880'],
    correctAnswer: '720',
    explanation: 'Vowels are A, U (2 vowels). Treat (AU) as 1 block. Remaining letters: S, T, R, T, P (5 letters). Total blocks = 6. Since T repeats twice, ways = (6! / 2!) * 2! = 720.',
    expectedTime: 3,
    marks: 10,
    tags: ['permutation', 'combinations'],
    technology: 'General',
  },
  {
    category: 'Aptitude',
    subCategory: 'Logical Reasoning',
    difficulty: 'Hard',
    type: 'MCQ',
    question: 'Pointing to a photograph, Rahul said, "She is the daughter of my grandfather\'s only son." How is the girl in the photograph related to Rahul?',
    options: ['Sister', 'Cousin', 'Niece', 'Mother'],
    correctAnswer: 'Sister',
    explanation: 'Grandfather\'s only son = Rahul\'s father. Daughter of Rahul\'s father = Rahul\'s sister.',
    expectedTime: 2,
    marks: 10,
    tags: ['blood-relations', 'logical'],
    technology: 'General',
  },

  // ── 2. Technical MCQs ─────────────────────────────────────────────────
  {
    category: 'Technical',
    subCategory: 'React & Frontend Frameworks',
    difficulty: 'Medium',
    type: 'MCQ',
    question: 'In React 18, what is the primary purpose of the `useTransition` hook?',
    options: [
      'To manage page transition animations smoothly',
      'To mark state updates as non-urgent transitions to keep UI responsive',
      'To automatically memoize component props',
      'To handle asynchronous data fetching during server rendering'
    ],
    correctAnswer: 'To mark state updates as non-urgent transitions to keep UI responsive',
    explanation: '`useTransition` allows developers to defer non-critical rendering (like filtering a large list) so that user input remains lag-free.',
    expectedTime: 2,
    marks: 10,
    tags: ['react', 'hooks', 'performance'],
    technology: 'React',
  },
  {
    category: 'Technical',
    subCategory: 'Node.js & Backend Architecture',
    difficulty: 'Hard',
    type: 'MCQ',
    question: 'When Node.js runs an asynchronous I/O operation (e.g. `fs.readFile`), which Libuv threadpool size setting controls thread allocation by default?',
    options: ['UV_THREADPOOL_SIZE (default: 4)', 'NODE_MAX_THREADS (default: 8)', 'PROCESS_THREAD_LIMIT (default: 16)', 'LIBUV_WORKERS (default: 2)'],
    correctAnswer: 'UV_THREADPOOL_SIZE (default: 4)',
    explanation: 'Libuv initializes a default thread pool of 4 threads. It can be adjusted via process.env.UV_THREADPOOL_SIZE up to 1024 threads.',
    expectedTime: 3,
    marks: 15,
    tags: ['nodejs', 'event-loop', 'libuv'],
    technology: 'Node.js',
  },
  {
    category: 'Technical',
    subCategory: 'Databases & Indexing',
    difficulty: 'Expert',
    type: 'MCQ',
    question: 'In PostgreSQL, why might a B-Tree index scan be bypassed in favor of a Sequential Scan even when an indexed column is queried?',
    options: [
      'B-Tree indexes cannot index text columns',
      'The query planner estimates that retrieving a large percentage of table rows via index random I/O is slower than sequential read',
      'PostgreSQL disables indexes when transaction isolation is set to Read Committed',
      'Foreign keys disable index scanning automatically'
    ],
    correctAnswer: 'The query planner estimates that retrieving a large percentage of table rows via index random I/O is slower than sequential read',
    explanation: 'Sequential reads are significantly faster per page than random disk fetches. If a query matches >15-20% of a table, sequential scan is preferred by the cost-based optimizer.',
    expectedTime: 4,
    marks: 20,
    tags: ['postgresql', 'indexing', 'query-optimization'],
    technology: 'PostgreSQL',
  },

  // ── 3. Coding Challenges ──────────────────────────────────────────────
  {
    category: 'Coding',
    subCategory: 'Arrays & Hashing',
    difficulty: 'Easy',
    type: 'Coding',
    question: 'Two Sum Problem',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    problemTitle: 'Two Sum',
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // Your code here\n}',
      python: 'def twoSum(nums, target):\n    # Your code here\n    pass',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}',
      cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n}',
    },
    sampleInput: '[2, 7, 11, 15], target = 9',
    sampleOutput: '[0, 1]',
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', isHidden: false },
      { input: 'nums = [3,2,4], target = 6', output: '[1, 2]', isHidden: true },
    ],
    expectedTime: 15,
    marks: 20,
    tags: ['hashmap', 'arrays', 'leetcode-easy'],
    technology: 'JavaScript',
  },
  {
    category: 'Coding',
    subCategory: 'Dynamic Programming',
    difficulty: 'Hard',
    type: 'Coding',
    question: 'Longest Increasing Subsequence',
    description: 'Given an integer array `nums`, return the length of the longest strictly increasing subsequence in O(N log N) time complexity.',
    problemTitle: 'Longest Increasing Subsequence',
    starterCode: {
      javascript: 'function lengthOfLIS(nums) {\n  // Implement O(N log N) binary search approach\n}',
      python: 'def lengthOfLIS(nums):\n    # Implement O(N log N) binary search approach\n    pass',
    },
    sampleInput: '[10,9,2,5,3,7,101,18]',
    sampleOutput: '4',
    testCases: [
      { input: '[10,9,2,5,3,7,101,18]', output: '4', isHidden: false },
      { input: '[0,1,0,3,2,3]', output: '4', isHidden: true },
    ],
    expectedTime: 30,
    marks: 40,
    tags: ['dp', 'binary-search', 'algorithms'],
    technology: 'Python',
  },

  // ── 4. Debugging Challenges ───────────────────────────────────────────
  {
    category: 'Debugging',
    subCategory: 'React State Mutability',
    difficulty: 'Medium',
    type: 'Debugging',
    question: 'Fix Stale Closure Bug in React Timer',
    description: 'The counter below is supposed to increment every second, but it freezes at 1 due to a closure capture bug in `useEffect`. Fix the code so it increments indefinitely.',
    starterCode: {
      javascript: `import React, { useState, useEffect } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1); // BUG: stale count variable captured
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <h1>{count}</h1>;
}`
    },
    explanation: 'Change `setCount(count + 1)` to functional state update `setCount(prev => prev + 1)` to eliminate stale closure dependency.',
    expectedTime: 10,
    marks: 25,
    tags: ['react', 'debugging', 'hooks'],
    technology: 'React',
  },

  // ── 5. Frontend UI Challenges ──────────────────────────────────────────
  {
    category: 'Frontend',
    subCategory: 'UI Component Design',
    difficulty: 'Medium',
    type: 'Frontend',
    question: 'Build a Responsive Glassmorphic Metric Card',
    description: 'Create a reusable Metric Card component displaying revenue, growth percentage, animated trend sparkline, and light/dark theme toggle.',
    starterCode: {
      javascript: `export default function MetricCard({ title, value, change }) {
  return (
    <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
      {/* Implement metric UI */}
    </div>
  );
}`
    },
    expectedTime: 30,
    marks: 50,
    tags: ['frontend', 'react', 'tailwind'],
    technology: 'React',
  },

  // ── 6. Backend / API Challenges ───────────────────────────────────────
  {
    category: 'Backend',
    subCategory: 'API Security & Rate Limiting',
    difficulty: 'Hard',
    type: 'Backend',
    question: 'Build a Sliding Window Rate Limiter Middleware',
    description: 'Write an Express middleware using Redis or memory to enforce a rate limit of 100 requests per minute per IP using a Sliding Window Log algorithm.',
    starterCode: {
      javascript: `const rateLimiter = (limit, windowMs) => {
  return async (req, res, next) => {
    // Implement sliding window rate limit
  };
};`
    },
    expectedTime: 30,
    marks: 60,
    tags: ['backend', 'express', 'redis', 'rate-limit'],
    technology: 'Node.js',
  },

  // ── 7. Database Design ─────────────────────────────────────────────────
  {
    category: 'Database',
    subCategory: 'Schema Design & Indexing',
    difficulty: 'Hard',
    type: 'Database',
    question: 'Design E-Commerce Order & Inventory Schema for High Concurrency Flash Sales',
    description: 'Design a PostgreSQL or MongoDB database schema for flash sales handling 10,000 orders/sec without inventory overselling or deadlocks.',
    expectedTime: 25,
    marks: 50,
    tags: ['database', 'concurrency', 'transactions'],
    technology: 'PostgreSQL',
  },

  // ── 8. System Design ───────────────────────────────────────────────────
  {
    category: 'System Design',
    subCategory: 'High Availability Distributed Systems',
    difficulty: 'Expert',
    type: 'SystemDesign',
    question: 'Design a Distributed Real-Time Notification Platform (WhatsApp / Push Engine)',
    description: 'Architect a distributed notification service that delivers push notifications, SMS, and WebSocket messages to 50M daily active users with sub-second latency and idempotent delivery guarantees.',
    initialNodes: [
      { id: '1', type: 'api-gateway', label: 'API Gateway', x: 100, y: 150 },
      { id: '2', type: 'queue', label: 'Kafka Event Stream', x: 300, y: 150 },
      { id: '3', type: 'server', label: 'Push Worker Cluster', x: 500, y: 100 },
      { id: '4', type: 'db', label: 'Redis Connection State', x: 500, y: 220 },
    ],
    expectedTime: 45,
    marks: 100,
    tags: ['system-design', 'distributed-systems', 'kafka', 'websockets'],
    technology: 'Architecture',
  },

  // ── 9. Product Thinking ────────────────────────────────────────────────
  {
    category: 'Product Thinking',
    subCategory: 'Product Strategy & Growth',
    difficulty: 'Medium',
    type: 'ProductThinking',
    question: 'How would you redesign Swiggy Instamart checkout to improve 3-minute quick commerce conversion?',
    description: 'Detail user friction points, proposed UX flows, fallback mechanics during stockouts, and expected key metrics (AOV, conversion %, checkout dropoff).',
    expectedTime: 30,
    marks: 50,
    tags: ['product-management', 'ux-strategy', 'growth'],
    technology: 'Product',
  },

  // ── 10. Founder Challenge ──────────────────────────────────────────────
  {
    category: 'Founder Challenge',
    subCategory: '0-to-1 Startup Execution',
    difficulty: 'Expert',
    type: 'FounderChallenge',
    question: 'Build a High-Converting MVP Landing Page & Pitch Strategy for an AI Developer Tool',
    description: 'You are the founding engineer/product lead. Create a pitch deck outline, live landing page component wireframe, and 48-hour launch plan on ProductHunt.',
    deliverables: [
      'Value Proposition & Tagline',
      'Interactive Hero Section Code or Mockup',
      'Launch & Distribution Strategy (ProductHunt, HackerNews, X)',
      'Pricing Model (Freemium vs Usage-Based API)'
    ],
    expectedTime: 60,
    marks: 100,
    tags: ['founder', 'startup', 'mvp', '0-to-1'],
    technology: 'Startup Strategy',
  },

  // ── 11. Culture Fit & Behavioral ───────────────────────────────────────
  {
    category: 'Culture Fit',
    subCategory: 'Startup Ownership & Mindset',
    difficulty: 'Medium',
    type: 'CultureFit',
    question: 'Why choose an early-stage startup over an established tech MNC at this point in your career?',
    description: 'Explain your motivation for high autonomy, ambiguous problem domains, speed of execution, and willingness to wear multiple hats.',
    expectedTime: 15,
    marks: 25,
    tags: ['culture-fit', 'startup-mindset'],
    technology: 'Behavioral',
  },
  {
    category: 'Behavioral',
    subCategory: 'STAR Method Leadership',
    difficulty: 'Hard',
    type: 'Behavioral',
    question: 'Describe a situation where a critical production feature failed right before a major client demo. How did you respond?',
    description: 'Use the STAR method (Situation, Task, Action, Result) to detail root cause identification, stakeholder communication, emergency patch, and long-term preventive measures.',
    expectedTime: 20,
    marks: 30,
    tags: ['star-method', 'leadership', 'crisis-management'],
    technology: 'Behavioral',
  },

  // ── 12. DevOps & Infrastructure ────────────────────────────────────────
  {
    category: 'DevOps',
    subCategory: 'Docker & Kubernetes',
    difficulty: 'Hard',
    type: 'DevOps',
    question: 'Write a Multi-Stage Dockerfile & Kubernetes Deployment Manifest for a Node.js API with Zero Downtime Rolling Updates',
    description: 'Provide an optimized production-grade Dockerfile using alpine base image, multi-stage caching, and a Kubernetes deployment YAML with readiness/liveness probes and HPA.',
    starterCode: {
      javascript: `# Multi-stage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]`
    },
    expectedTime: 25,
    marks: 50,
    tags: ['devops', 'docker', 'kubernetes', 'ci-cd'],
    technology: 'Docker',
  },

  // ── 13. Cybersecurity CTF ──────────────────────────────────────────────
  {
    category: 'Cybersecurity',
    subCategory: 'Web Application Security & JWT Vulnerabilities',
    difficulty: 'Hard',
    type: 'Cybersecurity',
    question: 'Identify and Exploit the JWT Algorithm Confusion Vulnerability (HS256 vs RS256)',
    description: 'The authentication server verifies signatures using RS256 public key. Explain how an attacker can manipulate the header to `alg: HS256` using the public key as HMAC secret to bypass auth.',
    expectedTime: 25,
    marks: 50,
    tags: ['cybersecurity', 'jwt', 'ctf', 'web-security'],
    technology: 'Security',
  }
];

const seedQuestionBank = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for Question Bank Seeding');

    // Remove old sample questions
    await QuestionBank.deleteMany({});
    console.log('🗑️ Wiped existing QuestionBank collection');

    const created = await QuestionBank.insertMany(sampleQuestions);
    console.log(`🚀 Successfully seeded ${created.length} high-quality questions across Aptitude, Technical, Coding, System Design, Founder Challenges & more!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Question Bank Seed Error:', error);
    process.exit(1);
  }
};

seedQuestionBank();
