'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Loader2, Play, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  readOnly?: boolean;
  onRun?: () => void;
  isRunning?: boolean;
  showAiGenerator?: boolean;
  onOpenAiGenerator?: () => void;
}

// ─── Shiki highlighter singleton (module-level cache) ─────────────────────────

let highlighterSingleton: Promise<any> | null = null;

async function getHighlighter(): Promise<any> {
  if (!highlighterSingleton) {
    const shiki = await import('shiki');
    highlighterSingleton = shiki.createHighlighter({
      themes: ['one-dark-pro'],
      langs: [
        'javascript', 'typescript', 'python', 'go', 'rust', 'cpp',
        'jsx', 'tsx',
      ],
    });
  }
  return highlighterSingleton;
}

const LANG_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  cpp: 'cpp',
};

async function highlightCode(code: string, lang: string): Promise<string> {
  if (!code) return '';
  const highlighter = await getHighlighter();
  const shikiLang = LANG_MAP[lang] || 'javascript';
  const html = highlighter.codeToHtml(code, { lang: shikiLang, theme: 'one-dark-pro' });
  const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/i);
  return match ? match[1] : html;
}

// ─── Hook to bridge async shiki into synchronous render ────────────────────

function useHighlight(code: string, lang: string): string {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    highlightCode(code, lang).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => { cancelled = true; };
  }, [code, lang]);

  return html;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  readOnly = false,
  onRun,
  isRunning = false,
  showAiGenerator = false,
  onOpenAiGenerator,
}) => {
  const lineCount = value.split('\n').length;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const codePreRef = useRef<HTMLPreElement | null>(null);

  // Sync scroll positions perfectly between textarea, pre tags, and line numbers
  const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbersDiv = document.getElementById('line-numbers');
    if (lineNumbersDiv) {
      lineNumbersDiv.scrollTop = e.currentTarget.scrollTop;
    }
    if (codePreRef.current) {
      codePreRef.current.scrollTop = e.currentTarget.scrollTop;
      codePreRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Keep scroll aligned if text changes programmatically
  useEffect(() => {
    if (textareaRef.current && codePreRef.current) {
      codePreRef.current.scrollTop = textareaRef.current.scrollTop;
      codePreRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    // 1. Intercept Tab key → insert 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const indent = '    ';
      const newValue = currentValue.substring(0, start) + indent + currentValue.substring(end);
      onChange(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indent.length;
        }
      }, 0);
    }

    // 2. Intercept Enter key → auto-indent matching previous line
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const beforeCursor = currentValue.substring(0, start);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];

      // Extract leading spaces
      const spaceMatch = currentLine.match(/^(\s*)/);
      let indent = spaceMatch ? spaceMatch[1] : '';

      // Expand indentation block if starting nested curly brackets or colon
      if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith(':')) {
        indent += '    ';
      }

      const insertion = '\n' + indent;
      const newValue = currentValue.substring(0, start) + insertion + currentValue.substring(end);
      onChange(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + insertion.length;
        }
      }, 0);
    }
  };

  const linesArr = Array.from({ length: Math.max(15, lineCount) }, (_, i) => i + 1);
  const highlightedHtml = useHighlight(value, language);

  return (
    <div className="flex flex-col w-full h-full bg-surface-black border border-white/[0.06] rounded-lg overflow-hidden select-none">
      {/* Editor Header Toolbar */}
      <div className="h-11 bg-surface-tile-2 border-b border-white/[0.06] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[12px] text-body-muted/60 font-mono">collaborative_session.js</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={readOnly || isRunning}
            title="Select programming language"
            aria-label="Programming language"
            className="bg-ink text-[12px] text-body-muted border border-white/[0.06] rounded px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="cpp">C++</option>
          </select>

          {showAiGenerator && onOpenAiGenerator && (
            <Button
              variant="ghost"
              className="flex items-center gap-1.5 h-7 px-2.5 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] text-primary py-0 font-normal rounded-md"
              onClick={onOpenAiGenerator}
              title="AI Question Generator (Ctrl + K or ⌘K)"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[12px] text-white">AI Challenge</span>
            </Button>
          )}

          {onRun && (
            <Button
              variant="ghost"
              disabled={isRunning}
              className="flex items-center gap-1.5 h-7 px-2.5 bg-primary text-white hover:bg-primary-focus py-0 font-normal rounded-md disabled:opacity-50"
              onClick={onRun}
              title="Execute Code Sandbox (Ctrl + Enter or ⌘↵)"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span className="text-[12px]">{isRunning ? 'Running...' : 'Run'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="flex flex-1 relative overflow-hidden font-mono text-[14px] leading-6">
        {/* Line numbers gutter */}
        <div
          id="line-numbers"
          className="w-12 bg-surface-tile-3/50 text-white/20 select-none py-4 text-right pr-3 border-r border-white/[0.06] overflow-hidden"
        >
          {linesArr.map((lineNum) => (
            <div key={lineNum} className="h-6 leading-6">
              {lineNum}
            </div>
          ))}
        </div>

        {/* Text editor body */}
        <div className="flex-1 relative h-full bg-editor-bg">
          {/* Layer 1: Syntax Highlight Display (Beneath) */}
          <pre
            ref={codePreRef}
            className="absolute inset-0 w-full h-full p-4 pointer-events-none select-none overflow-auto font-mono text-[14px] leading-6 whitespace-pre m-0 border-0 bg-transparent text-white/55 [tab-size:4]"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />

          {/* Placeholder hint — visible only when editor is empty */}
          {!value && (
            <div className="absolute inset-0 p-4 pointer-events-none select-none font-mono text-[14px] leading-6 text-body-muted/50 italic z-10">
              // Write code collaboratively...
            </div>
          )}

          {/* Layer 2: Interactive Transparent Textarea (On top) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleTextareaScroll}
            disabled={readOnly}
            placeholder="// Write code collaboratively..."
            aria-label="Collaborative code editor"
            spellCheck={false}
            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-4 leading-6 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 overflow-auto whitespace-pre border-0 [tab-size:4] select-text z-20"
            style={{
              WebkitTextFillColor: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Editor Footer Status */}
      <div className="h-7 bg-surface-tile-3 border-t border-white/[0.06] px-4 flex items-center justify-between text-[11px] text-body-muted/55 font-mono select-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-primary-on-dark" />
          <span>Rich IDE Engine Active</span>
        </div>
        <div>
          <span>Tab Size: 4</span>
          <span className="mx-2">|</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
