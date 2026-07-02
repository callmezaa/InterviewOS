import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EvaluationResult {
  score: number;
  technicalRating: number;
  communicationRating: number;
  summary: string;
  detailedReview: string;
}

export interface QuestionSet {
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
  testCode: string;
  language: string;
  difficulty: string;
  tags: string[];
  conceptQuestions: string[];
  systemDesign: string;
  hints: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    // Read the GEMINI_API_KEY from environment variables (.env)
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.hasValidKey()) {
      this.logger.warn(
        'Valid GEMINI_API_KEY is not defined. Mock responses will be used.',
      );
    }
  }

  /**
   * Helper check to verify if the key is real and not a default mock value
   */
  private hasValidKey(): boolean {
    return (
      !!this.geminiApiKey &&
      !this.geminiApiKey.startsWith('mock-') &&
      this.geminiApiKey !== 'undefined'
    );
  }

  /**
   * Transcribe a raw audio chunk using Gemini 2.5 Flash's native multimodal capabilities
   * Accepts WebM, WAV, or MP3 buffers and sends them inline.
   */
  async transcribeAudioStream(
    audioChunk: Buffer,
    mimeType = 'audio/webm',
  ): Promise<string> {
    if (!this.hasValidKey()) {
      this.logger.log(
        'No valid Gemini API Key provided. Returning mock transcription segment.',
      );
      return 'This is a mock transcribed text from the live Whisper processing stream.';
    }

    try {
      this.logger.log(
        `Sending audio chunk (${audioChunk.length} bytes, mimeType: ${mimeType}) to Gemini API...`,
      );

      const base64Data = audioChunk.toString('base64');
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: 'Transcribe this audio clip accurately. Do not add any filler or introductory words, just return the plain transcribed speech.',
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text.trim();
    } catch (e) {
      this.logger.error(`Error transcribing audio chunk via Gemini API: ${e}`);
      return '[Audio transcription failed]';
    }
  }

  /**
   * Perform advanced structured technical review & score generation of the candidate session
   */
  async evaluateInterview(
    title: string,
    description: string,
    code: string,
    language: string,
    transcript: Record<string, unknown>[],
  ): Promise<EvaluationResult> {
    if (!this.hasValidKey()) {
      this.logger.log(
        'No valid Gemini API Key provided. Returning mock evaluation dashboard report.',
      );
      return {
        score: 84,
        technicalRating: 4.5,
        communicationRating: 4.0,
        summary:
          'Candidate demonstrated strong problem-solving skills and wrote clean code. Explanations were coherent, although optimization suggestions could have been communicated more proactively.',
        detailedReview: `### 1. Code Quality & Performance\nThe implementation in ${language.toUpperCase()} was syntactically correct and fully functional.\n\n### 2. Communication & Collaboration\nActive communication was maintained throughout.\n\n### 3. Areas of Improvement\nCould explore edge case handling more rigorously prior to writing lines.`,
      };
    }

    try {
      this.logger.log(
        `Requesting structured interview evaluation from Gemini 2.5 Flash...`,
      );
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      // Keep detailedReview compact (no heavy markdown) to avoid truncation
      const prompt = `You are a senior technical interviewer. Evaluate this coding interview session and respond with ONLY a raw JSON object (no markdown fences, no extra text).

Interview: "${title}" | Topic: ${description || 'General Software Engineering'} | Language: ${language}

Code written by candidate:
${code.substring(0, 2000)}

Transcript (last 10 entries):
${JSON.stringify(transcript.slice(-10))}

Return exactly this JSON shape:
{"score":85,"technicalRating":4.2,"communicationRating":4.0,"summary":"One or two sentence overall summary.","detailedReview":"Plain text review covering: 1) Code quality and correctness. 2) Communication. 3) Suggestions for improvement."}

Rules: score 0-100, ratings 0.0-5.0. Keep detailedReview under 400 characters. Output only the JSON object.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const json = await response.json();
      let rawText: string =
        json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      this.logger.log(`Gemini raw response: ${rawText.substring(0, 200)}`);

      // Strip markdown code fences if Gemini wraps the JSON
      rawText = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Extract the first valid JSON object if there's surrounding text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch)
        throw new Error('No JSON object found in Gemini response');

      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      this.logger.error(`Error generating evaluation via Gemini API: ${e}`);
      // Graceful fallback — never crash the user's request
      return {
        score: 78,
        technicalRating: 4.0,
        communicationRating: 3.8,
        summary:
          'AI evaluation could not be completed. This is an auto-generated fallback report.',
        detailedReview:
          'The AI evaluation service encountered an error. Please try again after the session ends.',
      };
    }
  }

  /**
   * Auto-generate code challenges and concept questions based on role & level
   */
  async generateQuestions(
    jobRole: string,
    level: string,
    options?: {
      language?: string;
      difficulty?: string;
      category?: string;
      tags?: string[];
      topic?: string;
    },
  ): Promise<QuestionSet> {
    const roleKey = (jobRole || 'frontend').toLowerCase();
    const lvlKey = (level || 'mid').toLowerCase();
    const lang = options?.language || 'javascript';
    const diffMap: Record<string, string> = { junior: 'EASY', mid: 'MEDIUM', senior: 'HARD' };
    const difficulty = options?.difficulty || diffMap[lvlKey] || 'MEDIUM';
    const topicLine = options?.topic ? `Specific topic/focus area: ${options.topic}\n` : '';
    const tagsLine = options?.tags?.length ? `Tags to incorporate: ${options.tags.join(', ')}\n` : '';

    if (!this.hasValidKey()) {
      this.logger.log(
        `No valid Gemini API Key. Generating mock questions for ${roleKey} (${lvlKey})`,
      );
      return this.getMockQuestions(roleKey, lvlKey, lang, difficulty);
    }

    try {
      this.logger.log(
        `Requesting AI questions for ${roleKey} (${lvlKey}) from Gemini...`,
      );
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const prompt = `You are a Principal Engineer and veteran technical interviewer at a top-tier tech company.
Generate a single, production-quality technical interview coding challenge with all supporting materials.

Job Role: ${roleKey}
Experience Level: ${lvlKey}
Programming Language: ${lang}
Difficulty: ${difficulty}
${topicLine}${tagsLine}
Respond with ONLY a raw JSON object (no markdown fences, no explanation). The JSON must match this structure exactly:

{
  "title": "A concise, professional challenge title (under 80 chars)",
  "description": "A detailed problem statement with: 1) Clear requirements, 2) Input/output format, 3) Constraints, 4) 2-3 concrete examples with expected output",
  "starterCode": "Clean ${lang} template with function signature, docstring/comments explaining parameters and return value, and a partial stub. Should be immediately runnable.",
  "solutionCode": "A complete, correct, well-commented ${lang} solution implementing the challenge. Include edge case handling.",
  "testCode": "3-5 test cases in ${lang} that verify the solution. Use simple assert/expect statements. Include edge cases.",
  "language": "${lang}",
  "difficulty": "${difficulty}",
  "tags": ["relevant-tag-1", "relevant-tag-2", "relevant-tag-3"],
  "conceptQuestions": [
    "Deep-dive question testing core CS knowledge relevant to this challenge",
    "Question about time/space complexity and optimization tradeoffs",
    "Question about real-world applications, scaling, or testing strategies"
  ],
  "systemDesign": "A related system design prompt that builds on the concepts in this challenge",
  "hints": [
    "A gentle nudge to help the candidate get started without giving away the solution",
    "A more specific hint about the key insight or data structure needed",
    "A hint about edge cases or optimization opportunities"
  ]
}

Guidelines:
- The challenge difficulty must match ${difficulty} (${lvlKey} level)
- All code must be valid, runnable ${lang}
- The testCode should use simple assertions, not a testing framework
- Tags should be lowercase, relevant to the topic (e.g. "arrays", "dynamic-programming", "binary-search")
- Keep the total response under 2000 tokens`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const json = await response.json();
      let rawText: string =
        json.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Strip markdown code fences
      rawText = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch)
        throw new Error('No JSON object found in Gemini response');

      const parsed = JSON.parse(jsonMatch[0]);

      // Ensure all fields are present with defaults
      return {
        title: parsed.title || 'Coding Challenge',
        description: parsed.description || '',
        starterCode: parsed.starterCode || '',
        solutionCode: parsed.solutionCode || '',
        testCode: parsed.testCode || '',
        language: parsed.language || lang,
        difficulty: parsed.difficulty || difficulty,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        conceptQuestions: Array.isArray(parsed.conceptQuestions) ? parsed.conceptQuestions : [],
        systemDesign: parsed.systemDesign || '',
        hints: Array.isArray(parsed.hints) ? parsed.hints : [],
      };
    } catch (e) {
      this.logger.error(`Error generating questions via Gemini: ${e}`);
      return this.getMockQuestions(roleKey, lvlKey, lang, difficulty);
    }
  }

  /**
   * Generate multiple question variations at once
   */
  async generateQuestionVariations(
    jobRole: string,
    level: string,
    count: number,
    options?: {
      language?: string;
      difficulty?: string;
      category?: string;
      tags?: string[];
      topic?: string;
    },
  ): Promise<QuestionSet[]> {
    const results: QuestionSet[] = [];
    // Generate sequentially to avoid rate limiting
    for (let i = 0; i < Math.min(count, 3); i++) {
      const result = await this.generateQuestions(jobRole, level, options);
      results.push(result);
    }
    return results;
  }

  private getMockQuestions(role: string, level: string, language = 'javascript', difficulty = 'MEDIUM'): QuestionSet {
    const isSenior = level.includes('senior') || level.includes('staff');

    if (role.includes('frontend')) {
      return {
        title: isSenior
          ? 'High-Performance Virtualized List'
          : 'Debounced Input Search Component',
        description: isSenior
          ? 'Design and implement a virtualized list container that renders large datasets (100,000+ rows) smoothly at 60fps by recycle-binding DOM elements.\n\nConstraints:\n- Height of each row is variable.\n- Support dynamic scrolling without layout shifts.\n\nExamples:\n- Input: 100,000 items, container height 600px → renders only visible rows\n- Input: Scroll to bottom → recycles top elements for bottom items'
          : 'Write a helper class or custom debounce method that throttles fast key stroke event handlers to trigger search requests only after a user stops typing for 300ms.\n\nConstraints:\n- Must preserve `this` context\n- Must pass all arguments to the callback\n\nExamples:\n- Quick inputs "a", "b", "c" within 100ms → only calls search once with "abc"\n- Input with 400ms gap → calls search twice',
        starterCode: isSenior
          ? `// Implement a virtual list bounds calculation\nclass VirtualListContainer {\n  constructor(totalItems, rowHeight) {\n    this.totalItems = totalItems;\n    this.rowHeight = rowHeight;\n  }\n\n  getVisibleRange(scrollTop, containerHeight) {\n    // TODO: Return { startIndex, endIndex, offsetTop }\n    return { startIndex: 0, endIndex: 10, offsetTop: 0 };\n  }\n}`
          : `// Debounce implementation helper\nfunction debounce(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    // TODO: Clear timeout and reschedule\n  };\n}`,
        solutionCode: isSenior
          ? `class VirtualListContainer {\n  constructor(totalItems, rowHeight) {\n    this.totalItems = totalItems;\n    this.rowHeight = rowHeight;\n  }\n\n  getVisibleRange(scrollTop, containerHeight) {\n    const startIndex = Math.floor(scrollTop / this.rowHeight);\n    const visibleCount = Math.ceil(containerHeight / this.rowHeight);\n    const endIndex = Math.min(startIndex + visibleCount + 1, this.totalItems);\n    const offsetTop = startIndex * this.rowHeight;\n    return { startIndex, endIndex, offsetTop };\n  }\n}`
          : `function debounce(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}`,
        testCode: isSenior
          ? `const list = new VirtualListContainer(100000, 30);\nconst r1 = list.getVisibleRange(0, 600);\nassert(r1.startIndex === 0, 'Start should be 0');\nassert(r1.endIndex === 21, 'Should render ~20 rows');\n\nconst r2 = list.getVisibleRange(3000, 600);\nassert(r2.startIndex === 100, 'Start should jump to 100');\nassert(r2.offsetTop === 3000, 'Offset should match scrollTop');`
          : `let callCount = 0;\nconst fn = () => { callCount++; };\nconst debounced = debounce(fn, 300);\ndebounced(); debounced(); debounced();\nassert(callCount === 0, 'Should not call immediately');\n// After 300ms:\nsetTimeout(() => assert(callCount === 1, 'Should call once'), 350);`,
        language,
        difficulty,
        tags: isSenior ? ['virtual-list', 'dom', 'performance', 'recycling'] : ['debounce', 'throttle', 'events', 'async'],
        conceptQuestions: [
          'What is the difference between Reflow and Repaint, and how does layout thrashing occur?',
          'Explain the benefits of React 18 Concurrent Rendering and transition updates.',
          'How do you optimize initial page weight using Route-based Code Splitting?',
        ],
        systemDesign: 'Design a micro-frontend architecture for a multi-tenant enterprise dashboard.',
        hints: [
          'Think about what information you need to calculate which items are visible in the viewport.',
          'Consider how the scroll position maps to item indices when rows have uniform height.',
          'Look at how React Window or react-virtualized handles this pattern internally.',
        ],
      };
    } else if (role.includes('backend')) {
      return {
        title: isSenior ? 'Distributed Rate Limiter' : 'SQL Query Performance & Indexing',
        description: isSenior
          ? 'Implement a distributed sliding-window rate limiting algorithm using Redis. It should restrict API access to 100 requests per minute per IP.\n\nConstraints:\n- Must be thread-safe.\n- Minimal network roundtrips to Redis.\n\nExamples:\n- 101st request within 1 minute → blocked\n- Request after 60s window → allowed'
          : 'Design a database query that lists active products, showing the count of reviews and average rating, optimized with composite indexes.\n\nConstraints:\n- No N+1 query patterns.\n- Must use proper join indices.\n\nExamples:\n- Products with 0 reviews should show count=0, rating=null\n- Only include products where active=true',
        starterCode: isSenior
          ? `async function isRateLimited(redisClient, userId, limit = 100, windowSecs = 60) {\n  const now = Date.now();\n  // TODO: Implement sliding window check\n  return { limited: false, remaining: limit };\n}`
          : `const QUERY = \`\n  SELECT p.id, p.name\n  FROM products p\n  -- TODO: Add review count and average rating\n\`;`,
        solutionCode: isSenior
          ? `async function isRateLimited(redisClient, userId, limit = 100, windowSecs = 60) {\n  const now = Date.now();\n  const windowStart = now - (windowSecs * 1000);\n  const key = \`rate:\${userId}\`;\n  \n  // Remove expired entries\n  await redisClient.zremrangebyscore(key, 0, windowStart);\n  // Count current window\n  const count = await redisClient.zcard(key);\n  \n  if (count >= limit) {\n    return { limited: true, remaining: 0 };\n  }\n  \n  await redisClient.zadd(key, now, \`\${now}:\${Math.random()}\`);\n  await redisClient.expire(key, windowSecs);\n  return { limited: false, remaining: limit - count - 1 };\n}`
          : `const QUERY = \`\n  SELECT p.id, p.name, COUNT(r.id) AS review_count, AVG(r.rating) AS avg_rating\n  FROM products p\n  LEFT JOIN reviews r ON r.product_id = p.id\n  WHERE p.active = true\n  GROUP BY p.id, p.name\n  ORDER BY review_count DESC;\`;`,
        testCode: isSenior
          ? `const mockRedis = {\n  zremrangebyscore: async () => {},\n  zcard: async () => 50,\n  zadd: async () => {},\n  expire: async () => {}\n};\nconst result = await isRateLimited(mockRedis, 'user1', 100, 60);\nassert(result.limited === false, 'Should not be limited at 50');\nassert(result.remaining === 49, 'Should have 49 remaining');`
          : `// Verify the query structure\nassert(QUERY.includes('LEFT JOIN'), 'Should use LEFT JOIN for reviews');\nassert(QUERY.includes('GROUP BY'), 'Should group by product');\nassert(QUERY.includes('AVG'), 'Should calculate average rating');`,
        language,
        difficulty,
        tags: isSenior ? ['rate-limiting', 'redis', 'distributed-systems', 'sliding-window'] : ['sql', 'database', 'indexing', 'optimization'],
        conceptQuestions: [
          'Explain the write-ahead logging (WAL) mechanism and how ACID compliance is guaranteed.',
          'What are the tradeoffs between optimistic and pessimistic locking in database transactions?',
          'How do you design a robust cache invalidation strategy for user sessions?',
        ],
        systemDesign: 'Design a real-time multiplayer gaming lobby system capable of handling 50k active connections.',
        hints: [
          'For the rate limiter, think about what data structure can efficiently track timestamps within a sliding window.',
          'Redis sorted sets (ZSET) are perfect for this — each request is a member with a timestamp score.',
          'Consider what happens at the boundary of the window — do you need a fixed or sliding window?',
        ],
      };
    } else if (role.includes('devops') || role.includes('cloud')) {
      return {
        title: isSenior ? 'Zero-Downtime Blue-Green Deployment CLI' : 'Docker Multi-Stage Build Optimization',
        description: isSenior
          ? 'Write a deployment orchestrator script that performs rolling validation checks on a target Docker Swarm cluster to switch traffic cleanly.\n\nConstraints:\n- Auto-rollback if health checks fail.\n- Zero downtime during the switch.'
          : 'Optimize a Dockerfile for a Next.js frontend app to reduce image size from 1.2GB to under 150MB using multi-stage compilation builds.\n\nConstraints:\n- Must include production dependencies only.\n- Must support environment variable injection at runtime.',
        starterCode: `function validateHealthStatus(endpoints) {\n  // TODO: Run ping and response duration audits\n  return { healthy: true, failedEndpoints: [] };\n}`,
        solutionCode: `async function validateHealthStatus(endpoints) {\n  const failedEndpoints = [];\n  for (const ep of endpoints) {\n    try {\n      const res = await fetch(ep, { signal: AbortSignal.timeout(5000) });\n      if (!res.ok) failedEndpoints.push({ url: ep, status: res.status });\n    } catch (e) {\n      failedEndpoints.push({ url: ep, error: e.message });\n    }\n  }\n  return { healthy: failedEndpoints.length === 0, failedEndpoints };\n}`,
        testCode: `const endpoints = ['http://localhost:3000/health', 'http://localhost:3001/health'];\nconst result = await validateHealthStatus(endpoints);\nassert(typeof result.healthy === 'boolean', 'Should return boolean healthy status');\nassert(Array.isArray(result.failedEndpoints), 'Should return failed endpoints array');`,
        language,
        difficulty,
        tags: isSenior ? ['deployment', 'blue-green', 'docker', 'orchestration'] : ['docker', 'optimization', 'multi-stage', 'containers'],
        conceptQuestions: [
          'How does Kubernetes ingress controllers handle SSL termination and path routing?',
          'Explain Infrastructure-as-Code (IaC) state locking and remote backend architectures.',
          'What are the best practices to secure container runtimes and root privilege escalations?',
        ],
        systemDesign: 'Design a global multi-region CI/CD pipeline featuring auto-scaling runner pools and caching.',
        hints: [
          'Think about what stages a Dockerfile needs — build, install dependencies, and runtime.',
          'Multi-stage builds let you use a large image for building and a slim image for running.',
          'Look at how .dockerignore and layer caching can reduce build times and image size.',
        ],
      };
    } else {
      return {
        title: 'System Design: Scalable URL Shortener',
        description: 'Design a scalable URL shortener system like Bit.ly. Focus on database design, caching layers, and high redirection throughput.\n\nConstraints:\n- Must handle 100M URLs\n- Sub-10ms redirect latency\n- 10K requests/second',
        starterCode: `function generateShortKey(longUrl) {\n  // TODO: Implement base62 hash translation\n  return "";\n}\n\nasync function shortenUrl(longUrl) {\n  // TODO: Create short URL and store mapping\n  return "";\n}`,
        solutionCode: `const crypto = require('crypto');\nconst urlMap = new Map();\n\nfunction generateShortKey(longUrl) {\n  const hash = crypto.createHash('md5').update(longUrl + Date.now()).digest('hex');\n  return hash.slice(0, 7);\n}\n\nasync function shortenUrl(longUrl) {\n  const key = generateShortKey(longUrl);\n  urlMap.set(key, longUrl);\n  return \`https://short.co/\${key}\`;\n}`,
        testCode: `const shortUrl = await shortenUrl('https://example.com/very/long/path');\nassert(shortUrl.startsWith('https://short.co/'), 'Should return short URL');\nassert(shortUrl.length < 40, 'Short URL should be concise');`,
        language,
        difficulty,
        tags: ['system-design', 'url-shortener', 'hashing', 'caching'],
        conceptQuestions: [
          'What are the tradeoffs between using SQL vs NoSQL for URL key mappings?',
          'Explain how database sharding works and how to choose a partition key.',
          'How do you handle hot-spot keys in a global caching layer?',
        ],
        systemDesign: 'Design a real-time analytics dashboard tracking page views and clicks.',
        hints: [
          'Consider using a hash function (MD5 or SHA-256) and taking the first N characters.',
          'Base62 encoding (a-z, A-Z, 0-9) gives you more unique keys per character than base10.',
          'Think about collision handling — what happens if two URLs generate the same key?',
        ],
      };
    }
  }

  /**
   * Real-time technical follow-up questions recommendation based on transcript and editor code
   */
  async suggestFollowUpQuestions(
    transcript: { speakerName: string; text: string }[],
    code: string,
    language: string,
  ): Promise<{ question: string; hint: string }[]> {
    if (!this.hasValidKey()) {
      this.logger.log(
        'No valid Gemini API key. Generating high-quality static follow-up questions.',
      );
      return this.getMockFollowUpQuestions(language, code);
    }

    try {
      this.logger.log(
        'Generating contextual follow-up questions from Gemini...',
      );

      // Clean up transcript snippet
      const transcriptSnippet = transcript
        .slice(-8)
        .map((t) => `${t.speakerName}: "${t.text}"`)
        .join('\n');

      const prompt = `You are a Principal Software Engineer conducting a live technical interview.
Analyze the current state of the interview and suggest 3 highly specific follow-up questions for the interviewer to ask.

Programming Language: ${language}
Current Code written by candidate:
\`\`\`${language}
${code.substring(0, 1500)}
\`\`\`

Last Conversation Transcript:
${transcriptSnippet || '(No conversation recorded yet)'}

Respond with ONLY a raw JSON array of objects (no markdown fences, no extra text). The shape must be exactly:
[
  {
    "question": "A sharp, contextual technical question addressing their implementation details, edge cases, potential bugs, or performance aspects.",
    "hint": "What the interviewer should look for in their response (e.g. key terms, correct approach)."
  }
]

Keep questions concise (1-2 sentences). Respond only with the JSON array.`;

      // Correct endpoints for Gemini
      const geminiUrl =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.5,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${errText}`);
      }

      const json = await response.json();
      let rawText: string =
        json.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Clean markdown code blocks if any
      rawText = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in Gemini response');

      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      this.logger.error(`Error generating suggestFollowUpQuestions: ${e}`);
      return this.getMockFollowUpQuestions(language, code);
    }
  }

  private getMockFollowUpQuestions(
    language: string,
    _code: string,
  ): { question: string; hint: string }[] {
    const lang = (language || 'javascript').toLowerCase();

    if (lang.includes('javascript') || lang.includes('typescript')) {
      return [
        {
          question:
            'How would you handle error handling if an async operation in your code fails?',
          hint: 'Candidate should explain try-catch blocks with async/await or promise rejection handling (.catch).',
        },
        {
          question:
            'Are there any memory leak risks or excessive re-rendering in this code if integrated into a React component?',
          hint: 'Watch for whether the candidate understands closures, event listener cleanup, or useEffect dependency arrays.',
        },
        {
          question:
            'How would you improve execution performance for very large inputs (e.g., 1 million rows)?',
          hint: 'Candidate should suggest data structure optimization (Map/Set) for O(1) lookups over nested O(N^2) loops.',
        },
      ];
    } else if (lang.includes('python')) {
      return [
        {
          question:
            'How memory-efficient is your code if a generator is used instead of a list comprehension?',
          hint: 'Candidate should mention lazy evaluation in Python generators, which do not load all items into RAM.',
        },
        {
          question:
            "How would Python's Global Interpreter Lock (GIL) affect this code if run in a multi-threaded context?",
          hint: 'Candidate should explain that the GIL limits CPU-bound thread execution and suggest multiprocessing for full parallelism.',
        },
        {
          question:
            'How would you write unit tests to validate edge cases like None or empty input values?',
          hint: 'Looking for understanding of unittest or pytest, assertions, and safe exception handling.',
        },
      ];
    } else {
      return [
        {
          question:
            'Can you identify scenarios where this code would hit memory limits or cause a stack overflow?',
          hint: 'Candidate should analyze recursion without a proper base case, unreleased memory allocation, or array overflow.',
        },
        {
          question:
            'How would you redesign this module to be more testable using Dependency Injection?',
          hint: 'Candidate should separate external dependency initialization and pass them through constructor/arguments.',
        },
        {
          question:
            'If this function must be accessed by multiple workers/threads concurrently, is this implementation safe from race conditions?',
          hint: 'Candidate should analyze global/shared state variables and suggest locking mechanisms (mutex, locks, or atomic operations).',
        },
      ];
    }
  }

  async analyzeCodeComplexity(
    code: string,
    language: string,
  ): Promise<{
    timeComplexity: string;
    spaceComplexity: string;
    optimizations: string[];
  }> {
    if (
      !this.geminiApiKey ||
      this.geminiApiKey.startsWith('mock-') ||
      this.geminiApiKey === 'undefined'
    ) {
      return this.getMockComplexityAnalysis(code);
    }

    try {
      const prompt = `Analyze the complexity of the following code snippet written in ${language}.
Code:
${code}

Respond with ONLY a raw JSON object (no markdown fences, no extra text). The shape must be exactly:
{
  "timeComplexity": "e.g. O(N), O(log N), O(1), O(N^2)",
  "spaceComplexity": "e.g. O(1), O(N), O(N^2)",
  "optimizations": [
    "optimization suggestion 1",
    "optimization suggestion 2"
  ]
}

Ensure the suggestions are practical and specific to the provided code. Ensure the response is valid JSON.`;

      const geminiUrl =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${errText}`);
      }

      const json = await response.json();
      let rawText: string =
        json.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Clean markdown code blocks if any
      rawText = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch)
        throw new Error('No JSON object found in Gemini response');

      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      this.logger.error(`Error analyzing code complexity: ${e}`);
      return this.getMockComplexityAnalysis(code);
    }
  }

  private getMockComplexityAnalysis(code: string): {
    timeComplexity: string;
    spaceComplexity: string;
    optimizations: string[];
  } {
    let timeComplexity = 'O(1)';
    let spaceComplexity = 'O(1)';
    const optimizations = ['Use caching if the function is called repeatedly'];

    if (code.includes('for') || code.includes('while')) {
      timeComplexity = 'O(N)';
      const loops = (code.match(/for|while/g) || []).length;
      if (
        loops > 1 &&
        (code.includes('nested') ||
          code.indexOf('for', code.indexOf('for') + 1) !== -1)
      ) {
        timeComplexity = 'O(N^2)';
      }
    }

    if (
      code.includes('map') ||
      code.includes('filter') ||
      code.includes('reduce')
    ) {
      timeComplexity = 'O(N)';
      spaceComplexity = 'O(N)';
    }

    if (code.includes('recursion') || code.includes('recursive')) {
      timeComplexity = 'O(2^N)';
      spaceComplexity = 'O(N)';
    }

    if (code.includes('binarySearch') || code.includes('binary search')) {
      timeComplexity = 'O(log N)';
    }

    if (
      code.includes('Set') ||
      code.includes('Map') ||
      code.includes('new Array') ||
      code.includes('.push(')
    ) {
      spaceComplexity = 'O(N)';
    }

    if (timeComplexity === 'O(N^2)') {
      optimizations.push(
        'Optimize data structures with Map/Set to reduce complexity to O(N)',
      );
    }
    if (spaceComplexity === 'O(N)') {
      optimizations.push('Use generators or streaming to save memory space');
    }
    optimizations.push('Add boundary input validation and edge case handling');

    return {
      timeComplexity,
      spaceComplexity,
      optimizations,
    };
  }
}
