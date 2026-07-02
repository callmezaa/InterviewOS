'use client';

import type { TestResult } from '@interviewos/shared';

export interface TestDiagnostic {
  line: number;
  type: 'pass' | 'fail';
  message: string;
  testName: string;
}

/** Extract function name from code for test template generation */
function detectFunctionName(code: string): string {
  const patterns = [
    /(?:export\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/,
    /(?:export\s+)?(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/,
    /def\s+(\w+)\s*\([^)]*\)\s*:/,
    /func\s+(\w+)\s*\([^)]*\)/,
    /fn\s+(\w+)\s*\([^)]*\)/,
    /(?:public|private|protected|static)?\s*(?:static\s+)?(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*\{/,
    /fun\s+(\w+)\s*\([^)]*\)/,
    /def\s+(\w+)\s*$/,
    /function\s+(\w+)\s*\([^)]*\)\s*\{/,
    /func\s+(\w+)\s*\([^)]*\)\s*->/,
  ];
  for (const p of patterns) {
    const m = code.match(p);
    if (m) return m[1];
  }
  return 'solution';
}

/** Generate a comprehensive test template with edge cases for the detected function */
export function generateTestTemplate(code: string, language: string): string {
  const fnName = detectFunctionName(code);

  const edgeCases = [
    { desc: 'handles null/undefined input', js: `// assertEqual(${fnName}(null), null, 'handles null input')` },
    { desc: 'handles empty input', js: `// assertEqual(${fnName}(''), '', 'handles empty input')` },
    { desc: 'handles basic case', js: `assertEqual(${fnName}(null), null, 'Example 1')` },
    { desc: 'returns expected type', js: `assert(${fnName}(null) !== undefined, 'returns a value')` },
  ];

  switch (language) {
    case 'python':
      return `# Tests for ${fnName}()
# Use assert_equal() or assert_true() helpers

assert_equal(${fnName}(None), None, 'handles null input')
assert_true(${fnName}(None) is not None, 'returns a value')
assert_equal(${fnName}(''), '', 'handles empty input')
assert_equal(${fnName}(0), 0, 'handles zero input')
# Add more test cases below
`;
    case 'go':
      return `// Tests for ${fnName}()
// Use assertEqual() helper or raw PASS:/FAIL: markers

assertEqual(${fnName}(nil), nil, "handles nil input")
assertEqual(${fnName}(""), "", "handles empty input")
assertEqual(${fnName}(0), 0, "handles zero input")
// Add more test cases below
`;
    case 'rust':
      return `// Tests for ${fnName}()
// Use assert_equal!() or assert_true!() macros

assert_equal!(${fnName}(None), None, "handles None input");
assert_true!(${fnName}(Some(1)).is_some(), "returns Some value");
// Add more test cases below
`;
    case 'cpp':
      return `// Tests for ${fnName}()
// Use ASSERT_EQ() or ASSERT_TRUE() macros

ASSERT_EQ(${fnName}(nullptr), nullptr, "handles null input")
ASSERT_TRUE(${fnName}("") == "", "handles empty string")
ASSERT_EQ(${fnName}(0), 0, "handles zero input")
// Add more test cases below
`;
    case 'java':
      return `// Tests for ${fnName}()
// Use assertEqual() or assertTrue() helpers

assertEqual(${fnName}(null), null, "handles null input");
assertTrue(${fnName}("") != null, "returns a value");
assertEqual(${fnName}(0), 0, "handles zero input");
// Add more test cases below
`;
    case 'csharp':
      return `// Tests for ${fnName}()
// Use AssertEqual() or AssertTrue() helpers

AssertEqual(${fnName}(null), null, "handles null input");
AssertTrue(${fnName}("") != null, "returns a value");
AssertEqual(${fnName}(0), 0, "handles zero input");
// Add more test cases below
`;
    case 'kotlin':
      return `// Tests for ${fnName}()
// Use assertEqual() or assertTrue() helpers

assertEqual(${fnName}(null), null, "handles null input")
assertTrue(${fnName}("") != null, "returns a value")
assertEqual(${fnName}(0), 0, "handles zero input")
// Add more test cases below
`;
    case 'ruby':
      return `# Tests for ${fnName}()
# Use assert_equal() or assert_true() helpers

assert_equal(${fnName}(nil), nil, 'handles nil input')
assert_true(${fnName}('') != nil, 'returns a value')
assert_equal(${fnName}(0), 0, 'handles zero input')
# Add more test cases below
`;
    case 'php':
      return `<?php
// Tests for ${fnName}()
// Use assertEqual() or assertTrue() helpers

assertEqual(${fnName}(null), null, "handles null input");
assertTrue(${fnName}("") !== null, "returns a value");
assertEqual(${fnName}(0), 0, "handles zero input");
// Add more test cases below
?>`;
    case 'swift':
      return `// Tests for ${fnName}()
// Use assertEqual() or assertTrue() helpers

assertEqual(${fnName}(nil), nil, "handles nil input")
assertTrue(${fnName}("") != nil, "returns a value")
assertEqual(${fnName}(0), 0, "handles zero input")
// Add more test cases below
`;
    default:
      return `// Tests for ${fnName}()
// Use assert(), assertEqual(), or assertDeepEqual() helpers

assertEqual(${fnName}(null), null, 'handles null input')
assert(${fnName}(null) !== undefined, 'returns a value')
assertEqual(${fnName}(''), '', 'handles empty input')
assertEqual(${fnName}(0), 0, 'handles zero input')
assertDeepEqual(${fnName}([1, 2, 3]), [1, 2, 3], 'handles array input')
// Add more test cases below
`;
  }
}

/** Try to map test failures to specific lines in the solution code */
export function generateTestDiagnostics(
  results: TestResult[],
  solutionCode: string,
): TestDiagnostic[] {
  const diagnostics: TestDiagnostic[] = [];
  const lines = solutionCode.split('\n');

  for (const result of results) {
    const errorText = result.error?.toLowerCase() ?? '';
    const testName = result.name;

    // Try to extract a line number from the error message
    let lineNum = -1;
    const linePatterns = [
      /line\s+(\d+)/i,
      /at\s+line\s+(\d+)/i,
      /:(\d+):/,
      /\((\d+)\)/,
    ];
    for (const p of linePatterns) {
      const m = errorText.match(p);
      if (m) {
        lineNum = parseInt(m[1], 10);
        break;
      }
    }

    // Try to find the function definition line from the test name or error
    if (lineNum < 1 || lineNum > lines.length) {
      const fnPatterns = [
        new RegExp(`function\\s+${testName}\\s*\\(`, 'i'),
        new RegExp(`def\\s+${testName}\\s*\\(`, 'i'),
        new RegExp(`func\\s+${testName}\\s*\\(`, 'i'),
        new RegExp(`fn\\s+${testName}\\s*\\(`, 'i'),
        /function\s+\w+\s*\(/,
        /def\s+\w+\s*\(/,
        /func\s+\w+\s*\(/,
        /fn\s+\w+\s*\(/,
      ];
      let foundFnLine = -1;
      for (const fp of fnPatterns) {
        for (let i = 0; i < lines.length; i++) {
          if (fp.test(lines[i])) {
            foundFnLine = i + 1;
            break;
          }
        }
        if (foundFnLine > 0) break;
      }
      lineNum = foundFnLine > 0 ? foundFnLine : 1;
    }

    // Clamp to valid range
    lineNum = Math.max(1, Math.min(lineNum, lines.length));

    diagnostics.push({
      line: lineNum,
      type: result.passed ? 'pass' : 'fail',
      message: result.passed ? 'Test passed' : (result.error || 'Test failed'),
      testName: result.name,
    });
  }

  return diagnostics;
}
