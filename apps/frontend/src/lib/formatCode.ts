'use client';

type FormatResult = { code: string; success: true } | { code: string; success: false; error: string };

/** Simple cleanup: trim trailing whitespace, ensure single trailing newline, normalize to spaces */
function cleanupFallback(code: string): string {
  const lines = code.split('\n');
  const trimmed = lines.map((l) => l.replace(/[\t ]+$/, ''));
  // Remove trailing empty lines, keep one
  let end = trimmed.length;
  while (end > 0 && trimmed[end - 1].trim() === '') end--;
  const cleaned = end > 0 ? trimmed.slice(0, end) : [''];
  return cleaned.join('\n') + '\n';
}

const LANG_TO_PRETTIER_PARSER: Record<string, string> = {
  javascript: 'babel',
  typescript: 'typescript',
  json: 'json',
  css: 'css',
  html: 'html',
  markdown: 'markdown',
};

const LANG_ALIAS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  go: 'go',
  rs: 'rust',
  cpp: 'cpp',
};

function resolveLanguage(language: string): string {
  return LANG_ALIAS[language] ?? language;
}

export async function formatCode(raw: string, language: string): Promise<FormatResult> {
  const lang = resolveLanguage(language);
  const parser = LANG_TO_PRETTIER_PARSER[lang];

  if (parser) {
    try {
      const prettier = await import('prettier/standalone');

      const plugins = [];
      if (parser === 'babel' || parser === 'typescript') {
        plugins.push(await import('prettier/plugins/estree'));
        plugins.push(await import('prettier/plugins/babel'));
        if (parser === 'typescript') {
          plugins.push(await import('prettier/plugins/typescript'));
        }
      } else if (parser === 'css') {
        plugins.push(await import('prettier/plugins/postcss'));
      } else if (parser === 'html') {
        plugins.push(await import('prettier/plugins/html'));
      } else if (parser === 'markdown') {
        plugins.push(await import('prettier/plugins/markdown'));
      } else if (parser === 'json') {
        plugins.push(await import('prettier/plugins/babel'));
        plugins.push(await import('prettier/plugins/estree'));
      }

      const formatted = await prettier.format(raw, {
        parser,
        plugins,
        printWidth: 100,
        tabWidth: 4,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'always',
      });

      return { code: formatted, success: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // Fall through to cleanup on error
      const cleaned = cleanupFallback(raw);
      return { code: cleaned, success: false, error: message };
    }
  }

  // No Prettier parser available — run cleanup fallback
  const cleaned = cleanupFallback(raw);
  return cleaned !== raw
    ? { code: cleaned, success: true }
    : { code: cleaned, success: false, error: 'No formatter available for this language' };
}
