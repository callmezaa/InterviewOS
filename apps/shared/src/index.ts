export const COMPILER_MAP: Record<string, string> = {
  javascript: 'nodejs-20.17.0',
  typescript: 'typescript-5.6.2',
  python: 'cpython-3.13.8',
  go: 'go-1.23.2',
  rust: 'rust-1.82.0',
  cpp: 'gcc-head',
  'c++': 'gcc-head',
  java: 'openjdk-head',
  csharp: 'dotnet-csharp',
  kotlin: 'kotlin-head',
  ruby: 'ruby-head',
  php: 'php-head',
  swift: 'swift-head',
};

export const SUPPORTED_LANGUAGES_LIST = [
  { value: 'javascript', label: 'JavaScript', color: '#f7df1e', icon: 'JS', ext: 'js' },
  { value: 'typescript', label: 'TypeScript', color: '#3178c6', icon: 'TS', ext: 'ts' },
  { value: 'python', label: 'Python', color: '#4b8bbe', icon: 'PY', ext: 'py' },
  { value: 'java', label: 'Java', color: '#f89820', icon: 'JV', ext: 'java' },
  { value: 'cpp', label: 'C++', color: '#00599c', icon: 'C++', ext: 'cpp' },
  { value: 'csharp', label: 'C#', color: '#68217a', icon: 'C#', ext: 'cs' },
  { value: 'go', label: 'Go', color: '#00add8', icon: 'GO', ext: 'go' },
  { value: 'rust', label: 'Rust', color: '#dea584', icon: 'RS', ext: 'rs' },
  { value: 'kotlin', label: 'Kotlin', color: '#7f52ff', icon: 'KT', ext: 'kt' },
  { value: 'ruby', label: 'Ruby', color: '#cc342d', icon: 'RB', ext: 'rb' },
  { value: 'php', label: 'PHP', color: '#777bb4', icon: 'PHP', ext: 'php' },
  { value: 'swift', label: 'Swift', color: '#f05138', icon: 'SW', ext: 'swift' },
];

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
  output?: string;
}

export interface TestRunResponse {
  results: TestResult[];
  summary: { passed: number; failed: number; total: number };
  raw?: { stdout?: string; stderr?: string; error?: string };
}

// ─── Question Library Types ───────────────────────────────────────────────────

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionSource = 'CURATED' | 'COMMUNITY';

export interface QuestionSummary {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: QuestionDifficulty;
  source: QuestionSource;
  status: QuestionStatus;
  tags: string[];
  category?: { id: string; name: string; slug: string } | null;
  author?: { id: string; name: string; avatarUrl?: string | null } | null;
  upvotes: number;
  downvotes: number;
  viewCount: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionDetail extends QuestionSummary {
  starterCode?: string | null;
  solutionCode?: string | null;
  testCode?: string | null;
  conceptQuestions?: string[] | null;
  systemDesign?: string | null;
  hints?: string[] | null;
  interviews?: { id: string; title: string }[];
}

export interface QuestionCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  order: number;
}

export interface PaginatedQuestions {
  data: QuestionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Interview Template Types ─────────────────────────────────────────────────

export type TemplateCategory = 'FRONTEND' | 'BACKEND' | 'DSA';

export type TemplateSource = 'CURATED' | 'COMMUNITY';

export interface InterviewTemplate {
  id: string;
  title: string;
  description: string | null;
  category: TemplateCategory;
  language: string;
  difficulty: QuestionDifficulty | null;
  starterCode: string | null;
  questionId: string | null;
  question?: { id: string; title: string } | null;
  source: TemplateSource;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  authorId: string | null;
  author?: { id: string; name: string; avatarUrl?: string | null } | null;
  tags: string[];
  upvotes: number;
  downvotes: number;
  viewCount: number;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTemplates {
  data: InterviewTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ─── Branding Types ──────────────────────────────────────────────────────────

export interface BrandSettings {
  id: string | null;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  primaryColor: string;
  isCustomized: boolean;
  theme?: ThemeConfig | null;
}

export interface ThemeConfig {
  presetId?: string;       // Which preset this was based on (null = custom)
  colors: {
    primary: string;       // Main accent — buttons, links, focus rings
    primaryHover: string;  // Hover/active state of primary
    success: string;       // Success states
    warning: string;       // Warning states
    danger: string;        // Destructive/error states
    bgDark: string;        // Dark mode surface (tiles)
    textDark: string;      // Dark mode muted text
    bgLight: string;       // Light mode surface
    textLight: string;     // Light mode muted text
  };
  fontDisplay?: string;    // Display font override (e.g. "Inter", "Plus Jakarta Sans")
  fontBody?: string;       // Body font override
  radiusScale?: number;    // 0.5 = tighter, 1 = default, 1.5 = rounder
}

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: '#0066cc',
    primaryHover: '#0071e3',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    bgDark: '#272729',
    textDark: '#cccccc',
    bgLight: '#f5f5f7',
    textLight: '#86868b',
  },
};

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'InterviewOS',
    description: 'Clean blue accent with neutral grays',
    theme: DEFAULT_THEME,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue with cool undertones',
    theme: {
      presetId: 'midnight',
      colors: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#1e293b',
        textDark: '#94a3b8',
        bgLight: '#f1f5f9',
        textLight: '#64748b',
      },
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Green accent for sustainability brands',
    theme: {
      presetId: 'emerald',
      colors: {
        primary: '#059669',
        primaryHover: '#047857',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#1a2e2a',
        textDark: '#a7c4b8',
        bgLight: '#ecfdf5',
        textLight: '#6b9080',
      },
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange accent with earthy tones',
    theme: {
      presetId: 'sunset',
      colors: {
        primary: '#ea580c',
        primaryHover: '#c2410c',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#2a2019',
        textDark: '#c8b49a',
        bgLight: '#fff7ed',
        textLight: '#a88b6a',
      },
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Purple accent for creative teams',
    theme: {
      presetId: 'violet',
      colors: {
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#231a35',
        textDark: '#b8a4d4',
        bgLight: '#f5f3ff',
        textLight: '#8b7aad',
      },
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Pink accent for modern aesthetics',
    theme: {
      presetId: 'rose',
      colors: {
        primary: '#e11d48',
        primaryHover: '#be123c',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#2a1520',
        textDark: '#d4a0b0',
        bgLight: '#fff1f2',
        textLight: '#b07080',
      },
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Monochrome for minimal designs',
    theme: {
      presetId: 'slate',
      colors: {
        primary: '#475569',
        primaryHover: '#334155',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#1e2025',
        textDark: '#a0a4ab',
        bgLight: '#f8f9fa',
        textLight: '#6b7280',
      },
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Teal accent for tech companies',
    theme: {
      presetId: 'ocean',
      colors: {
        primary: '#0891b2',
        primaryHover: '#0e7490',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#152028',
        textDark: '#8cb8c8',
        bgLight: '#ecfeff',
        textLight: '#6ba8b8',
      },
    },
  },
];

export const DEFAULT_BRAND: BrandSettings = {
  id: null,
  name: 'InterviewOS',
  slug: null,
  logoUrl: null,
  primaryColor: '#0066cc',
  isCustomized: false,
  theme: DEFAULT_THEME,
};
