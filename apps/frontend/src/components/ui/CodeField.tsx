'use client';

import React, { useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-[120px] bg-black/40 rounded-lg animate-pulse" />,
  },
);

interface CodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  minHeight?: number;
  placeholder?: string;
}

const THEME_KEY = 'question-form-dark';

export function CodeField({ value, onChange, language, minHeight = 120, placeholder }: CodeFieldProps) {
  const themeRegistered = useRef(false);

  const handleMount = useCallback((editor: any, monaco: any) => {
    if (!themeRegistered.current) {
      monaco.editor.defineTheme(THEME_KEY, {
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
        ],
        colors: {
          'editor.background': '#0a0a0a',
          'editor.foreground': '#d1d5db',
          'editorLineNumber.foreground': '#2d3748',
          'editor.selectionBackground': '#312e8150',
          'editor.lineHighlightBackground': '#ffffff07',
          'editorCursor.foreground': '#818cf8',
          'editorIndentGuide.background1': '#1f2937',
          'editorIndentGuide.activeBackground1': '#374151',
        },
      });
      themeRegistered.current = true;
    }
    monaco.editor.setTheme(THEME_KEY);

    // Show placeholder when editor is empty
    if (placeholder) {
      editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        if (model) {
          model.setValue('');
        }
      });
    }
  }, [placeholder]);

  return (
    <div className="border border-white/[0.08] rounded-lg overflow-hidden focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
      <MonacoEditor
        height={minHeight}
        language={language}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        onMount={handleMount}
        theme={THEME_KEY}
        options={{
          readOnly: false,
          fontSize: 13,
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'on',
          lineNumbers: 'off',
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          padding: { top: 12, bottom: 12 },
          scrollbar: { vertical: 'hidden', horizontal: 'auto', alwaysConsumeMouseWheel: false },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          renderLineHighlight: 'none',
          contextmenu: false,
          bracketPairColorization: { enabled: true },
          suggest: { showKeywords: false, showSnippets: false },
          quickSuggestions: false,
          parameterHints: { enabled: false },
          smoothScrolling: true,
          cursorBlinking: 'phase',
          cursorSmoothCaretAnimation: 'on',
          renderWhitespace: 'selection',
        }}
      />
    </div>
  );
}
