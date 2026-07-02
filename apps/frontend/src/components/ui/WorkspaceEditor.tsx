'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Play, Sparkles, Loader2, Plus, X, FileCode, FolderOpen, ChevronRight, Terminal, IndentIncrease } from 'lucide-react';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { Tooltip } from './Tooltip';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { EditorSkeleton } from './Skeleton';
import type { TestResult } from '@interviewos/shared';
import { formatCode } from '../../lib/formatCode';
import { generateTestDiagnostics } from '../../lib/testUtils';
import { lintCode, type LintDiagnostic } from '../../lib/lintCode';
import { toast } from '../../store/useToastStore';

// Dynamic import to avoid SSR issues with Monaco
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="flex-1 min-h-[300px]"><EditorSkeleton /></div>,
  }
);

// ── Language helpers ──────────────────────────────────────────────────────────

const LANG_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  javascript: { label: 'JavaScript', color: '#f7df1e', icon: 'JS' },
  typescript: { label: 'TypeScript', color: '#3178c6', icon: 'TS' },
  python: { label: 'Python', color: '#4b8bbe', icon: 'PY' },
  java: { label: 'Java', color: '#f89820', icon: 'JV' },
  cpp: { label: 'C++', color: '#00599c', icon: 'C++' },
  csharp: { label: 'C#', color: '#68217a', icon: 'C#' },
  go: { label: 'Go', color: '#00add8', icon: 'GO' },
  rust: { label: 'Rust', color: '#dea584', icon: 'RS' },
  kotlin: { label: 'Kotlin', color: '#7f52ff', icon: 'KT' },
  ruby: { label: 'Ruby', color: '#cc342d', icon: 'RB' },
  php: { label: 'PHP', color: '#777bb4', icon: 'PHP' },
  swift: { label: 'Swift', color: '#f05138', icon: 'SW' },
};

const LANG_EXT_MAP: Record<string, string> = {
  javascript: 'js', typescript: 'ts', python: 'py',
  go: 'go', rust: 'rs', cpp: 'cpp', c: 'c',
  java: 'java', csharp: 'cs', kotlin: 'kt',
  ruby: 'rb', php: 'php', swift: 'swift',
  json: 'json', css: 'css', html: 'html', markdown: 'md',
};

const EXT_LANG_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', go: 'go', rs: 'rust', cpp: 'cpp', cc: 'cpp', c: 'c',
  java: 'java', cs: 'csharp', kt: 'kotlin', rb: 'ruby', php: 'php', swift: 'swift',
  json: 'json', css: 'css', html: 'html', md: 'markdown',
};

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_LANG_MAP[ext] || 'javascript';
}

function defaultFilename(language: string): string {
  const ext = LANG_EXT_MAP[language] ?? 'js';
  return `solution.${ext}`;
}

const CODE_TEMPLATES: Record<string, string> = {
  javascript: `// JavaScript — InterviewOS Workspace\nfunction solution(input) {\n  // Write your implementation here\n  return null;\n}\n\nconsole.log(solution(null));\n`,
  typescript: `// TypeScript — InterviewOS Workspace\nfunction solution(input: unknown): unknown {\n  // Write your implementation here\n  return null;\n}\n\nconsole.log(solution(null));\n`,
  python: `# Python — InterviewOS Workspace\ndef solution(inp):\n    # Write your implementation here\n    pass\n\nprint(solution(None))\n`,
  java: `// Java — InterviewOS Workspace\npublic class Solution {\n    public static Object solution(Object input) {\n        // Write your implementation here\n        return null;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(solution(null));\n    }\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your implementation here\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  csharp: `// C# — InterviewOS Workspace\nusing System;\n\nclass Solution {\n    static object Solve(object input) {\n        // Write your implementation here\n        return null;\n    }\n\n    static void Main() {\n        Console.WriteLine(Solve(null));\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc solution() {\n\t// Write your implementation here\n}\n\nfunc main() {\n\tsolution()\n\tfmt.Println("Done")\n}\n`,
  rust: `fn main() {\n    // Write your implementation here\n    println!("Hello, World!");\n}\n`,
  kotlin: `// Kotlin — InterviewOS Workspace\nfun solution(input: Any?): Any? {\n    // Write your implementation here\n    return null\n}\n\nfun main() {\n    println(solution(null))\n}\n`,
  ruby: `# Ruby — InterviewOS Workspace\ndef solution(input)\n  # Write your implementation here\n  nil\nend\n\nputs solution(nil)\n`,
  php: `<?php\n// PHP — InterviewOS Workspace\nfunction solution($input) {\n    // Write your implementation here\n    return null;\n}\n\necho solution(null) . "\\n";\n?>\n`,
  swift: `// Swift — InterviewOS Workspace\nfunc solution(_ input: Any?) -> Any? {\n    // Write your implementation here\n    return nil\n}\n\nprint(solution(nil))\n`,
};

function getTemplate(language: string): string {
  return CODE_TEMPLATES[language] ?? CODE_TEMPLATES.javascript;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface RemoteCursor {
  userName: string;
  lineNumber: number;
  column: number;
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface WorkspaceEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  readOnly?: boolean;
  onRun?: () => void;
  isRunning?: boolean;
  showAiGenerator?: boolean;
  onOpenAiGenerator?: () => void;
  remoteCursors?: Record<string, RemoteCursor>;
  onCursorChange?: (
    lineNumber: number,
    column: number,
    selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number },
  ) => void;
  testResults?: TestResult[] | null;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
];

// ── Main Component ────────────────────────────────────────────────────────────

const PEER_CURSOR_COLORS = [
  '#ff6b6b', '#51cf66', '#339af0', '#f06595',
  '#cc5de8', '#ff922b', '#20c997', '#fcc419',
];

const REMOTE_CURSOR_STYLE_ID = 'remote-cursor-styles';
const TEST_DECORATION_STYLE_ID = 'test-decoration-styles';

function getPeerColorIndex(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PEER_CURSOR_COLORS.length;
}

function injectRemoteCursorStyles() {
  if (typeof document === 'undefined' || document.getElementById(REMOTE_CURSOR_STYLE_ID)) return;
  const css = PEER_CURSOR_COLORS.map((color, i) => `
    .remote-cursor-line-${i} { border-left: 2px solid ${color} !important; margin-left: -1px; }
    .remote-selection-${i} { background-color: ${color}33 !important; }
  `).join('\n');
  const style = document.createElement('style');
  style.id = REMOTE_CURSOR_STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

function injectTestDecorationStyles() {
  if (typeof document === 'undefined' || document.getElementById(TEST_DECORATION_STYLE_ID)) return;
  const css = `
    .test-glyph-pass { background: #34d399; border-radius: 50%; width: 8px !important; height: 8px !important; margin: 6px 0 0 6px; }
    .test-glyph-fail { background: #f87171; -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E") center/contain no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E") center/contain no-repeat; width: 16px !important; height: 16px !important; margin: 2px 0 0 2px; }
    .test-inline-fail { text-decoration: wavy underline #f87171; text-underline-position: under; text-decoration-skip-ink: none; }
  `;
  const style = document.createElement('style');
  style.id = TEST_DECORATION_STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

export const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  readOnly = false,
  onRun,
  isRunning = false,
  showAiGenerator = false,
  onOpenAiGenerator,
  remoteCursors,
  onCursorChange,
  testResults,
}) => {
  const [files, setFiles] = useState<WorkspaceFile[]>([
    { id: 'main', name: defaultFilename(language), content: value, language },
  ]);
  const [activeFileId, setActiveFileId] = useState('main');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langSelectorOpen, setLangSelectorOpen] = useState(false);
  const langSelectorRef = useRef<HTMLDivElement>(null);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [pendingDeleteFile, setPendingDeleteFile] = useState<WorkspaceFile | null>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const skipExternalSync = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const testDecorationsRef = useRef<string[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);

  // Linting state
  const [lintingEnabled, setLintingEnabled] = useState(true);
  const [diagnosticsPanelOpen, setDiagnosticsPanelOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<LintDiagnostic[]>([]);
  const lintDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!langSelectorOpen) return;
    const handler = (e: MouseEvent) => {
      if (langSelectorRef.current && !langSelectorRef.current.contains(e.target as Node)) {
        setLangSelectorOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangSelectorOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [langSelectorOpen]);

  // Sync external value (socket broadcast) into the active file's content
  useEffect(() => {
    if (skipExternalSync.current) { skipExternalSync.current = false; return; }
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: value } : f))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Sync external language change into the active file
  useEffect(() => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, language } : f))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const activeFile = files.find((f) => f.id === activeFileId) ?? files[0];

  /** Switch active file, propagating its content/language to the parent */
  const switchToFile = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;
      skipExternalSync.current = true;
      setActiveFileId(fileId);
      onChange(file.content);
      onLanguageChange(file.language);
    },
    [files, onChange, onLanguageChange]
  );

  const handleEditorChange = useCallback(
    (val: string | undefined) => {
      const content = val ?? '';
      skipExternalSync.current = true;
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, content } : f))
      );
      onChange(content);
    },
    [activeFileId, onChange]
  );

  const handleLanguageSelect = (lang: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, language: lang } : f))
    );
    onLanguageChange(lang);
  };

  const startAddFile = () => {
    setIsAddingFile(true);
    setSidebarOpen(true);
    setTimeout(() => newFileInputRef.current?.focus(), 60);
  };

  const commitNewFile = () => {
    const name = newFileName.trim();
    if (!name) { setIsAddingFile(false); setNewFileName(''); return; }
    const lang = detectLanguage(name);
    const newFile: WorkspaceFile = {
      id: `file-${Date.now()}`,
      name,
      content: getTemplate(lang),
      language: lang,
    };
    setFiles((prev) => [...prev, newFile]);
    setIsAddingFile(false);
    setNewFileName('');
    // switch to the new file
    setTimeout(() => {
      skipExternalSync.current = true;
      setActiveFileId(newFile.id);
      onChange(newFile.content);
      onLanguageChange(newFile.language);
    }, 0);
  };

  const confirmDeleteFile = () => {
    if (!pendingDeleteFile) return;
    if (files.length <= 1) { setPendingDeleteFile(null); return; }
    const remaining = files.filter((f) => f.id !== pendingDeleteFile.id);
    setFiles(remaining);
    if (activeFileId === pendingDeleteFile.id) {
      const fallback = remaining[0];
      skipExternalSync.current = true;
      setActiveFileId(fallback.id);
      onChange(fallback.content);
      onLanguageChange(fallback.language);
    }
    setPendingDeleteFile(null);
  };

  const requestDeleteFile = (file: WorkspaceFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    setPendingDeleteFile(file);
  };

  const handleFormat = useCallback(async () => {
    const file = files.find((f) => f.id === activeFileId);
    if (!file || readOnly || isFormatting) return;
    setIsFormatting(true);
    try {
      const result = await formatCode(file.content, file.language);
      if (result.success && result.code !== file.content) {
        skipExternalSync.current = true;
        setFiles((prev) =>
          prev.map((f) => (f.id === activeFileId ? { ...f, content: result.code } : f))
        );
        onChange(result.code);
        // Also update Monaco model directly
        const editor = editorRef.current;
        if (editor && !editor.isDisposed()) {
          const model = editor.getModel();
          if (model) {
            model.pushEditOperations(
              [],
              [{ range: model.getFullModelRange(), text: result.code }],
              () => null,
            );
          }
        }
      }
      if (!result.success) {
        toast.info('Format applied with fallback', result.error || 'Prettier encountered an issue, basic cleanup applied.');
      }
    } catch {
      toast.info('Format failed', 'Could not format code. Please check for syntax errors.');
    } finally {
      setIsFormatting(false);
    }
  }, [files, activeFileId, readOnly, isFormatting, onChange]);

  /** Register the custom InterviewOS dark theme once Monaco mounts */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    injectRemoteCursorStyles();
    injectTestDecorationStyles();

    editor.onDidChangeCursorSelection((e: any) => {
      if (!onCursorChange) return;
      const sel = e.selection;
      const pos = sel.getPosition();
      const hasSelection = sel.startLineNumber !== sel.endLineNumber || sel.startColumn !== sel.endColumn;
      onCursorChange(
        pos.lineNumber,
        pos.column,
        hasSelection
          ? { startLineNumber: sel.startLineNumber, startColumn: sel.startColumn, endLineNumber: sel.endLineNumber, endColumn: sel.endColumn }
          : undefined,
      );
    });

    monaco.editor.defineTheme('interviewos-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4b5563', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'c084fc' },
        { token: 'type', foreground: '2dd4bf' },
        { token: 'function', foreground: 'fbbf24' },
        { token: 'variable', foreground: 'd1d5db' },
        { token: 'delimiter', foreground: '6b7280' },
      ],
      colors: {
        'editor.background': '#050505',
        'editor.foreground': '#d1d5db',
        'editorLineNumber.foreground': '#2d3748',
        'editorLineNumber.activeForeground': '#6b7280',
        'editor.selectionBackground': '#312e8150',
        'editor.lineHighlightBackground': '#ffffff07',
        'editorCursor.foreground': '#818cf8',
        'editorIndentGuide.background1': '#1f2937',
        'editorIndentGuide.activeBackground1': '#374151',
        'editor.findMatchBackground': '#1d4ed860',
        'editor.findMatchHighlightBackground': '#1d4ed830',
        'scrollbarSlider.background': '#ffffff0e',
        'scrollbarSlider.hoverBackground': '#ffffff18',
        'editorBracketMatch.background': '#6366f130',
        'editorBracketMatch.border': '#6366f160',
        'editorSuggestWidget.background': '#111827',
        'editorSuggestWidget.border': '#1f2937',
        'editorSuggestWidget.selectedBackground': '#1e3a5f',
      },
    });
    monaco.editor.setTheme('interviewos-dark');

    // Register format action bound to Shift+Alt+F
    editor.addAction({
      id: 'interviewos-format',
      label: 'Format Code with Prettier',
      keybindings: [
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      ],
      run: () => {
        // Trigger our React handler via a custom event
        document.dispatchEvent(new CustomEvent('interviewos:format-code'));
      },
    });

    // ── Enable Monaco built-in JS/TS diagnostics ─────────────────────────
    const jsTsDefaults = monaco.languages.typescript;
    if (jsTsDefaults) {
      // JavaScript defaults
      jsTsDefaults.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
        diagnosticCodesToIgnore: [
          2792, // Cannot find module (expected in interview setting)
          2307, // Cannot find module
          7016, // Could not find declaration file for module
          8006, // 'interface' can only be used in a .ts file
          8008, // 'type' can only be used in a .ts file
          8009, // The '?' modifier can only be used in TypeScript
          8010, // 'type' can only be used in a .ts file
          1434, // Unexpected keyword or identifier
        ],
      });
      jsTsDefaults.javascriptDefaults.setCompilerOptions({
        target: jsTsDefaults.ScriptTarget.ESNext,
        module: jsTsDefaults.ModuleKind.ESNext,
        allowJs: true,
        allowNonTsExtensions: true,
        checkJs: false,
        noEmit: true,
        strict: false,
        noImplicitAny: false,
        noImplicitReturns: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
      });

      // TypeScript defaults
      jsTsDefaults.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
        diagnosticCodesToIgnore: [
          2792, // Cannot find module
          2307, // Cannot find module
          7016, // Could not find declaration file
          6133, // declared but never read (too noisy for interview setting)
          6196, // declared but never read (imports)
          2451, // Cannot redeclare block-scoped variable
          2686, // refers to a UMD global
        ],
      });
      jsTsDefaults.typescriptDefaults.setCompilerOptions({
        target: jsTsDefaults.ScriptTarget.ESNext,
        module: jsTsDefaults.ModuleKind.ESNext,
        moduleResolution: jsTsDefaults.ModuleResolutionKind.NodeJs,
        allowJs: true,
        allowNonTsExtensions: true,
        noEmit: true,
        strict: false,
        noImplicitAny: false,
        noImplicitReturns: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        esModuleInterop: true,
        jsx: jsTsDefaults.JsxEmit.React,
      });
    }
  };

  // Listen for custom format event from Monaco action
  useEffect(() => {
    const handler = () => handleFormat();
    document.addEventListener('interviewos:format-code', handler);
    return () => document.removeEventListener('interviewos:format-code', handler);
  }, [handleFormat]);

  // ── Real-time linting ───────────────────────────────────────────────────
  const runLinting = useCallback(
    (code: string, lang: string) => {
      if (!lintingEnabled) {
        setDiagnostics([]);
        // Clear Monaco markers for non-JS/TS languages
        if (lang !== 'javascript' && lang !== 'typescript') {
          const monaco = monacoRef.current;
          const editor = editorRef.current;
          if (monaco && editor) {
            const model = editor.getModel();
            if (model) monaco.editor.setModelMarkers(model, 'interviewos-lint', []);
          }
        }
        return;
      }

      // For JS/TS: Monaco handles diagnostics automatically
      if (lang === 'javascript' || lang === 'typescript') {
        setDiagnostics([]);
        return;
      }

      // For Python/Go/Rust/C++: run custom linter
      const results = lintCode(code, lang);
      setDiagnostics(results);

      // Set Monaco markers for visual squiggly lines
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      if (monaco && editor && !editor.isDisposed()) {
        const model = editor.getModel();
        if (model) {
          const markers = results.map((d) => ({
            severity:
              d.severity === 'error'
                ? monaco.MarkerSeverity.Error
                : d.severity === 'warning'
                  ? monaco.MarkerSeverity.Warning
                  : monaco.MarkerSeverity.Info,
            message: d.message,
            startLineNumber: d.line,
            startColumn: d.column,
            endLineNumber: d.endLine ?? d.line,
            endColumn: d.endColumn ?? d.column + 10,
            source: d.source || 'lint',
          }));
          monaco.editor.setModelMarkers(model, 'interviewos-lint', markers);
        }
      }
    },
    [lintingEnabled],
  );

  // Debounced linting on code change
  useEffect(() => {
    if (lintDebounceRef.current) clearTimeout(lintDebounceRef.current);
    lintDebounceRef.current = setTimeout(() => {
      runLinting(activeFile?.content ?? value, activeFile?.language ?? language);
    }, 500);
    return () => {
      if (lintDebounceRef.current) clearTimeout(lintDebounceRef.current);
    };
  }, [activeFile?.content, activeFile?.language, value, language, runLinting]);

  // Jump to diagnostic location in editor
  const handleJumpToDiagnostic = useCallback((line: number, column: number) => {
    const editor = editorRef.current;
    if (editor) {
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column });
      editor.focus();
    }
  }, []);

  // Dismiss a diagnostic
  const handleDismissDiagnostic = useCallback(
    (index: number) => {
      setDiagnostics((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        // Update Monaco markers
        const monaco = monacoRef.current;
        const editor = editorRef.current;
        if (monaco && editor && !editor.isDisposed() && activeFile?.language !== 'javascript' && activeFile?.language !== 'typescript') {
          const model = editor.getModel();
          if (model) {
            const markers = next.map((d) => ({
              severity:
                d.severity === 'error'
                  ? monaco.MarkerSeverity.Error
                  : d.severity === 'warning'
                    ? monaco.MarkerSeverity.Warning
                    : monaco.MarkerSeverity.Info,
              message: d.message,
              startLineNumber: d.line,
              startColumn: d.column,
              endLineNumber: d.endLine ?? d.line,
              endColumn: d.endColumn ?? d.column + 10,
              source: d.source || 'lint',
            }));
            monaco.editor.setModelMarkers(model, 'interviewos-lint', markers);
          }
        }
        return next;
      });
    },
    [activeFile?.language],
  );

  // Clear linting state when language changes
  useEffect(() => {
    setDiagnostics([]);
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (monaco && editor && !editor.isDisposed()) {
      const model = editor.getModel();
      if (model) monaco.editor.setModelMarkers(model, 'interviewos-lint', []);
    }
  }, [language]);

  // ── Inline test decorations ───────────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || editor.isDisposed()) return;

    if (!testResults || testResults.length === 0) {
      testDecorationsRef.current = editor.deltaDecorations(testDecorationsRef.current, []);
      return;
    }

    const diagnostics = generateTestDiagnostics(testResults, value);
    const decorations: any[] = [];

    for (const d of diagnostics) {
      const range = new monaco.Range(d.line, 1, d.line, 1);
      if (d.type === 'pass') {
        decorations.push({
          range,
          options: {
            isWholeLine: true,
            glyphMarginClassName: 'test-glyph-pass',
            hoverMessage: { value: `**${d.testName}** \u2713 Passed` },
          },
        });
      } else {
        decorations.push({
          range,
          options: {
            isWholeLine: true,
            glyphMarginClassName: 'test-glyph-fail',
            inlineClassName: 'test-inline-fail',
            hoverMessage: { value: `**${d.testName}** \u2717 Failed\n\n${d.message}` },
            overviewRuler: { color: '#f87171', position: monaco.editor.OverviewRulerLane.Left },
          },
        });
      }
    }

    testDecorationsRef.current = editor.deltaDecorations(testDecorationsRef.current, decorations);
  }, [testResults, value]);

  // ── Remote cursor decorations ─────────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !remoteCursors || editor.isDisposed()) return;

    const decorations: any[] = [];

    for (const [userId, cursor] of Object.entries(remoteCursors)) {
      const colorIdx = getPeerColorIndex(userId);

      if (cursor.selection) {
        decorations.push({
          range: new monaco.Range(
            cursor.selection.startLineNumber,
            cursor.selection.startColumn,
            cursor.selection.endLineNumber,
            cursor.selection.endColumn,
          ),
          options: {
            inlineClassName: `remote-selection-${colorIdx}`,
          },
        });
      }

      decorations.push({
        range: new monaco.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
        options: {
          className: `remote-cursor-line-${colorIdx}`,
          hoverMessage: { value: `**${cursor.userName}**` },
        },
      });
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, [remoteCursors]);

  return (
    <div className="flex flex-col w-full h-full bg-surface-black border border-white/[0.06] rounded-lg overflow-hidden select-none">

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="h-11 bg-surface-tile-2 border-b border-white/[0.06] px-2 sm:px-3 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          {/* Brand icon */}
          <Terminal className="w-3.5 h-3.5 text-primary flex-shrink-0 hidden xs:block" />

          {/* Toggle sidebar */}
          <Tooltip content="Toggle File Explorer">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-body-muted/70 hover:text-white transition-colors p-1 rounded"
              aria-label="Toggle file explorer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <span className="text-[11px] sm:text-[12px] text-body-muted/50 font-mono truncate max-w-[80px] sm:max-w-none">{activeFile?.name}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Language selector — custom dropdown */}
          <div ref={langSelectorRef} className="relative">
            <Tooltip content="Select language">
              <button
                onClick={() => !readOnly && !isRunning && setLangSelectorOpen((p) => !p)}
                disabled={readOnly || isRunning}
                aria-label="Programming language"
                aria-expanded={langSelectorOpen}
                className="flex items-center gap-1 sm:gap-2 h-7 px-1.5 sm:px-2 bg-ink border border-white/[0.06] rounded-md text-[11px] sm:text-[12px] font-mono text-body-muted hover:border-white/[0.12] transition-colors disabled:opacity-40"
              >
                {(() => {
                  const cfg = LANG_CONFIG[activeFile?.language ?? language];
                  return (
                    <>
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold leading-none shrink-0"
                        style={{ backgroundColor: cfg?.color ?? '#888', color: '#000' }}
                      >
                        {cfg?.icon ?? '?'}
                      </span>
                      <span className="mr-1 hidden xs:inline">{cfg?.label ?? language}</span>
                      <ChevronRight className={`w-3 h-3 text-body-muted/50 transition-transform duration-150 ${langSelectorOpen ? 'rotate-90' : ''}`} />
                    </>
                  );
                })()}
              </button>
            </Tooltip>
            <AnimatePresence>
              {langSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-1 z-50 w-[160px] sm:w-[180px] bg-surface-tile-3 border border-white/[0.08] rounded-lg shadow-xl overflow-hidden"
                >
                  {SUPPORTED_LANGUAGES.map((l, i) => {
                    const cfg = LANG_CONFIG[l.value];
                    const isActive = (activeFile?.language ?? language) === l.value;
                    return (
                      <button
                        key={l.value}
                        onClick={() => { handleLanguageSelect(l.value); setLangSelectorOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] sm:text-[13px] font-mono transition-colors ${
                          isActive ? 'bg-primary/10 text-white' : 'text-body-muted hover:bg-white/[0.04] hover:text-white'
                        } ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                      >
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold leading-none shrink-0"
                          style={{ backgroundColor: cfg?.color ?? '#888', color: '#000' }}
                        >
                          {cfg?.icon ?? '?'}
                        </span>
                        <span className="flex-1">{cfg?.label ?? l.value}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {showAiGenerator && onOpenAiGenerator && (
            <Tooltip content="AI Challenge Generator">
              <Button
                variant="ghost"
                className="flex items-center gap-1 sm:gap-1.5 h-7 px-1.5 sm:px-2.5 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-primary py-0 font-normal rounded-md"
                onClick={onOpenAiGenerator}
              >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[11px] sm:text-[12px] text-white hidden xs:inline">AI</span>
              </Button>
            </Tooltip>
          )}

          {!readOnly && (
            <Tooltip content="Format Code" shortcut="⇧⌥F">
              <button
                onClick={handleFormat}
                disabled={isFormatting}
                className="flex items-center gap-1 sm:gap-1.5 h-7 px-1.5 sm:px-2 bg-white/[0.04] border border-white/[0.06] rounded-md text-body-muted hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-40"
                aria-label="Format code"
              >
                {isFormatting
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <IndentIncrease className="w-3 h-3" />}
                <span className="text-[11px] sm:text-[12px] hidden xs:inline">Format</span>
              </button>
            </Tooltip>
          )}

          <Tooltip content={lintingEnabled ? 'Disable Linting' : 'Enable Linting'}>
            <button
              onClick={() => setLintingEnabled((v) => !v)}
              className={`flex items-center gap-1 sm:gap-1.5 h-7 px-1.5 sm:px-2 border rounded-md transition-colors ${
                lintingEnabled
                  ? 'bg-green-400/10 border-green-400/20 text-green-400 hover:bg-green-400/15'
                  : 'bg-white/[0.04] border-white/[0.06] text-body-muted/50 hover:text-body-muted hover:bg-white/[0.06]'
              }`}
              aria-label={lintingEnabled ? 'Disable linting' : 'Enable linting'}
            >
              {lintingEnabled
                ? <LintCheckIcon />
                : <LintAlertIcon />}
              <span className="text-[11px] sm:text-[12px] hidden xs:inline">Lint</span>
            </button>
          </Tooltip>

          {onRun && (
            <Tooltip content="Run Code" shortcut="⌘↵">
              <Button
                variant="ghost"
                disabled={isRunning}
                className="flex items-center gap-1 sm:gap-1.5 h-7 px-1.5 sm:px-2.5 bg-primary text-white hover:bg-primary-focus py-0 font-normal rounded-md disabled:opacity-50"
                onClick={onRun}
              >
              {isRunning
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Play className="w-3 h-3 fill-current" />}
              <span className="text-[11px] sm:text-[12px]">{isRunning ? '...' : 'Run'}</span>
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* ── Workspace Body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* File Explorer Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 180, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-[180px] bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col shrink-0 overflow-hidden"
            >
            <div className="h-8 px-3 flex items-center justify-between border-b border-white/[0.06]">
              <span className="text-[9px] font-semibold text-white/25 font-mono">Explorer</span>
              <button
                onClick={startAddFile}
                className="text-white/25 hover:text-white transition-colors"
                title="New File"
                aria-label="New file"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto py-1">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => switchToFile(file.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-mono group transition-all border-l-2 ${
                    activeFileId === file.id
                      ? 'bg-primary/[0.08] text-white border-primary'
                      : 'text-white/55 hover:bg-white/[0.03] hover:text-white/80 border-transparent'
                  }`}
                >
                  <ChevronRight className="w-2.5 h-2.5 shrink-0 opacity-0" />
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${activeFileId === file.id ? 'text-primary-on-dark' : 'text-white/50'}`} />
                  <span className="flex-1 text-left truncate">{file.name}</span>
                  {files.length > 1 && (
                    <span
                      role="button"
                      onClick={(e) => requestDeleteFile(file, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                      aria-label="Delete file"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}

              {/* Inline new-file input */}
              {isAddingFile && (
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <FileCode className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  <input
                    ref={newFileInputRef}
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitNewFile();
                      if (e.key === 'Escape') { setIsAddingFile(false); setNewFileName(''); }
                    }}
                    onBlur={commitNewFile}
                    placeholder="filename.js"
                    className="flex-1 bg-transparent border-b border-primary/60 text-[11px] text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 py-0.5 placeholder:text-white/20"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Editor pane: tabs + Monaco */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Tab bar */}
          <div className="flex items-center bg-[#0d0d0d] border-b border-white/[0.06] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 h-9">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-1.5 px-4 h-full text-[11px] font-mono border-r border-white/[0.06] cursor-pointer shrink-0 group transition-all relative ${
                  activeFileId === file.id
                    ? 'bg-[#050505] text-white'
                    : 'text-white/55 hover:text-white/70 hover:bg-white/[0.02]'
                }`}
                onClick={() => switchToFile(file.id)}
              >
                {/* Active tab top border */}
                {activeFileId === file.id && (
                  <span className="absolute top-0 left-0 right-0 h-[2px] bg-primary rounded-b-none" />
                )}
                <FileCode className={`w-3 h-3 shrink-0 ${activeFileId === file.id ? 'text-primary-on-dark' : 'text-white/20'}`} />
                <span>{file.name}</span>
                  {files.length > 1 && (
                    <span
                      role="button"
                      onClick={(e) => requestDeleteFile(file, e)}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 ml-0.5 transition-all"
                      aria-label="Delete file"
                    >
                      <X className="w-3 h-3" />
                    </span>
                )}
              </div>
            ))}

            {/* New tab button */}
            <button
              onClick={startAddFile}
              className="px-3 h-full text-white/25 hover:text-white transition-colors shrink-0"
              title="New file (Ctrl+N)"
              aria-label="New file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0 select-text">
            <MonacoEditor
              height="100%"
              language={activeFile?.language ?? language}
              value={activeFile?.content ?? value}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              theme="interviewos-dark"
              options={{
                readOnly,
                fontSize: 14,
                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
                fontLigatures: true,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'off',
                bracketPairColorization: { enabled: true },
                formatOnPaste: true,
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  showFunctions: true,
                  showVariables: true,
                  showClasses: true,
                  showModules: true,
                },
                quickSuggestions: { other: true, comments: false, strings: false },
                parameterHints: { enabled: true },
                scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: 'phase',
                cursorSmoothCaretAnimation: 'on',
                renderLineHighlight: 'line',
                guides: { indentation: true, bracketPairs: true },
                occurrencesHighlight: 'singleFile',
                selectionHighlight: true,
                foldingHighlight: true,
                showUnused: true,
                inlayHints: { enabled: 'on' },
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Diagnostics Panel ─────────────────────────────────────────────── */}
      {lintingEnabled && (
        <DiagnosticsPanel
          diagnostics={diagnostics}
          isOpen={diagnosticsPanelOpen}
          onToggle={() => setDiagnosticsPanelOpen((v) => !v)}
          onJumpTo={handleJumpToDiagnostic}
          onDismiss={handleDismissDiagnostic}
        />
      )}

      {/* ── Status Bar ────────────────────────────────────────────────────────── */}
      <div className="h-6 bg-[#0a0a0a] border-t border-white/[0.06] px-4 flex items-center justify-between text-[10px] text-white/25 font-mono shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-primary" />
            Monaco IntelliSense
          </span>
          {lintingEnabled && diagnostics.length > 0 && (
            <span
              className={`flex items-center gap-1 cursor-pointer hover:text-white/50 transition-colors ${
                diagnostics.some((d) => d.severity === 'error')
                  ? 'text-red-400/50'
                  : diagnostics.some((d) => d.severity === 'warning')
                    ? 'text-amber-400/50'
                    : 'text-blue-400/50'
              }`}
              onClick={() => setDiagnosticsPanelOpen(true)}
            >
              {diagnostics.length} lint issue{diagnostics.length !== 1 ? 's' : ''}
            </span>
          )}
          <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          {testResults && testResults.length > 0 && (() => {
            const passed = testResults.filter(r => r.passed).length;
            const total = testResults.length;
            return (
              <span className={`flex items-center gap-1 ${passed === total ? 'text-green-400/60' : 'text-red-400/60'}`}>
                {passed === total ? '\u2713' : '\u2717'}
                {passed}/{total}
              </span>
            );
          })()}
          <span className="flex items-center gap-1.5">
            {(() => {
              const cfg = LANG_CONFIG[activeFile?.language ?? ''];
              return cfg ? (
                <>
                  <span className="w-3 h-3 rounded flex items-center justify-center text-[6px] font-bold leading-none" style={{ backgroundColor: cfg.color, color: '#000' }}>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </>
              ) : <span className="capitalize">{activeFile?.language}</span>;
            })()}
          </span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteFile !== null}
        onClose={() => setPendingDeleteFile(null)}
        onConfirm={confirmDeleteFile}
        title="Delete file?"
        description={pendingDeleteFile ? `Are you sure you want to delete "${pendingDeleteFile.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

function LintCheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LintAlertIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
