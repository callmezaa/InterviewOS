/**
 * Client-side code linting for InterviewOS.
 *
 * - JS/TS: Handled by Monaco's built-in TypeScript language service (semantic + syntactic).
 * - Python/Go/Rust/C++: Custom regex-based checks for common issues.
 */

export interface LintDiagnostic {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source?: string;
}

type Severity = LintDiagnostic['severity'];

const INDENT_SIZE: Record<string, number> = {
  python: 4,
  go: 4,
  rust: 4,
  cpp: 4,
};

function diag(
  line: number,
  column: number,
  message: string,
  severity: Severity = 'warning',
): LintDiagnostic {
  return { line, column, message, severity, source: 'lint' };
}

// ── Python ─────────────────────────────────────────────────────────────────

function lintPython(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trimStart();

    // Empty or comment-only lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Missing colon after compound statements
    const compoundKeywords = ['if', 'elif', 'else', 'for', 'while', 'def', 'class', 'try', 'except', 'finally', 'with'];
    for (const kw of compoundKeywords) {
      const regex = new RegExp(`^${kw}\\b`);
      if (regex.test(trimmed)) {
        // Check if the line ends with a colon (ignoring trailing comments)
        const codePart = trimmed.split('#')[0].trimEnd();
        if (!codePart.endsWith(':') && !codePart.endsWith('\\') && kw !== 'else') {
          diagnostics.push(diag(ln, line.indexOf(kw) + 1, `Expected ':' after '${kw}' statement`, 'error'));
        }
      }
    }

    // Missing parentheses in print (Python 2 style)
    if (/^\s*print\s+[^(]/.test(line) && !/^\s*print\s*\(/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('print') + 1, "Use print() function syntax", 'warning'));
    }

    // Unmatched parentheses on a single line (simple check)
    const opens = (line.match(/\(/g) || []).length;
    const closes = (line.match(/\)/g) || []).length;
    if (opens > closes && !line.trimEnd().endsWith('\\')) {
      // Could be multi-line, only flag if it looks suspicious
      const bracketDiff = opens - closes;
      if (bracketDiff > 1) {
        diagnostics.push(diag(ln, line.length, `Possible unmatched parentheses (${bracketDiff} unclosed)`, 'warning'));
      }
    }

    // Tab/space mixing
    if (line.startsWith('\t') && line.startsWith(' ')) {
      diagnostics.push(diag(ln, 1, 'Mixed tabs and spaces in indentation', 'error'));
    }

    // Trailing whitespace
    if (line !== line.trimEnd() && line.trimEnd().length > 0) {
      diagnostics.push(diag(ln, line.trimEnd().length + 1, 'Trailing whitespace', 'info'));
    }

    // Common misspellings
    if (/\bTrue\b/.test(line) === false && /\btrue\b/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('true') + 1, "Did you mean 'True'?", 'warning'));
    }
    if (/\bFalse\b/.test(line) === false && /\bfalse\b/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('false') + 1, "Did you mean 'False'?", 'warning'));
    }
    if (/\bNone\b/.test(line) === false && /\bnull\b/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('null') + 1, "Did you mean 'None'?", 'warning'));
    }
  }

  // Check for missing final newline
  if (code.length > 0 && !code.endsWith('\n')) {
    diagnostics.push(diag(lines.length, lines[lines.length - 1].length, 'Missing final newline', 'info'));
  }

  return diagnostics;
}

// ── Go ─────────────────────────────────────────────────────────────────────

function lintGo(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//')) continue;

    // Missing opening brace after func/if/for/switch/select
    const braceKeywords = ['func', 'if', 'for', 'switch', 'select', 'else'];
    for (const kw of braceKeywords) {
      if (trimmed.startsWith(kw + ' ') || trimmed === kw) {
        const codePart = trimmed.split('//')[0].trimEnd();
        if (!codePart.endsWith('{') && !codePart.endsWith(',') && kw !== 'else') {
          // Multi-line declaration is OK, but flag if it looks wrong
          if (!codePart.endsWith('(') && !codePart.endsWith(',')) {
            diagnostics.push(diag(ln, line.indexOf(kw) + 1, `Expected '{' after '${kw}' statement`, 'warning'));
          }
        }
      }
    }

    // Unused variable (common Go error pattern: variable declared but not used)
    const varDecl = trimmed.match(/^(\w+)\s*:?=\s*/);
    if (varDecl && varDecl[1] !== '_' && varDecl[1] !== 'err') {
      const varName = varDecl[1];
      // Check if variable appears elsewhere in the code
      const rest = lines.slice(i + 1).join('\n');
      if (!rest.includes(varName)) {
        diagnostics.push(diag(ln, 1, `Variable '${varName}' declared but not used`, 'warning'));
      }
    }

    // Missing comma in multi-line function calls/struct literals
    if (trimmed.endsWith('{') || trimmed.endsWith('(')) {
      // Next line check
    }

    // fmt.Println without import
    if (/fmt\./.test(line) && !code.includes('"fmt"')) {
      diagnostics.push(diag(ln, line.indexOf('fmt.') + 1, 'Missing import "fmt"', 'error'));
    }
  }

  return diagnostics;
}

// ── Rust ───────────────────────────────────────────────────────────────────

function lintRust(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//')) continue;

    // Missing semicolons (statements that should end with ;)
    if (
      trimmed.length > 0 &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(',') &&
      !trimmed.endsWith('(') &&
      !trimmed.endsWith(')') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('fn ') &&
      !trimmed.startsWith('let ') &&
      !trimmed.startsWith('if ') &&
      !trimmed.startsWith('for ') &&
      !trimmed.startsWith('while ') &&
      !trimmed.startsWith('match ') &&
      !trimmed.startsWith('impl ') &&
      !trimmed.startsWith('struct ') &&
      !trimmed.startsWith('enum ') &&
      !trimmed.startsWith('trait ') &&
      !trimmed.startsWith('pub ') &&
      !trimmed.startsWith('use ') &&
      !trimmed.startsWith('mod ') &&
      !trimmed.startsWith('type ') &&
      !trimmed.startsWith('const ') &&
      !trimmed.startsWith('static ') &&
      !trimmed.startsWith('macro_rules') &&
      !trimmed.endsWith('\\') &&
      !trimmed.includes('=>') &&
      trimmed !== 'else' &&
      trimmed !== 'loop'
    ) {
      // Only flag if it looks like a statement (has assignment or function call)
      if (/^\w+[\s(]/.test(trimmed) || /^\w+\s*=/.test(trimmed)) {
        diagnostics.push(diag(ln, line.length, 'Possible missing semicolon', 'info'));
      }
    }

    // println! without macro
    if (/println\s*\(/.test(line) && !/println!\s*\(/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('println') + 1, "Did you mean 'println!' (macro)?", 'warning'));
    }

    // vec! without macro
    if (/vec\s*\[/.test(line) && !/vec!\s*\[/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('vec') + 1, "Did you mean 'vec!' (macro)?", 'warning'));
    }

    // Common: &String instead of &str
    if (/&String\b/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('&String') + 1, 'Consider using &str instead of &String', 'info'));
    }

    // Unused variable (Rust convention: prefix with _)
    const letMatch = trimmed.match(/^let\s+(\w+)\s*[=:]|;\s*let\s+(\w+)/);
    if (letMatch) {
      const varName = letMatch[1] || letMatch[2];
      if (varName && !varName.startsWith('_') && varName !== 'self') {
        const rest = lines.slice(i + 1).join('\n');
        if (!rest.includes(varName)) {
          diagnostics.push(diag(ln, line.indexOf('let') + 5, `Variable '${varName}' might be unused (prefix with _ to suppress)`, 'info'));
        }
      }
    }
  }

  return diagnostics;
}

// ── C++ ────────────────────────────────────────────────────────────────────

function lintCpp(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

    // Missing semicolons (lines that look like statements but don't end with ;{}/\)
    if (
      trimmed.length > 0 &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(',') &&
      !trimmed.endsWith('(') &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('namespace ') &&
      !trimmed.startsWith('class ') &&
      !trimmed.startsWith('struct ') &&
      !trimmed.startsWith('template') &&
      !trimmed.startsWith('public:') &&
      !trimmed.startsWith('private:') &&
      !trimmed.startsWith('protected:') &&
      !trimmed.startsWith('case ') &&
      !trimmed.startsWith('default:') &&
      trimmed !== 'else' &&
      trimmed !== 'try' &&
      trimmed !== 'catch' &&
      trimmed !== 'public' &&
      trimmed !== 'private' &&
      trimmed !== 'protected'
    ) {
      if (/^\w+[\s(]/.test(trimmed) || /^\w+\s*=/.test(trimmed)) {
        diagnostics.push(diag(ln, line.length, 'Possible missing semicolon', 'info'));
      }
    }

    // Using namespace std (bad practice)
    if (/using\s+namespace\s+std\s*;/.test(trimmed)) {
      diagnostics.push(diag(ln, line.indexOf('using namespace') + 1, 'Consider using specific imports instead of "using namespace std"', 'warning'));
    }

    // Raw pointers without new (potential leak)
    if (/^\w+\s*\*\s*\w+\s*=/.test(trimmed) && !/new\s+/.test(trimmed)) {
      diagnostics.push(diag(ln, 1, 'Consider using smart pointers (std::unique_ptr, std::shared_ptr) instead of raw pointers', 'info'));
    }

    // Missing include for common functions
    if (/cout\s*<</.test(line) && !code.includes('#include <iostream>')) {
      diagnostics.push(diag(ln, line.indexOf('cout') + 1, 'Missing #include <iostream>', 'error'));
    }
    if (/vector\s*</.test(line) && !code.includes('#include <vector>')) {
      diagnostics.push(diag(ln, line.indexOf('vector') + 1, 'Missing #include <vector>', 'error'));
    }
    if (/string\b/.test(line) && !code.includes('#include <string>') && !/to_string/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('string') + 1, 'Missing #include <string>', 'warning'));
    }
  }

  return diagnostics;
}

// ── Java ──────────────────────────────────────────────────────────────────

function lintJava(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

    // Missing semicolons (lines that look like statements but don't end with ;{})
    if (
      trimmed.length > 0 &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(',') &&
      !trimmed.endsWith('(') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('public ') &&
      !trimmed.startsWith('private ') &&
      !trimmed.startsWith('protected ') &&
      !trimmed.startsWith('class ') &&
      !trimmed.startsWith('interface ') &&
      !trimmed.startsWith('import ') &&
      !trimmed.startsWith('package ') &&
      !trimmed.startsWith('if ') &&
      !trimmed.startsWith('for ') &&
      !trimmed.startsWith('while ') &&
      !trimmed.startsWith('switch ') &&
      !trimmed.startsWith('try') &&
      !trimmed.startsWith('catch') &&
      !trimmed.startsWith('finally') &&
      !trimmed.startsWith('@') &&
      trimmed !== 'else' &&
      trimmed !== 'static'
    ) {
      if (/^\w+[\s(]/.test(trimmed) || /^\w+\s*=/.test(trimmed)) {
        diagnostics.push(diag(ln, line.length, 'Possible missing semicolon', 'info'));
      }
    }

    // System.out.println without import (not needed, but flag old-style)
    if (/System\.out\.print/.test(line)) {
      // Fine, but flag if using System.out.println in production code
    }

    // Raw type usage
    if (/new\s+(ArrayList|HashMap|HashSet|LinkedList)\s*\(\)/.test(line) && !/<[^>]+>/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('new') + 1, 'Consider using generic types (e.g., ArrayList<String>)', 'warning'));
    }
  }

  return diagnostics;
}

// ── C# ────────────────────────────────────────────────────────────────────

function lintCsharp(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    // Missing semicolons
    if (
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(',') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('using ') &&
      !trimmed.startsWith('namespace ') &&
      !trimmed.startsWith('class ') &&
      !trimmed.startsWith('public ') &&
      !trimmed.startsWith('private ') &&
      !trimmed.startsWith('protected ') &&
      !trimmed.startsWith('if ') &&
      !trimmed.startsWith('for ') &&
      !trimmed.startsWith('while ') &&
      !trimmed.startsWith('switch ') &&
      !trimmed.startsWith('try') &&
      !trimmed.startsWith('catch') &&
      !trimmed.startsWith('finally') &&
      !trimmed.startsWith('[') &&
      trimmed !== 'else'
    ) {
      if (/^\w+[\s(]/.test(trimmed) || /^\w+\s*=/.test(trimmed)) {
        diagnostics.push(diag(ln, line.length, 'Possible missing semicolon', 'info'));
      }
    }

    // var without initialization
    if (/^\s*var\s+\w+\s*;/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('var') + 1, "Variable declared with 'var' must be initialized", 'warning'));
    }
  }

  return diagnostics;
}

// ── Kotlin ────────────────────────────────────────────────────────────────

function lintKotlin(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    // Java-style println without !
    if (/println\s*\(/.test(line) && !/println!\s*\(/.test(line)) {
      // Kotlin doesn't need ! for println, so no warning
    }

    // Using var when val would suffice (info)
    if (/^\s*var\s+\w+\s*=/.test(line)) {
      const varName = trimmed.match(/^var\s+(\w+)/)?.[1];
      if (varName) {
        const rest = lines.slice(i + 1).join('\n');
        const reassignPattern = new RegExp(`\\b${varName}\\s*=`, 'g');
        if (!reassignPattern.test(rest)) {
          diagnostics.push(diag(ln, line.indexOf('var') + 1, `Consider using 'val' instead of 'var' if '${varName}' is never reassigned`, 'info'));
        }
      }
    }

    // Nullable type without null check
    if (/!!/.test(line)) {
      diagnostics.push(diag(ln, line.indexOf('!!') + 1, 'Non-null assertion (!!) can cause NullPointerException — consider safe call (?.) or let block', 'warning'));
    }
  }

  return diagnostics;
}

// ── Ruby ──────────────────────────────────────────────────────────────────

function lintRuby(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    // Missing `end` for def/class/if/while/do
    const openKeywords = ['def ', 'class ', 'module ', 'if ', 'unless ', 'while ', 'until ', 'do'];
    for (const kw of openKeywords) {
      if (trimmed.startsWith(kw) && !trimmed.startsWith('end')) {
        // Simple check: count opens vs closes in the rest of the code
        const opens = lines.slice(i).filter((l) => {
          const t = l.trim();
          return openKeywords.some((k) => t.startsWith(k));
        }).length;
        const closes = lines.slice(i).filter((l) => l.trim() === 'end').length;
        if (opens > closes + 1 && i === lines.length - 1) {
          diagnostics.push(diag(ln, 1, `Possible missing 'end' for '${kw.trim()}'`, 'warning'));
        }
      }
    }

    // puts vs p vs print confusion
    if (/\bputs\b/.test(line) && /\bprint\b/.test(line)) {
      diagnostics.push(diag(ln, 1, 'Using both puts and print on the same line — did you mean one or the other?', 'warning'));
    }
  }

  return diagnostics;
}

// ── PHP ───────────────────────────────────────────────────────────────────

function lintPhp(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) continue;

    // Missing $ on variables
    const varAssign = trimmed.match(/^(\w+)\s*=/);
    if (varAssign && !varAssign[1].startsWith('$') && !['if', 'for', 'while', 'switch', 'function', 'class', 'return', 'echo', 'print', 'global'].includes(varAssign[1])) {
      diagnostics.push(diag(ln, 1, `Variable '${varAssign[1]}' should start with $`, 'warning'));
    }

    // Missing semicolons
    if (
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(',') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('<?') &&
      !trimmed.startsWith('?>') &&
      !trimmed.startsWith('if ') &&
      !trimmed.startsWith('for ') &&
      !trimmed.startsWith('foreach ') &&
      !trimmed.startsWith('while ') &&
      !trimmed.startsWith('switch ') &&
      !trimmed.startsWith('function ') &&
      !trimmed.startsWith('class ') &&
      !trimmed.startsWith('try') &&
      !trimmed.startsWith('catch') &&
      !trimmed.startsWith('finally') &&
      !trimmed.startsWith('public ') &&
      !trimmed.startsWith('private ') &&
      !trimmed.startsWith('protected ') &&
      !trimmed.startsWith('abstract ') &&
      !trimmed.startsWith('static ') &&
      trimmed !== 'else' &&
      trimmed !== 'endif' &&
      trimmed !== 'endfor' &&
      trimmed !== 'endforeach' &&
      trimmed !== 'endwhile'
    ) {
      if (/^\w+[\s(]/.test(trimmed) || /^\$?\w+\s*=/.test(trimmed)) {
        diagnostics.push(diag(ln, line.length, 'Possible missing semicolon', 'info'));
      }
    }

    // echo vs print confusion
    if (/echo\s+print\b/.test(line) || /print\s+echo\b/.test(line)) {
      diagnostics.push(diag(ln, 1, 'Using both echo and print — did you mean one or the other?', 'warning'));
    }
  }

  return diagnostics;
}

// ── Swift ─────────────────────────────────────────────────────────────────

function lintSwift(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    // var when let would suffice
    if (/^\s*var\s+\w+\s*=/.test(line)) {
      const varName = trimmed.match(/^var\s+(\w+)/)?.[1];
      if (varName) {
        const rest = lines.slice(i + 1).join('\n');
        const reassignPattern = new RegExp(`\\b${varName}\\s*=`, 'g');
        if (!reassignPattern.test(rest)) {
          diagnostics.push(diag(ln, line.indexOf('var') + 1, `Consider using 'let' instead of 'var' if '${varName}' is never reassigned`, 'info'));
        }
      }
    }

    // Force unwrapping with !
    if (/\w!\./.test(line) && !/!=/.test(line)) {
      diagnostics.push(diag(ln, line.search(/\w!\./) + 1, 'Force unwrapping (!) can cause runtime crashes — consider optional chaining (?.)', 'warning'));
    }

    // Missing return type on function
    if (/func\s+\w+\s*\([^)]*\)\s*\{/.test(trimmed) && !trimmed.includes('->')) {
      diagnostics.push(diag(ln, 1, 'Function may be missing explicit return type', 'info'));
    }
  }

  return diagnostics;
}

// ── Dispatcher ─────────────────────────────────────────────────────────────

export function lintCode(code: string, language: string): LintDiagnostic[] {
  if (!code.trim()) return [];

  switch (language) {
    case 'python':
      return lintPython(code);
    case 'go':
      return lintGo(code);
    case 'rust':
      return lintRust(code);
    case 'cpp':
    case 'c':
      return lintCpp(code);
    case 'java':
      return lintJava(code);
    case 'csharp':
      return lintCsharp(code);
    case 'kotlin':
      return lintKotlin(code);
    case 'ruby':
      return lintRuby(code);
    case 'php':
      return lintPhp(code);
    case 'swift':
      return lintSwift(code);
    default:
      // JS/TS: handled by Monaco's built-in TypeScript language service
      return [];
  }
}
