import { Test, TestingModule } from '@nestjs/testing';
import { TestRunnerService } from './test-runner.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('TestRunnerService', () => {
  let service: TestRunnerService;

  beforeEach(async () => {
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TestRunnerService],
    }).compile();

    service = module.get<TestRunnerService>(TestRunnerService);
  });

  describe('run — parseOutput integration', () => {
    it('returns passed results for PASS: markers in stdout', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          program_output:
            '---TEST_RESULTS_START---\nPASS: 1+2=3\n---TEST_RESULTS_END---\nTests: 1 passed, 0 failed',
        }),
      });
      const result = await service.run(
        'function add(a,b) { return a+b; }',
        'assertEqual(add(1,2), 3, "1+2=3")',
        'javascript',
      );
      expect(result.summary.total).toBeGreaterThanOrEqual(1);
      expect(result.raw?.stdout).toContain('PASS:');
    });

    it('returns failed results for FAIL: markers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          program_output:
            '---TEST_RESULTS_START---\nFAIL: wrong answer - expected 99, got 3\n---TEST_RESULTS_END---\nTests: 0 passed, 1 failed',
        }),
      });
      const result = await service.run(
        'function add(a,b) { return a+b; }',
        'assertEqual(add(1,2), 99, "wrong answer")',
        'javascript',
      );
      const failed = result.results.filter((r) => !r.passed);
      expect(failed.length).toBeGreaterThanOrEqual(1);
      expect(result.raw?.stdout).toContain('FAIL:');
    });

    it('handles runtime errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const result = await service.run(
        'function crash() { throw new Error("boom"); }',
        'crash()',
        'javascript',
      );
      expect(result.results.length).toBeGreaterThanOrEqual(1);
    });

    it('handles non-ok response from Wandbox', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 503 });
      const result = await service.run('', '', 'javascript');
      expect(result.summary.failed).toBe(1);
      expect(result.results[0].error).toContain('503');
    });
  });

  describe('parseOutput', () => {
    it('parses PASS: and FAIL: lines correctly', () => {
      const stdout = `---TEST_RESULTS_START---\nPASS: Test 1\nFAIL: Test 2 - something broke\nPASS: Test 3\n---TEST_RESULTS_END---\nTests: 2 passed, 1 failed`;
      const result = (service as any).parseOutput(stdout, '');
      expect(result.summary).toEqual({ passed: 2, failed: 1, total: 3 });
      expect(result.results[0]).toMatchObject({ name: 'Test 1', passed: true });
      expect(result.results[1]).toMatchObject({
        name: 'Test 2',
        passed: false,
        error: 'something broke',
      });
      expect(result.results[2]).toMatchObject({ name: 'Test 3', passed: true });
    });

    it('returns a single failing result when stderr is present', () => {
      const result = (service as any).parseOutput('', 'SyntaxError: bad token');
      expect(result.summary.failed).toBe(1);
      expect(result.results[0].passed).toBe(false);
    });

    it('returns an Output result when no markers are found', () => {
      const result = (service as any).parseOutput('some raw output', '');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Output');
    });
  });

  describe('wrapWithTestHarness', () => {
    it('wraps JavaScript code with test harness', () => {
      const wrapped = (service as any).wrapWithTestHarness(
        'function f() {}',
        'assertEqual(f(), 1, "test")',
        'javascript',
      );
      expect(wrapped).toContain('function f() {}');
      expect(wrapped).toContain('assertEqual');
      expect(wrapped).toContain('---TEST_RESULTS_START---');
    });

    it('wraps Python code with test harness', () => {
      const wrapped = (service as any).wrapWithTestHarness(
        'def f(): pass',
        'assert_equal(f(), 1, "test")',
        'python',
      );
      expect(wrapped).toContain('def f(): pass');
      expect(wrapped).toContain('assert_equal');
    });

    it('wraps Go code with test harness', () => {
      const wrapped = (service as any).wrapWithTestHarness(
        'func f() {}',
        'assertEqual(f(), 1, "test")',
        'go',
      );
      expect(wrapped).toContain('func f() {}');
      expect(wrapped).toContain('assertEqual');
      expect(wrapped).toContain('package main');
    });

    it('wraps Rust code with assert macros', () => {
      const wrapped = (service as any).wrapWithTestHarness(
        'fn f() -> i32 { 1 }',
        'assert_equal!(f(), 1, "test");',
        'rust',
      );
      expect(wrapped).toContain('fn f() -> i32 { 1 }');
      expect(wrapped).toContain('macro_rules! assert_equal');
      expect(wrapped).toContain('macro_rules! assert_true');
    });

    it('wraps C++ code with ASSERT macros', () => {
      const wrapped = (service as any).wrapWithTestHarness(
        'int f() { return 1; }',
        'ASSERT_EQ(f(), 1, "test")',
        'cpp',
      );
      expect(wrapped).toContain('int f() { return 1; }');
      expect(wrapped).toContain('ASSERT_EQ');
      expect(wrapped).toContain('ASSERT_TRUE');
    });
  });
});
