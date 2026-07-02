"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcrypt.hash('demo123456', 10);
    const interviewer = await prisma.user.upsert({
        where: { email: 'demo@interviewer.com' },
        update: {
            passwordHash,
            emailVerified: new Date(),
            name: 'Demo Interviewer',
        },
        create: {
            email: 'demo@interviewer.com',
            name: 'Demo Interviewer',
            passwordHash,
            role: client_1.Role.INTERVIEWER,
            emailVerified: new Date(),
        },
    });
    const candidate = await prisma.user.upsert({
        where: { email: 'demo@candidate.com' },
        update: {
            passwordHash,
            emailVerified: new Date(),
            name: 'Demo Candidate',
        },
        create: {
            email: 'demo@candidate.com',
            name: 'Demo Candidate',
            passwordHash,
            role: client_1.Role.CANDIDATE,
            emailVerified: new Date(),
        },
    });
    const now = new Date();
    await prisma.interview.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            title: 'Frontend Engineer Interview',
            description: 'Mid-level frontend position with React focus',
            status: client_1.InterviewStatus.SCHEDULED,
            scheduledTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            participants: {
                create: [
                    { userId: interviewer.id, role: client_1.Role.INTERVIEWER },
                    { userId: candidate.id, role: client_1.Role.CANDIDATE },
                ],
            },
        },
    });
    await prisma.interview.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000002',
            title: 'Backend Engineer Interview',
            description: 'Senior backend position with Node.js',
            status: client_1.InterviewStatus.COMPLETED,
            scheduledTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            codeContent: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}',
            language: 'javascript',
            recordingUrl: null,
            recordingSize: null,
            recordingDuration: null,
            recordingMimeType: null,
            feedback: {
                score: 82,
                technicalRating: 4.1,
                communicationRating: 3.9,
                summary: 'Good problem-solving approach with room for optimization.',
                detailedReview: 'Candidate demonstrated solid recursion knowledge but could improve on time complexity analysis.',
            },
            participants: {
                create: [
                    { userId: interviewer.id, role: client_1.Role.INTERVIEWER },
                    { userId: candidate.id, role: client_1.Role.CANDIDATE },
                ],
            },
        },
    });
    const categories = [
        { name: 'Algorithms', slug: 'algorithms', description: 'Data structures, sorting, searching, and algorithmic problem-solving', icon: 'code', order: 1 },
        { name: 'Frontend', slug: 'frontend', description: 'React, CSS, DOM, browser APIs, and UI engineering', icon: 'layout', order: 2 },
        { name: 'Backend', slug: 'backend', description: 'API design, databases, authentication, and server architecture', icon: 'server', order: 3 },
        { name: 'System Design', slug: 'system-design', description: 'Distributed systems, scalability, and architecture trade-offs', icon: 'network', order: 4 },
        { name: 'Database', slug: 'database', description: 'SQL, NoSQL, indexing, query optimization, and data modeling', icon: 'database', order: 5 },
        { name: 'DevOps', slug: 'devops', description: 'CI/CD, containers, cloud infrastructure, and monitoring', icon: 'cloud', order: 6 },
        { name: 'JavaScript', slug: 'javascript', description: 'Core JS concepts, closures, promises, and ES6+ features', icon: 'file-text', order: 7 },
        { name: 'Python', slug: 'python', description: 'Python fundamentals, decorators, generators, and standard library', icon: 'terminal', order: 8 },
    ];
    const categoryRecords = {};
    for (const cat of categories) {
        const record = await prisma.questionCategory.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name, description: cat.description, icon: cat.icon, order: cat.order },
            create: cat,
        });
        categoryRecords[cat.slug] = record.id;
    }
    const curatedQuestions = [
        {
            title: 'Two Sum',
            description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to `target`. Assume each input has exactly one solution, and you may not use the same element twice. Optimize for better than O(n²) time complexity.',
            starterCode: 'function twoSum(nums: number[], target: number): number[] {\n  // Your code here\n}\n',
            solutionCode: 'function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
            testCode: 'describe("twoSum", () => {\n  it("returns indices for basic case", () => {\n    expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);\n  });\n  it("handles negative numbers", () => {\n    expect(twoSum([-3, 4, 3, 90], 0)).toEqual([0, 2]);\n  });\n  it("returns empty array when no solution", () => {\n    expect(twoSum([1, 2, 3], 7)).toEqual([]);\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.EASY,
            categorySlug: 'algorithms',
            tags: ['arrays', 'hash-map', 'interview-classic'],
            conceptQuestions: ['Explain the time and space complexity of your solution.', 'How would you handle multiple valid pairs?', 'What if the array is sorted — can you improve the solution?'],
            systemDesign: 'Design a rate-limited API that supports a similar lookup pattern at scale.',
            hints: ['Consider using a hash map to store previously seen values.', 'The complement of nums[i] is target - nums[i].', 'You only need one pass through the array.'],
        },
        {
            title: 'Valid Parentheses',
            description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. A string is valid if: (1) Open brackets must be closed by the same type of brackets, (2) Open brackets must be closed in the correct order.',
            starterCode: 'function isValid(s: string): boolean {\n  // Your code here\n}\n',
            solutionCode: 'function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const pairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };\n  for (const char of s) {\n    if (char in pairs) {\n      if (stack.pop() !== pairs[char]) return false;\n    } else {\n      stack.push(char);\n    }\n  }\n  return stack.length === 0;\n}',
            testCode: 'describe("isValid", () => {\n  it("returns true for valid pairs", () => {\n    expect(isValid("()")).toBe(true);\n    expect(isValid("()[]{}")).toBe(true);\n    expect(isValid("{[]}")).toBe(true);\n  });\n  it("returns false for invalid", () => {\n    expect(isValid("(]")).toBe(false);\n    expect(isValid("([)]")).toBe(false);\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.EASY,
            categorySlug: 'algorithms',
            tags: ['stack', 'string', 'parsing'],
            conceptQuestions: ['What is the time complexity of a stack-based approach?', 'How would you extend this to support additional bracket types?', 'Can you solve this without using a stack?'],
            systemDesign: 'Design a system that validates millions of parentheses strings per second in a distributed environment.',
            hints: ['A stack is the natural data structure for bracket matching.', 'Think about what information you need to track as you scan left to right.'],
        },
        {
            title: 'Debounce Function',
            description: 'Implement a `debounce` function that takes a callback and a delay (ms). The returned function should delay invoking the callback until after `delay` ms have elapsed since the last call. If called again within that window, the timer resets.',
            starterCode: 'function debounce<T extends (...args: unknown[]) => unknown>(\n  fn: T,\n  delay: number\n): (...args: Parameters<T>) => void {\n  // Your code here\n}\n',
            solutionCode: 'function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {\n  let timer: ReturnType<typeof setTimeout> | null = null;\n  return (...args: Parameters<T>) => {\n    if (timer) clearTimeout(timer);\n    timer = setTimeout(() => {\n      fn(...args);\n      timer = null;\n    }, delay);\n  };\n}',
            testCode: 'describe("debounce", () => {\n  it("delays execution", async () => {\n    let count = 0;\n    const fn = () => { count++; };\n    const debounced = debounce(fn, 100);\n    debounced();\n    expect(count).toBe(0);\n    await new Promise(r => setTimeout(r, 150));\n    expect(count).toBe(1);\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            categorySlug: 'javascript',
            tags: ['closures', 'timers', 'async', 'utility'],
            conceptQuestions: ['How does the closure capture the timer variable?', 'What happens if the user calls the debounced function with different arguments each time?', 'Implement a leading-edge debounce variant.'],
            systemDesign: 'Design a search-as-you-type feature that uses debounce to reduce backend load while maintaining responsiveness.',
            hints: ['You need to maintain a reference to the timer across multiple calls.', 'Consider what should happen to the `this` context.'],
        },
        {
            title: 'React State Management: Shopping Cart',
            description: 'Build a custom React hook `useShoppingCart` that manages add, remove, update quantity, and total calculation. It should support items with `id`, `name`, `price`, and `quantity`. Expose derived state (subtotal, tax, total) efficiently.',
            starterCode: 'import { useState, useCallback, useMemo } from "react";\n\ninterface CartItem {\n  id: string;\n  name: string;\n  price: number;\n  quantity: number;\n}\n\ninterface ShoppingCart {\n  items: CartItem[];\n  addItem: (item: Omit<CartItem, "quantity">) => void;\n  removeItem: (id: string) => void;\n  updateQuantity: (id: string, quantity: number) => void;\n  clear: () => void;\n  subtotal: number;\n  tax: number;\n  total: number;\n  itemCount: number;\n}\n\nexport function useShoppingCart(): ShoppingCart {\n  // Your code here\n}\n',
            solutionCode: 'export function useShoppingCart(): ShoppingCart {\n  const [items, setItems] = useState<CartItem[]>([]);\n  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {\n    setItems(prev => {\n      const existing = prev.find(i => i.id === item.id);\n      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);\n      return [...prev, { ...item, quantity: 1 }];\n    });\n  }, []);\n  const removeItem = useCallback((id: string) => {\n    setItems(prev => prev.filter(i => i.id !== id));\n  }, []);\n  const updateQuantity = useCallback((id: string, quantity: number) => {\n    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i));\n  }, []);\n  const clear = useCallback(() => setItems([]), []);\n  const { subtotal, tax, total, itemCount } = useMemo(() => {\n    const sub = items.reduce((sum, i) => sum + i.price * i.quantity, 0);\n    const t = sub * 0.08;\n    return { subtotal: sub, tax: t, total: sub + t, itemCount: items.reduce((c, i) => c + i.quantity, 0) };\n  }, [items]);\n  return { items, addItem, removeItem, updateQuantity, clear, subtotal, tax, total, itemCount };\n}',
            testCode: 'describe("useShoppingCart", () => {\n  it("adds items and computes totals", () => {\n    const { result } = renderHook(() => useShoppingCart());\n    act(() => result.current.addItem({ id: "1", name: "Book", price: 10 }));\n    expect(result.current.items).toHaveLength(1);\n    expect(result.current.subtotal).toBe(10);\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            categorySlug: 'frontend',
            tags: ['react', 'hooks', 'state-management', 'memoization'],
            conceptQuestions: ['Why use useCallback and useMemo here? What happens without them?', 'How would you persist the cart to localStorage?', 'What are the trade-offs of storing derived state vs computing it?'],
            systemDesign: 'Design a real-time collaborative shopping cart for an e-commerce platform serving 10K concurrent users.',
            hints: ['Derive computed values (subtotal, tax) instead of storing them.', 'Use functional updates in setState to avoid stale closures.'],
        },
        {
            title: 'REST API Rate Limiter',
            description: 'Design and implement a token-bucket rate limiter for a REST API. Each user gets a configurable number of requests per time window. Requests exceeding the limit should receive a 429 status. Focus on the algorithm and data structures — production-level correctness.',
            starterCode: 'interface RateLimiterConfig {\n  windowMs: number;\n  maxRequests: number;\n}\n\nclass TokenBucketRateLimiter {\n  constructor(private config: RateLimiterConfig) {}\n  \n  // Returns true if request is allowed, false if rate limited\n  isAllowed(userId: string): boolean {\n    // Your code here\n  }\n}\n',
            solutionCode: 'class TokenBucketRateLimiter {\n  private buckets = new Map<string, { tokens: number; lastRefill: number }>();\n  constructor(private config: RateLimiterConfig) {}\n  isAllowed(userId: string): boolean {\n    const now = Date.now();\n    let bucket = this.buckets.get(userId);\n    if (!bucket) {\n      bucket = { tokens: this.config.maxRequests, lastRefill: now };\n      this.buckets.set(userId, bucket);\n    }\n    const elapsed = now - bucket.lastRefill;\n    const refill = Math.floor(elapsed / this.config.windowMs) * this.config.maxRequests;\n    bucket.tokens = Math.min(this.config.maxRequests, bucket.tokens + refill);\n    bucket.lastRefill = bucket.lastRefill + Math.floor(elapsed / this.config.windowMs) * this.config.windowMs;\n    if (bucket.tokens > 0) {\n      bucket.tokens--;\n      return true;\n    }\n    return false;\n  }\n}',
            testCode: 'describe("TokenBucketRateLimiter", () => {\n  it("allows requests within limit", () => {\n    const limiter = new TokenBucketRateLimiter({ windowMs: 1000, maxRequests: 3 });\n    expect(limiter.isAllowed("user-1")).toBe(true);\n    expect(limiter.isAllowed("user-1")).toBe(true);\n    expect(limiter.isAllowed("user-1")).toBe(true);\n    expect(limiter.isAllowed("user-1")).toBe(false);\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.HARD,
            categorySlug: 'backend',
            tags: ['algorithms', 'api-design', 'rate-limiting', 'system-design'],
            conceptQuestions: ['What are the trade-offs of token bucket vs sliding window?', 'How would you make this work across multiple server instances?', 'How do you handle memory cleanup for idle users?'],
            systemDesign: 'Design a distributed rate limiter using Redis that works across 50+ API servers.',
            hints: ['Track tokens and last refill timestamp per user.', 'Refill tokens lazily on each request rather than using a background timer.'],
        },
        {
            title: 'Custom Promise.all Implementation',
            description: 'Implement a function `myPromiseAll` that works like `Promise.all`. It takes an iterable of promises and returns a single promise that resolves to an array of results in the same order. If any promise rejects, the returned promise should immediately reject with that error.',
            starterCode: 'function myPromiseAll<T>(promises: (T | Promise<T>)[]): Promise<T[]> {\n  // Your code here\n}\n',
            solutionCode: 'function myPromiseAll<T>(promises: (T | Promise<T>)[]): Promise<T[]> {\n  return new Promise((resolve, reject) => {\n    if (promises.length === 0) return resolve([]);\n    const results: T[] = new Array(promises.length);\n    let completed = 0;\n    promises.forEach((item, index) => {\n      Promise.resolve(item).then(\n        (value) => {\n          results[index] = value;\n          completed++;\n          if (completed === promises.length) resolve(results);\n        },\n        reject\n      );\n    });\n  });\n}',
            testCode: 'describe("myPromiseAll", () => {\n  it("resolves with all values in order", async () => {\n    const result = await myPromiseAll([Promise.resolve(1), Promise.resolve(2), 3]);\n    expect(result).toEqual([1, 2, 3]);\n  });\n  it("rejects if any promise rejects", async () => {\n    await expect(myPromiseAll([Promise.resolve(1), Promise.reject("error")])).rejects.toBe("error");\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            categorySlug: 'javascript',
            tags: ['promises', 'async', 'concurrency'],
            conceptQuestions: ['Why use Promise.resolve() to wrap each item?', 'How does Promise.all handle non-promise values?', 'Implement Promise.allSettled next.'],
            systemDesign: 'Design a job queue that processes tasks with configurable concurrency limits.',
            hints: ['You need to preserve the order of results matching the input order.', 'Track completion count to know when all promises have settled.'],
        },
        {
            title: 'SQL: Employee Department Analytics',
            description: 'Given tables `employees(id, name, department_id, salary, hire_date)` and `departments(id, name, location)`, write SQL queries to: (1) Find the top-earning employee per department, (2) Calculate department salary variance, (3) Find departments with above-average employee tenure.',
            starterCode: '-- Table schema:\n-- CREATE TABLE departments (id SERIAL PRIMARY KEY, name TEXT, location TEXT);\n-- CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, department_id INT REFERENCES departments(id), salary DECIMAL, hire_date DATE);\n\n-- Query 1: Top earner per department\n\n\n-- Query 2: Salary variance per department\n\n\n-- Query 3: Departments with above-average tenure\n',
            solutionCode: '-- Query 1: Top earner per department\nSELECT d.name, e.name, e.salary\nFROM employees e\nJOIN departments d ON e.department_id = d.id\nWHERE e.salary = (SELECT MAX(salary) FROM employees WHERE department_id = e.department_id);\n\n-- Alternative using window function:\nSELECT d.name, e.name, e.salary FROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as rn\n  FROM employees\n) e JOIN departments d ON e.department_id = d.id WHERE e.rn = 1;\n\n-- Query 2: Salary variance per department\nSELECT d.name, AVG(e.salary) as avg_salary, STDDEV(e.salary) as salary_stddev, MAX(e.salary) - MIN(e.salary) as salary_range\nFROM employees e\nJOIN departments d ON e.department_id = d.id\nGROUP BY d.id, d.name;\n\n-- Query 3: Departments with above-average tenure\nSELECT d.name, AVG(CURRENT_DATE - e.hire_date) as avg_tenure_days\nFROM employees e\nJOIN departments d ON e.department_id = d.id\nGROUP BY d.id, d.name\nHAVING AVG(CURRENT_DATE - e.hire_date) > (SELECT AVG(CURRENT_DATE - hire_date) FROM employees);',
            testCode: '',
            language: 'sql',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            categorySlug: 'database',
            tags: ['sql', 'analytics', 'window-functions', 'aggregation'],
            conceptQuestions: ['What are the performance implications of correlated subqueries vs window functions?', 'How would you index these queries for performance?', 'How does STDDEV behave with small sample sizes?'],
            systemDesign: 'Design a real-time analytics pipeline that processes employee data changes and maintains pre-computed aggregates.',
            hints: ['Window functions like ROW_NUMBER() are often more efficient than correlated subqueries.', 'Consider partial indexes for the top-earner query.'],
        },
        {
            title: 'LRU Cache',
            description: 'Design and implement an LRU (Least Recently Used) cache with `get(key)` and `put(key, value)` operations in O(1) average time. If the cache exceeds capacity, evict the least recently used item. This is a classic system design + coding hybrid question.',
            starterCode: 'class LRUCache<K, V> {\n  constructor(private capacity: number) {}\n\n  get(key: K): V | undefined {\n    // Your code here\n  }\n\n  put(key: K, value: V): void {\n    // Your code here\n  }\n}\n',
            solutionCode: 'class LRUCache<K, V> {\n  private map = new Map<K, V>();\n  constructor(private capacity: number) {}\n  get(key: K): V | undefined {\n    if (!this.map.has(key)) return undefined;\n    const value = this.map.get(key)!;\n    this.map.delete(key);\n    this.map.set(key, value);\n    return value;\n  }\n  put(key: K, value: V): void {\n    if (this.map.has(key)) this.map.delete(key);\n    this.map.set(key, value);\n    if (this.map.size > this.capacity) {\n      const lru = this.map.keys().next().value;\n      if (lru !== undefined) this.map.delete(lru);\n    }\n  }\n}',
            testCode: 'describe("LRUCache", () => {\n  it("evicts least recently used", () => {\n    const cache = new LRUCache<string, number>(2);\n    cache.put("a", 1); cache.put("b", 2); cache.get("a"); cache.put("c", 3);\n    expect(cache.get("b")).toBeUndefined();\n    expect(cache.get("a")).toBe(1);\n    expect(cache.get("c")).toBe(3);\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.HARD,
            categorySlug: 'algorithms',
            tags: ['cache', 'data-structures', 'linked-list', 'hash-map'],
            conceptQuestions: ['Why does Map preserve insertion order in JavaScript?', 'What if you need to implement this in a language without ordered hash maps?', 'How would you make this thread-safe?'],
            systemDesign: 'Design a CDN caching layer using LRU eviction across a global edge network.',
            hints: ['JavaScript Map iterates in insertion order — can you exploit this?', 'Think about which item is the least recently used after each operation.'],
        },
        {
            title: 'Throttle Function',
            description: 'Implement a `throttle` function that ensures a callback is called at most once every `interval` milliseconds. Unlike debounce, throttle guarantees execution at a regular rate. The leading edge should execute immediately; trailing edge should capture the last call.',
            starterCode: 'function throttle<T extends (...args: unknown[]) => unknown>(\n  fn: T,\n  interval: number\n): (...args: Parameters<T>) => void {\n  // Your code here\n}\n',
            solutionCode: 'function throttle<T extends (...args: unknown[]) => unknown>(fn: T, interval: number): (...args: Parameters<T>) => void {\n  let lastCall = 0;\n  let timer: ReturnType<typeof setTimeout> | null = null;\n  return (...args: Parameters<T>) => {\n    const now = Date.now();\n    const remaining = interval - (now - lastCall);\n    if (remaining <= 0) {\n      if (timer) { clearTimeout(timer); timer = null; }\n      lastCall = now;\n      fn(...args);\n    } else if (!timer) {\n      timer = setTimeout(() => {\n        lastCall = Date.now();\n        timer = null;\n        fn(...args);\n      }, remaining);\n    }\n  };\n}',
            testCode: 'describe("throttle", () => {\n  it("limits call rate", async () => {\n    let count = 0;\n    const fn = () => { count++; };\n    const throttled = throttle(fn, 100);\n    throttled(); throttled(); throttled();\n    expect(count).toBe(1);\n    await new Promise(r => setTimeout(r, 150));\n    expect(count).toBe(2);\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            categorySlug: 'javascript',
            tags: ['closures', 'timers', 'performance', 'utility'],
            conceptQuestions: ['How does throttle differ from debounce in real-world scenarios?', 'What are the use cases for leading-edge vs trailing-edge execution?', 'How would you implement a version that guarantees both leading and trailing calls?'],
            systemDesign: 'Design a scroll-based analytics system that uses throttling to cap event reporting to once per 100ms.',
            hints: ['Track the last call timestamp to determine if enough time has elapsed.', 'Use a timer to capture the trailing edge call.'],
        },
        {
            title: 'Container With Most Water',
            description: 'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the i-th line are `(i, 0)` and `(i, height[i])`. Find two lines that together with the x-axis form a container that holds the most water.',
            starterCode: 'function maxArea(height: number[]): number {\n  // Your code here\n}\n',
            solutionCode: 'function maxArea(height: number[]): number {\n  let left = 0, right = height.length - 1;\n  let max = 0;\n  while (left < right) {\n    const area = Math.min(height[left], height[right]) * (right - left);\n    max = Math.max(max, area);\n    if (height[left] < height[right]) left++;\n    else right--;\n  }\n  return max;\n}',
            testCode: 'describe("maxArea", () => {\n  it("finds maximum area", () => {\n    expect(maxArea([1,8,6,2,5,4,8,3,7])).toBe(49);\n    expect(maxArea([1,1])).toBe(1);\n  });\n});',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            categorySlug: 'algorithms',
            tags: ['arrays', 'two-pointers', 'greedy'],
            conceptQuestions: ['Why does the two-pointer approach work here?', 'What is the time complexity and why can\'t we do better?', 'How would you modify this to return the indices of the two lines?'],
            systemDesign: 'Design a system that computes water capacity for a 2D terrain elevation map.',
            hints: ['The area is limited by the shorter line.', 'Moving the pointer at the shorter line might find a taller boundary.'],
        },
    ];
    const authorUser = await prisma.user.findFirst({ where: { role: client_1.Role.INTERVIEWER } });
    const authorId = authorUser?.id;
    for (const q of curatedQuestions) {
        const catId = categoryRecords[q.categorySlug];
        await prisma.question.upsert({
            where: { id: `curated-${q.title.toLowerCase().replace(/\s+/g, '-')}` },
            update: {},
            create: {
                id: `curated-${q.title.toLowerCase().replace(/\s+/g, '-')}`,
                title: q.title,
                description: q.description,
                starterCode: q.starterCode,
                solutionCode: q.solutionCode,
                testCode: q.testCode || undefined,
                language: q.language,
                difficulty: q.difficulty,
                status: client_1.QuestionStatus.PUBLISHED,
                source: client_1.QuestionSource.CURATED,
                authorId: authorId || undefined,
                categoryId: catId,
                tags: q.tags,
                conceptQuestions: JSON.stringify(q.conceptQuestions),
                systemDesign: q.systemDesign,
                hints: JSON.stringify(q.hints),
                upvotes: Math.floor(Math.random() * 50) + 10,
                viewCount: Math.floor(Math.random() * 500) + 100,
                usageCount: Math.floor(Math.random() * 30) + 5,
            },
        });
    }
    const templateFrontendQuestion = await prisma.question.findFirst({
        where: { categoryId: categoryRecords['frontend'] },
        orderBy: { usageCount: 'desc' },
    });
    const templateBackendQuestion = await prisma.question.findFirst({
        where: { categoryId: categoryRecords['backend'] },
        orderBy: { usageCount: 'desc' },
    });
    const templateDsaQuestion = await prisma.question.findFirst({
        where: { categoryId: categoryRecords['algorithms'] },
        orderBy: { usageCount: 'desc' },
    });
    const templates = [
        {
            id: 'template-frontend-default',
            title: 'Frontend Engineering Interview',
            description: 'React component architecture, state management, styling approach, and frontend system design. Covers hooks, performance optimization, and browser APIs.',
            category: 'FRONTEND',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            questionId: templateFrontendQuestion?.id,
            isDefault: true,
        },
        {
            id: 'template-backend-default',
            title: 'Backend Systems Interview',
            description: 'API design, database schema, system architecture, caching strategies, and backend engineering patterns. Focuses on Node.js, REST, and microservices.',
            category: 'BACKEND',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            questionId: templateBackendQuestion?.id,
            isDefault: true,
        },
        {
            id: 'template-dsa-default',
            title: 'Problem Solving (DSA) Interview',
            description: 'Algorithms, data structures, time/space complexity analysis, and optimization techniques. Common patterns include arrays, trees, dynamic programming, and graph traversal.',
            category: 'DSA',
            language: 'typescript',
            difficulty: client_1.QuestionDifficulty.MEDIUM,
            questionId: templateDsaQuestion?.id,
            isDefault: true,
        },
    ];
    for (const t of templates) {
        await prisma.interviewTemplate.upsert({
            where: { id: t.id },
            update: {},
            create: t,
        });
    }
    console.log('Seed completed successfully');
    console.log(`  Interviewer: demo@interviewer.com / demo123456`);
    console.log(`  Candidate:  demo@candidate.com / demo123456`);
    console.log(`  Categories: ${categories.length} created`);
    console.log(`  Questions:  ${curatedQuestions.length} curated`);
    console.log(`  Templates:  ${templates.length} default`);
}
main()
    .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map