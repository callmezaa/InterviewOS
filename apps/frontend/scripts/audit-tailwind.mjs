#!/usr/bin/env node

/**
 * Tailwind Arbitrary Value Audit Script
 *
 * Scans all .tsx/.ts files in src/ for Tailwind arbitrary values (`[value]`
 * in classNames) and reports any that are not in the approved allowlist
 * (scripts/tailwind-allowlist.json).
 *
 * Usage:
 *   node scripts/audit-tailwind.mjs              # report all violations
 *   node scripts/audit-tailwind.mjs --json       # JSON output for CI
 *   node scripts/audit-tailwind.mjs --fix        # auto-fix (future)
 *
 * Exit code: 0 = no violations, 1 = violations found
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const ALLOWLIST_PATH = join(__dirname, 'tailwind-allowlist.json');

// ── Load allowlist ──────────────────────────────────────────────────────────
const allowlistRaw = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf-8'));

function flattenAllowlist() {
  const set = new Set();

  // All token values from the allowlist
  for (const category of ['spacing', 'typography', 'layout', 'opacity', 'animation_duration', 'misc', 'percentage', 'shadows', 'css_custom', 'shimmer']) {
    for (const entry of (allowlistRaw[category] ?? [])) {
      set.add(entry.value);
    }
  }

  // DESIGN.md spacing tokens
  if (allowlistRaw.designTokens?.spacing) {
    for (const [, val] of Object.entries(allowlistRaw.designTokens.spacing)) {
      set.add(val);
    }
  }

  // DESIGN.md radius tokens
  if (allowlistRaw.designTokens?.radii) {
    for (const [, val] of Object.entries(allowlistRaw.designTokens.radii)) {
      set.add(val);
    }
  }

  return set;
}

const ALLOWED = flattenAllowlist();

// ── Helpers ─────────────────────────────────────────────────────────────────

function isJSVariable(value) {
  // JavaScript expressions inside template literals, not CSS values
  return /^[a-zA-Z_$][a-zA-Z0-9_$.()\[\]\-]*$/.test(value) ||
         value.includes('...') ||
         value.includes('??') ||
         value.includes('?.');
}

function isCSSAttributeSelector(value) {
  // CSS attribute selectors like [selected=true]
  return value.includes('=');
}

function isBareNumber(value) {
  // Bare numbers used in motion props, not Tailwind arbitrary values
  return /^\d+(\.\d+)?$/.test(value);
}

function isCSSComplexValue(value) {
  // Complex CSS values that can't be tokenized
  return value.includes(':') ||
         value.includes(',') ||
         value.includes(' ') ||
         value.includes('gradient') ||
         value.includes('rgba(') ||
         value.includes('rgb(') ||
         value.includes('var(');
}

function extractClassNamePatterns(content) {
  // Find all className string contents
  const results = [];
  const classNameRegex = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g;

  let match;
  while ((match = classNameRegex.exec(content)) !== null) {
    const raw = match[1] ?? match[2] ?? match[3];
    if (!raw) continue;

    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Extract all [value] patterns
    const arbitraryRegex = /\[([^\]]+)\]/g;
    let amatch;
    while ((amatch = arbitraryRegex.exec(raw)) !== null) {
      const value = amatch[1].trim();

      // Skip JS variables and template expressions
      if (isJSVariable(value)) continue;
      // Skip CSS attribute selectors [key=value]
      if (isCSSAttributeSelector(value)) continue;
      // Skip bare numbers (motion transition values)
      if (isBareNumber(value)) continue;
      // Skip complex CSS (box-shadows, gradients, custom directives)
      if (isCSSComplexValue(value)) continue;
      // Skip hex colors
      if (/^#[0-9a-fA-F]{3,8}$/.test(value)) continue;
      // Skip functional CSS values
      if (/^rgba?\(/.test(value)) continue;
      // Skip CSS variable references
      if (/^var\(/.test(value)) continue;

      results.push({ value, line: lineNumber, context: raw.substring(Math.max(0, amatch.index - 30), amatch.index + 30 + value.length + 2) });
    }
  }

  return results;
}

function findFiles(dir, ext) {
  const files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          files.push(...findFiles(fullPath, ext));
        }
      } else if (extname(fullPath) === ext) {
        files.push(fullPath);
      }
    }
  } catch { /* skip */ }
  return files;
}

// ── Main ────────────────────────────────────────────────────────────────────

const files = [
  ...findFiles(SRC, '.tsx'),
  ...findFiles(SRC, '.ts'),
];

const violations = [];

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const findings = extractClassNamePatterns(content);

  for (const f of findings) {
    if (!ALLOWED.has(f.value)) {
      violations.push({
        file: file.replace(ROOT + '/', ''),
        line: f.line,
        value: f.value,
        context: f.context,
      });
    }
  }
}

// ── Output ───────────────────────────────────────────────────────────────────

const isJson = process.argv.includes('--json');

if (violations.length === 0) {
  if (isJson) {
    console.log(JSON.stringify({ status: 'pass', violations: [] }));
  } else {
    console.log('✅ No arbitrary value violations found.');
  }
  process.exit(0);
}

if (isJson) {
  console.log(JSON.stringify({ status: 'fail', violations }, null, 2));
} else {
  console.log(`\n❌ Found ${violations.length} arbitrary value violation(s):\n`);

  // Group by value
  const grouped = {};
  for (const v of violations) {
    if (!grouped[v.value]) grouped[v.value] = [];
    grouped[v.value].push(`${v.file}:${v.line}`);
  }

  for (const [value, locations] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  [${value}] — ${locations.length} occurrence(s)`);
    for (const loc of locations.slice(0, 5)) {
      console.log(`    ${loc}`);
    }
    if (locations.length > 5) {
      console.log(`    ... and ${locations.length - 5} more`);
    }
    console.log('');
  }

  console.log(`Add violations to scripts/tailwind-allowlist.json or fix them.\n`);
}

process.exit(violations.length > 0 ? 1 : 0);
