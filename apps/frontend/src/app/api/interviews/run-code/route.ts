import { NextResponse } from 'next/server';

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'object' && arg !== null) {
    try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
  }
  return String(arg);
}

function runJavaScript(code: string): { stdout?: string; stderr?: string; error?: string; code?: number } {
  const logs: string[] = [];
  const errors: string[] = [];

  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(formatArg).join(' ')),
    error: (...args: unknown[]) => errors.push(args.map(formatArg).join(' ')),
    warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(formatArg).join(' ')),
    info: (...args: unknown[]) => logs.push(args.map(formatArg).join(' ')),
  };

  try {
    // ponytail: eval in isolated scope — mock/dev only, not production
    const fn = new Function('console', code);
    fn(fakeConsole);

    return {
      stdout: logs.length > 0 ? logs.join('\n') : undefined,
      stderr: errors.length > 0 ? errors.join('\n') : undefined,
      code: errors.length > 0 ? 1 : 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message,
      code: 1,
    };
  }
}

function runPython(code: string): { stdout?: string; stderr?: string; error?: string; code?: number } {
  // Mock Python execution — just return a message
  return {
    stdout: `[Mock] Python execution simulated.\nCode length: ${code.length} characters\nNote: Real Python execution requires a backend sandbox.`,
    code: 0,
  };
}

export async function POST(req: Request) {
  try {
    const { codeContent, language } = await req.json();

    if (!codeContent) {
      return NextResponse.json(
        { error: 'No code provided.', code: 1 },
        { status: 400 },
      );
    }

    const lang = (language || 'javascript').toLowerCase();

    let result: { stdout?: string; stderr?: string; error?: string; code?: number };

    if (lang === 'javascript' || lang === 'typescript') {
      result = runJavaScript(codeContent);
    } else if (lang === 'python') {
      result = runPython(codeContent);
    } else {
      result = {
        stdout: `[Mock] ${language} execution simulated.\nCode length: ${codeContent.length} characters\nNote: Real ${language} execution requires a backend sandbox.`,
        code: 0,
      };
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.', code: 1 },
      { status: 400 },
    );
  }
}
