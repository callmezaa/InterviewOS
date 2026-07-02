'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, CheckCircle2, XCircle, Loader2, Clock, ChevronDown, ChevronRight, Beaker, BarChart3 } from 'lucide-react';
import type { TestResult } from '@interviewos/shared';

interface TestPanelProps {
  testCode: string;
  onTestCodeChange: (code: string) => void;
  onRunTests: () => void;
  isRunning: boolean;
  results: TestResult[];
  language: string;
  onClearResults: () => void;
  watchMode?: boolean;
  onToggleWatch?: () => void;
}



let highlighterSingleton: Promise<any> | null = null;

async function getHighlighter(): Promise<any> {
  if (!highlighterSingleton) {
    const shiki = await import('shiki');
    highlighterSingleton = shiki.createHighlighter({
      themes: ['one-dark-pro'],
      langs: ['javascript', 'typescript', 'python', 'go', 'rust', 'cpp'],
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

export function TestPanel({
  testCode,
  onTestCodeChange,
  onRunTests,
  isRunning,
  results,
  language,
  onClearResults,
  watchMode = false,
  onToggleWatch,
}: TestPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const codePreRef = useRef<HTMLPreElement | null>(null);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const lineCount = testCode.split('\n').length;
  const linesArr = Array.from({ length: Math.max(12, lineCount) }, (_, i) => i + 1);
  const highlightedHtml = useHighlight(testCode, language);
  const passedCount = results.filter((r) => r.passed).length;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbers = document.getElementById('test-line-numbers');
    if (lineNumbers) lineNumbers.scrollTop = e.currentTarget.scrollTop;
    if (codePreRef.current) {
      codePreRef.current.scrollTop = e.currentTarget.scrollTop;
      codePreRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const indent = '    ';
      const newVal = val.substring(0, start) + indent + val.substring(end);
      onTestCodeChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + indent.length;
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onRunTests}
            disabled={isRunning}
            className="h-7 px-3 flex items-center gap-1.5 text-[12px] font-semibold rounded-md bg-primary text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
            {!isRunning && (
              <kbd className="ml-1 text-[9px] font-mono text-white/30 px-1 py-0.5 rounded-sm bg-white/[0.06] border border-white/[0.08] leading-none">
                ^T
              </kbd>
            )}
          </button>
          {results.length > 0 && (
            <button
              onClick={onClearResults}
              className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] font-medium rounded-md bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          {onToggleWatch && (
            <button
              onClick={onToggleWatch}
              className={`h-7 px-2.5 flex items-center gap-1.5 text-[12px] font-medium rounded-md border transition-all ${
                watchMode
                  ? 'bg-green-500/10 text-green-400 border-green-500/25'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border-white/[0.06]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${watchMode ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
              <span>{watchMode ? 'Auto' : 'Watch'}</span>
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-[12px]">
            <div className="flex items-center gap-1 sm:gap-1.5 text-green-400">
              <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span className="font-semibold">{passedCount}</span>
              <span className="text-white/40 hidden xs:inline">passed</span>
            </div>
            <div className="w-px h-3 sm:h-4 bg-white/[0.06]" />
            <div className="flex items-center gap-1 sm:gap-1.5 text-red-400">
              <XCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span className="font-semibold">{results.length - passedCount}</span>
              <span className="text-white/40 hidden xs:inline">failed</span>
            </div>
            <div className="w-px h-3 sm:h-4 bg-white/[0.06]" />
            <span className="text-white/40 font-mono">{results.length}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {results.length > 0 && (
        <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden shrink-0">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(passedCount / results.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full rounded-full transition-colors ${
              passedCount === results.length ? 'bg-green-400' : passedCount > 0 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
          />
        </div>
      )}

      {/* Test Code Editor */}
      <div className="flex-1 flex flex-col min-h-0 bg-surface-black border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="h-9 bg-surface-tile-2 border-b border-white/[0.06] px-3 flex items-center gap-2 shrink-0">
          <Beaker className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] text-body-muted/70 font-mono">
            {language.charAt(0).toUpperCase() + language.slice(1)}
          </span>
          <span className="text-[11px] text-body-muted/40 font-mono">— test code</span>
        </div>
        <div className="flex flex-1 relative overflow-hidden font-mono text-[13px] leading-5">
          <div
            id="test-line-numbers"
            className="w-10 bg-surface-tile-3/30 text-white/15 select-none py-3 text-right pr-2 overflow-hidden shrink-0"
          >
            {linesArr.map((n) => (
              <div key={n} className="h-5 leading-5 text-[11px]">{n}</div>
            ))}
          </div>
          <div className="flex-1 relative bg-editor-bg">
            <pre
              ref={codePreRef}
              className="absolute inset-0 w-full h-full p-3 pointer-events-none select-none overflow-auto font-mono text-[13px] leading-5 whitespace-pre m-0 border-0 bg-transparent text-white/55 [tab-size:4]"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
            <textarea
              ref={textareaRef}
              value={testCode}
              onChange={(e) => onTestCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              aria-label="Test code editor"
              className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-3 leading-5 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 overflow-auto whitespace-pre border-0 [tab-size:4] select-text z-20 text-[13px]"
              style={{ WebkitTextFillColor: 'transparent' }}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-white/[0.06] rounded-lg overflow-hidden bg-surface-black shrink-0"
          >
            <div className="divide-y divide-white/[0.04]">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    onClick={() => setExpandedResult(expandedResult === i ? null : i)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors text-left group"
                  >
                    {r.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className={`text-[13px] font-medium flex-1 min-w-0 truncate ${r.passed ? 'text-white/80' : 'text-red-300'}`}>
                      {r.name}
                    </span>
                    {r.duration !== undefined && (
                      <span className="text-[11px] text-body-muted/40 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {r.duration}ms
                      </span>
                    )}
                    {r.error && !r.passed && (
                      <span className="text-[12px] text-red-400/70 font-mono truncate max-w-[200px] shrink-0 hidden sm:block">
                        {r.error}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-all shrink-0 ${
                        expandedResult === i ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedResult === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 pt-1 border-t border-white/[0.04]">
                          {r.error && (
                            <div className="text-[12px] text-red-400/80 font-mono whitespace-pre-wrap bg-red-500/5 rounded px-3 py-2 border border-red-500/10 mb-2">
                              {r.error}
                            </div>
                          )}
                          {r.output && (
                            <div className="text-[12px] text-body-muted/60 font-mono whitespace-pre-wrap bg-white/[0.02] rounded px-3 py-2 border border-white/[0.06] max-h-[120px] overflow-auto">
                              {r.output}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {results.length === 0 && !isRunning && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-body-muted/40">
          <Beaker className="w-6 h-6" />
          <span className="text-[12px] font-mono">Write tests and click Run Tests</span>
          <span className="text-[10px] font-mono text-body-muted/30">Use assert(), assertEqual(), or PASS:/FAIL: markers</span>
        </div>
      )}
    </div>
  );
}


