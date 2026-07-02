import { Injectable, Logger } from '@nestjs/common';
import { COMPILER_MAP, type TestRunResponse } from '@interviewos/shared';

interface WandboxResponse {
  program_output?: string;
  program_message?: string;
  program_error?: string;
  compiler_error?: string;
  status?: string;
}

const OUTPUT_PREAMBLE = '---TEST_RESULTS_START---';
const OUTPUT_FOOTER = '---TEST_RESULTS_END---';

@Injectable()
export class TestRunnerService {
  private readonly logger = new Logger(TestRunnerService.name);

  private wrapWithTestHarness(
    codeContent: string,
    testCode: string,
    language: string,
  ): string {
    const lang = language.toLowerCase();

    if (lang === 'javascript' || lang === 'typescript') {
      return `${codeContent}\n\n// --- Test Harness ---\nconst __testResults = [];\nlet __testPassed = 0;\nlet __testFailed = 0;\n\nfunction assert(condition, name, errorMsg) {\n  if (condition) {\n    __testPassed++;\n    console.log('PASS: ' + name);\n  } else {\n    __testFailed++;\n    console.log('FAIL: ' + name + ' - ' + errorMsg);\n  }\n}\n\nfunction assertEqual(actual, expected, name) {\n  const pass = actual === expected;\n  if (pass) {\n    __testPassed++;\n    console.log('PASS: ' + name);\n  } else {\n    __testFailed++;\n    const errMsg = 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual);\n    console.log('FAIL: ' + name + ' - ' + errMsg);\n  }\n}\n\nfunction assertDeepEqual(actual, expected, name) {\n  const pass = JSON.stringify(actual) === JSON.stringify(expected);\n  if (pass) {\n    __testPassed++;\n    console.log('PASS: ' + name);\n  } else {\n    __testFailed++;\n    const errMsg = 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual);\n    console.log('FAIL: ' + name + ' - ' + errMsg);\n  }\n}\n\nconsole.log('${OUTPUT_PREAMBLE}');\ntry {\n${testCode
        .split('\n')
        .map((l) => '  ' + l)
        .join(
          '\n',
        )}\n} catch (e) {\n  __testFailed++;\n  console.log('FAIL: Runtime Error - ' + (e.message || e));\n}\nconsole.log('${OUTPUT_FOOTER}');\nconsole.log('Tests: ' + __testPassed + ' passed, ' + __testFailed + ' failed');`;
    }

    if (lang === 'python') {
      return `${codeContent}\n\n# --- Test Harness ---\nimport json\n\n__test_passed = 0\n__test_failed = 0\n\ndef assert_equal(actual, expected, name):\n    global __test_passed, __test_failed\n    if actual == expected:\n        __test_passed += 1\n        print(f'PASS: {name}')\n    else:\n        __test_failed += 1\n        print(f'FAIL: {name} - expected {expected}, got {actual}')\n\ndef assert_true(condition, name, error_msg=''):\n    global __test_passed, __test_failed\n    if condition:\n        __test_passed += 1\n        print(f'PASS: {name}')\n    else:\n        __test_failed += 1\n        err = f' - {error_msg}' if error_msg else ''\n        print(f'FAIL: {name}{err}')\n\nprint('${OUTPUT_PREAMBLE}')\ntry:\n${testCode
        .split('\n')
        .map((l) => '    ' + l)
        .join(
          '\n',
        )}\nexcept Exception as e:\n    __test_failed += 1\n    print(f'FAIL: Runtime Error - {e}')\nprint('${OUTPUT_FOOTER}')\nprint(f'Tests: {__test_passed} passed, {__test_failed} failed')`;
    }

    if (lang === 'go') {
      return `${codeContent}\n\n// --- Test Harness ---\npackage main\n\nimport "fmt"\n\nvar __testPassed = 0\nvar __testFailed = 0\n\nfunc assertEqual(actual, expected interface{}, name string) {\n\tif actual == expected {\n\t\t__testPassed++\n\t\tfmt.Printf("PASS: %s\\n", name)\n\t} else {\n\t\t__testFailed++\n\t\tfmt.Printf("FAIL: %s - expected %v, got %v\\n", name, expected, actual)\n\t}\n}\n\nfunc runTests() {\n\tfmt.Println("${OUTPUT_PREAMBLE}")\n${testCode
        .split('\n')
        .map((l) => '\t' + l)
        .join(
          '\n',
        )}\n\tfmt.Println("${OUTPUT_FOOTER}")\n\tfmt.Printf("Tests: %d passed, %d failed\\n", __testPassed, __testFailed)\n}\n\nfunc main() {\n\trunTests()\n}`;
    }

    if (lang === 'rust') {
      return `fn main() {\n    let mut __test_passed: i32 = 0;\n    let mut __test_failed: i32 = 0;\n\n${codeContent
        .split('\n')
        .map((l) => '    ' + l)
        .join(
          '\n',
        )}\n\n    macro_rules! assert_equal {\n        (\$actual:expr, \$expected:expr, \$name:expr) => {{\n            if \$actual == \$expected {\n                __test_passed += 1;\n                println!("PASS: {}", \$name);\n            } else {\n                __test_failed += 1;\n                println!("FAIL: {} - expected {:?}, got {:?}", \$name, \$expected, \$actual);\n            }\n        }};\n    }\n\n    macro_rules! assert_true {\n        (\$cond:expr, \$name:expr) => {{\n            if \$cond {\n                __test_passed += 1;\n                println!("PASS: {}", \$name);\n            } else {\n                __test_failed += 1;\n                println!("FAIL: {}", \$name);\n            }\n        }};\n    }\n\n    println!("${OUTPUT_PREAMBLE}");\n${testCode
        .split('\n')
        .map((l) => '    ' + l)
        .join(
          '\n',
        )}\n    println!("${OUTPUT_FOOTER}");\n    println!("Tests: {} passed, {} failed", __test_passed, __test_failed);\n}`;
    }

    if (lang === 'cpp') {
      return `#include <iostream>\n#include <string>\n#include <sstream>\n#include <cassert>\nusing namespace std;\n\n${codeContent}\n\nint __test_passed = 0;\nint __test_failed = 0;\n\n#define ASSERT_EQ(actual, expected, name) do { \\\n    if ((actual) == (expected)) { \\\n        __test_passed++; \\\n        cout << "PASS: " << name << endl; \\\n    } else { \\\n        __test_failed++; \\\n        cout << "FAIL: " << name << " - expected " << #expected << ", got " << #actual << endl; \\\n    } \\\n} while(0)\n\n#define ASSERT_TRUE(cond, name) do { \\\n    if (cond) { \\\n        __test_passed++; \\\n        cout << "PASS: " << name << endl; \\\n    } else { \\\n        __test_failed++; \\\n        cout << "FAIL: " << name << endl; \\\n    } \\\n} while(0)\n\nint main() {\n\tcout << "${OUTPUT_PREAMBLE}" << endl;\n${testCode
        .split('\n')
        .map((l) => '\t' + l)
        .join(
          '\n',
        )}\n\tcout << "${OUTPUT_FOOTER}" << endl;\n\tcout << "Tests: " << __test_passed << " passed, " << __test_failed << " failed" << endl;\n\treturn 0;\n}`;
    }

    if (lang === 'java') {
      return `public class Solution {
${codeContent}

    static int __testPassed = 0;
    static int __testFailed = 0;

    static void assertEqual(Object actual, Object expected, String name) {
        if (actual.equals(expected)) {
            __testPassed++;
            System.out.println("PASS: " + name);
        } else {
            __testFailed++;
            System.out.println("FAIL: " + name + " - expected " + expected + ", got " + actual);
        }
    }

    static void assertTrue(boolean condition, String name, String errorMsg) {
        if (condition) {
            __testPassed++;
            System.out.println("PASS: " + name);
        } else {
            __testFailed++;
            System.out.println("FAIL: " + name + (errorMsg.isEmpty() ? "" : " - " + errorMsg));
        }
    }

    static void assertTrue(boolean condition, String name) {
        assertTrue(condition, name, "");
    }

    public static void main(String[] args) {
        System.out.println("${OUTPUT_PREAMBLE}");
        try {
${testCode.split('\n').map((l) => '            ' + l).join('\n')}
        } catch (Exception e) {
            __testFailed++;
            System.out.println("FAIL: Runtime Error - " + e.getMessage());
        }
        System.out.println("${OUTPUT_FOOTER}");
        System.out.println("Tests: " + __testPassed + " passed, " + __testFailed + " failed");
    }
}`;
    }

    if (lang === 'csharp') {
      return `using System;

${codeContent}

class Program {
    static int __testPassed = 0;
    static int __testFailed = 0;

    static void AssertEqual(object actual, object expected, string name) {
        if (actual.Equals(expected)) {
            __testPassed++;
            Console.WriteLine($"PASS: {name}");
        } else {
            __testFailed++;
            Console.WriteLine($"FAIL: {name} - expected {expected}, got {actual}");
        }
    }

    static void AssertTrue(bool condition, string name, string errorMsg = "") {
        if (condition) {
            __testPassed++;
            Console.WriteLine($"PASS: {name}");
        } else {
            __testFailed++;
            var err = string.IsNullOrEmpty(errorMsg) ? "" : $" - {errorMsg}";
            Console.WriteLine($"FAIL: {name}{err}");
        }
    }

    static void Main() {
        Console.WriteLine("${OUTPUT_PREAMBLE}");
        try {
${testCode.split('\n').map((l) => '            ' + l).join('\n')}
        } catch (Exception e) {
            __testFailed++;
            Console.WriteLine($"FAIL: Runtime Error - {e.Message}");
        }
        Console.WriteLine("${OUTPUT_FOOTER}");
        Console.WriteLine($"Tests: {__testPassed} passed, {__testFailed} failed");
    }
}`;
    }

    if (lang === 'kotlin') {
      return `${codeContent}

fun assertEqual(actual: Any?, expected: Any?, name: String) {
    if (actual == expected) {
        __testPassed++
        println("PASS: $name")
    } else {
        __testFailed++
        println("FAIL: $name - expected $expected, got $actual")
    }
}

fun assertTrue(condition: Boolean, name: String, errorMsg: String = "") {
    if (condition) {
        __testPassed++
        println("PASS: $name")
    } else {
        __testFailed++
        val err = if (errorMsg.isEmpty() "" else " - $errorMsg"
        println("FAIL: $name$err")
    }
}

var __testPassed = 0
var __testFailed = 0

fun main() {
    println("${OUTPUT_PREAMBLE}")
    try {
${testCode.split('\n').map((l) => '        ' + l).join('\n')}
    } catch (e: Exception) {
        __testFailed++
        println("FAIL: Runtime Error - \${e.message}")
    }
    println("${OUTPUT_FOOTER}")
    println("Tests: $__testPassed passed, $__testFailed failed")
}`;
    }

    if (lang === 'ruby') {
      return `${codeContent}

# --- Test Harness ---
$__test_passed = 0
$__test_failed = 0

def assert_equal(actual, expected, name)
  if actual == expected
    $__test_passed += 1
    puts "PASS: #{name}"
  else
    $__test_failed += 1
    puts "FAIL: #{name} - expected #{expected}, got #{actual}"
  end
end

def assert_true(condition, name, error_msg = '')
  if condition
    $__test_passed += 1
    puts "PASS: #{name}"
  else
    $__test_failed += 1
    err = error_msg.empty? '' : " - #{error_msg}"
    puts "FAIL: #{name}#{err}"
  end
end

puts '${OUTPUT_PREAMBLE}'
begin
${testCode.split('\n').map((l) => '  ' + l).join('\n')}
rescue => e
  $__test_failed += 1
  puts "FAIL: Runtime Error - #{e.message}"
end
puts '${OUTPUT_FOOTER}'
puts "Tests: #{$__test_passed} passed, #{$__test_failed} failed"`;
    }

    if (lang === 'php') {
      return `<?php
${codeContent}

// --- Test Harness ---
$__testPassed = 0;
$__testFailed = 0;

function assertEqual($actual, $expected, $name) {
    global $__testPassed, $__testFailed;
    if ($actual === $expected) {
        $__testPassed++;
        echo "PASS: $name\\n";
    } else {
        $__testFailed++;
        echo "FAIL: $name - expected " . json_encode($expected) . ", got " . json_encode($actual) . "\\n";
    }
}

function assertTrue($condition, $name, $errorMsg = '') {
    global $__testPassed, $__testFailed;
    if ($condition) {
        $__testPassed++;
        echo "PASS: $name\\n";
    } else {
        $__testFailed++;
        $err = $errorMsg ? " - $errorMsg" : "";
        echo "FAIL: $name$err\\n";
    }
}

echo '${OUTPUT_PREAMBLE}\\n';
try {
${testCode.split('\n').map((l) => '    ' + l).join('\n')}
} catch (Exception $e) {
    $__testFailed++;
    echo "FAIL: Runtime Error - " . $e->getMessage() . "\\n";
}
echo '${OUTPUT_FOOTER}\\n';
echo "Tests: $__testPassed passed, $__testFailed failed\\n";
?>`;
    }

    if (lang === 'swift') {
      return `import Foundation

${codeContent}

// --- Test Harness ---
var __testPassed = 0
var __testFailed = 0

func assertEqual<T: Equatable>(_ actual: T, _ expected: T, _ name: String) {
    if actual == expected {
        __testPassed += 1
        print("PASS: \\(name)")
    } else {
        __testFailed += 1
        print("FAIL: \\(name) - expected \\(expected), got \\(actual)")
    }
}

func assertTrue(_ condition: Bool, _ name: String, _ errorMsg: String = "") {
    if condition {
        __testPassed += 1
        print("PASS: \\(name)")
    } else {
        __testFailed += 1
        let err = errorMsg.isEmpty "" : " - \\(errorMsg)"
        print("FAIL: \\(name)\\(err)")
    }
}

print("${OUTPUT_PREAMBLE}")
do {
${testCode.split('\n').map((l) => '    ' + l).join('\n')}
} catch {
    __testFailed += 1
    print("FAIL: Runtime Error - \\(error)")
}
print("${OUTPUT_FOOTER}")
print("Tests: \\(__testPassed) passed, \\(__testFailed) failed")`;
    }

    return `${codeContent}\n\n${testCode}`;
  }

  private parseOutput(
    stdout: string,
    stderr: string,
    error?: string,
  ): TestRunResponse {
    const results: {
      name: string;
      passed: boolean;
      error?: string;
      output?: string;
    }[] = [];
    const hasError = !!error || !!stderr;

    if (hasError && !stdout) {
      results.push({
        name: 'Runtime Error',
        passed: false,
        error: error || stderr,
      });
      return {
        results,
        summary: { passed: 0, failed: 1, total: 1 },
        raw: { stdout, stderr, error },
      };
    }

    let testSection = stdout || '';
    const startIdx = testSection.indexOf(OUTPUT_PREAMBLE);
    const endIdx = testSection.indexOf(OUTPUT_FOOTER);

    if (startIdx !== -1 && endIdx !== -1) {
      testSection = testSection.substring(
        startIdx + OUTPUT_PREAMBLE.length,
        endIdx,
      );
    }

    const lines = testSection.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const passMatch = trimmed.match(/^PASS:\s*(.+)$/);
      const failMatch = trimmed.match(/^FAIL:\s*(.+)$/);

      if (passMatch) {
        results.push({ name: passMatch[1].trim(), passed: true });
      } else if (failMatch) {
        const rest = failMatch[1].trim();
        const errMatch = rest.match(/^(.+?)\s*-\s*(.+)$/);
        if (errMatch) {
          results.push({
            name: errMatch[1].trim(),
            passed: false,
            error: errMatch[2].trim(),
          });
        } else {
          results.push({ name: rest, passed: false });
        }
      }
    }

    if (results.length === 0 && (stdout || stderr || error)) {
      results.push({
        name: 'Output',
        passed: !hasError,
        error: error || stderr || '(no PASS/FAIL markers found)',
        output: stdout,
      });
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    return {
      results,
      summary: { passed, failed, total: results.length },
      raw: { stdout, stderr, error },
    };
  }

  async run(
    codeContent: string,
    testCode: string,
    language: string,
  ): Promise<TestRunResponse> {
    const combinedCode = this.wrapWithTestHarness(
      codeContent,
      testCode,
      language,
    );
    const compiler = COMPILER_MAP[language.toLowerCase()] ?? 'nodejs-head';

    try {
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler,
          code: combinedCode,
          stdin: '',
          'compiler-option-raw': '',
          'runtime-option-raw': '',
        }),
      });

      if (!res.ok) {
        return this.parseOutput(
          '',
          '',
          `Compiler service unavailable (HTTP ${res.status}).`,
        );
      }

      const data: WandboxResponse = await res.json();
      return this.parseOutput(
        data.program_output || data.program_message || '',
        data.program_error || data.compiler_error || '',
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to execute tests in sandbox.';
      return this.parseOutput('', '', message);
    }
  }
}
