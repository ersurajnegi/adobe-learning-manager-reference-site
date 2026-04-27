'use strict';

/**
 * checkTestQuality.js
 *
 * Scans test spec files for anti-patterns defined in CLAUDE.md.
 *
 * Usage:
 *   node scripts/checkTestQuality.js            # scan src/tests/ (default)
 *   node scripts/checkTestQuality.js <path>     # scan a file or directory
 *
 * Exit code 0 = no violations found.
 * Exit code 1 = one or more violations found (CI-friendly).
 */

const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const rawTarget = process.argv[2];
const TARGET = rawTarget
  ? path.resolve(rawTarget)
  : path.join(ROOT, 'src', 'tests');

// ─── File collection ──────────────────────────────────────────────────────────

function collectSpecFiles(target) {
  const results = [];
  let stat;
  try { stat = fs.statSync(target); } catch { return results; }

  if (stat.isFile()) {
    if (/\.spec\.(tsx?|jsx?)$/.test(target)) results.push(target);
    return results;
  }

  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) results.push(...collectSpecFiles(full));
    else if (/\.spec\.(tsx?|jsx?)$/.test(entry.name)) results.push(full);
  }
  return results;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function padEnd(s, n) {
  return String(s) + ' '.repeat(Math.max(0, n - String(s).length));
}

function truncate(s, max) {
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

/**
 * Given source lines and a 0-based line index, scan backward to find the
 * nearest it() / test() declaration and return its name string.
 */
function getNearestTestName(lines, lineIdx) {
  for (let i = Math.min(lineIdx, lines.length - 1); i >= 0; i--) {
    const m = lines[i].match(
      /\b(?:it|test)(?:\.skip|\.only)?\s*\(\s*(['"`])((?:[^'"`\\]|\\.)*?)\1/
    );
    if (m) return m[2];
  }
  return '(unknown test)';
}

// ─── Test block extraction ────────────────────────────────────────────────────

/**
 * Build a map from source character offset → 1-based line number.
 */
function buildLineStarts(source) {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineOf(lineStarts, offset) {
  let lo = 0, hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
  }
  return lo + 1; // 1-based
}

/**
 * Extract individual test (it/test) callback bodies from source.
 * Handles single/double quoted strings and template literals so braces inside
 * strings don't confuse the brace counter.
 *
 * Returns: Array<{ name: string, startLine: number, body: string }>
 */
function extractTestBlocks(source) {
  const blocks = [];
  const lineStarts = buildLineStarts(source);

  // Match: it('name', ...) or test('name', ...) — not describe()
  const RE = /\b(?:it|test)(?:\.skip|\.only)?\s*\(\s*(['"`])((?:[^'"`\\]|\\.)*?)\1/g;
  let m;

  while ((m = RE.exec(source)) !== null) {
    const name = m[2];
    const startLine = lineOf(lineStarts, m.index);

    // Find the opening { of the callback body
    let i = m.index + m[0].length;
    while (i < source.length && source[i] !== '{') i++;
    if (i >= source.length) continue;

    // Brace-match to find the end of the test body, skipping string contents
    let depth = 0;
    let j = i;
    while (j < source.length) {
      const c = source[j];

      if (c === '\\') {
        j += 2;
        continue;
      }

      if (c === '"' || c === "'") {
        const q = c;
        j++;
        while (j < source.length && source[j] !== q) {
          if (source[j] === '\\') j++;
          j++;
        }
      } else if (c === '`') {
        j++;
        while (j < source.length) {
          if (source[j] === '\\') { j += 2; continue; }
          if (source[j] === '`') break;
          j++;
        }
      } else if (c === '{') {
        depth++;
      } else if (c === '}') {
        depth--;
        if (depth === 0) {
          blocks.push({
            name,
            startLine,
            body: source.substring(i, j + 1),
          });
          break;
        }
      }
      j++;
    }
  }

  return blocks;
}

// ─── Phase 1: File-level (line-by-line) checks ───────────────────────────────
//
// Simple regex patterns that can be detected without understanding block
// structure. For each match we record the line number and nearest test name.

const FILE_LEVEL_CHECKS = [
  {
    id: 'snapshot',
    label: 'Snapshot test',
    re: /\btoMatchSnapshot\s*\(|\btoMatchInlineSnapshot\s*\(/,
  },
  {
    id: 'placeholder',
    label: 'Placeholder assertion (always passes)',
    // expect(true).toBe(true), expect(false).toBe(false), expect(1).toBe(1)
    re: /\bexpect\s*\(\s*(?:true|false|1|0)\s*\)\s*\.\s*toBe\s*\(\s*(?:true|false|1|0)\s*\)/,
  },
  {
    id: 'arbitrary-timeout',
    label: 'Arbitrary timeout (use waitFor instead)',
    // Catches: setTimeout(resolve, N) — the canonical bad pattern
    re: /\bsetTimeout\s*\(\s*resolve/,
  },
  {
    id: 'manual-mock-args',
    label: 'Manual mock.calls extraction (use toHaveBeenCalledWith)',
    re: /\.mock\.calls\s*\[/,
  },
  {
    id: 'skipped-test',
    label: 'Skipped test',
    re: /\b(?:it|test)\.skip\s*\(|\bxit\s*\(|\bxtest\s*\(/,
  },
  {
    id: 'brittle-class-selector',
    label: 'Brittle [class*=] querySelector — use data-testid or role instead',
    // querySelector('[class*=foo]') couples tests to CSS class names rather than semantics.
    // Note: asserting on .className for *behavioural* state classes (show, active, locked, etc.)
    // is acceptable per CLAUDE.md — only brittle selector-based queries are flagged here.
    re: /\[class\*=/,
  },
  {
    id: 'fireevent-interaction',
    label: 'fireEvent used for user interaction — prefer userEvent (v7: userEvent.click(el))',
    // fireEvent dispatches synthetic DOM events without real browser behaviour (no focus, no
    // pointer events). Use userEvent for click, change, keyboard, dblClick, and submit.
    // fireEvent is still appropriate for non-interaction events: scroll, resize, load, error,
    // wheel, drag*, mouseEnter/Leave, etc.
    re: /\bfireEvent\.(click|dblClick|change|type|keyDown|keyUp|keyPress|focus|blur|submit)\s*\(/,
  },
  {
    id: 'userEvent-setup',
    label: 'userEvent.setup() used — v7 API is userEvent.click(el) directly, not userEvent.setup()',
    // CLAUDE.md: "Installed version is v7 — use userEvent.click(el), not userEvent.setup()."
    re: /\buserEvent\.setup\s*\(/,
  },
  {
    id: 'msw-usage',
    label: 'MSW (Mock Service Worker) used — use jest.fn()/jest.mock() instead',
    // CLAUDE.md: "Use jest.fn() / jest.mock() for all mocking — not MSW or any network-level interceptor."
    re: /from\s+['"]msw(?:\/node)?['"]|require\s*\(\s*['"]msw(?:\/node)?['"]\s*\)/,
  },
  {
    id: 'focused-test',
    label: 'Focused test/suite (.only / fit / fdescribe) — silently skips all other tests',
    // .only tests committed to the repo cause CI to run only those tests, masking failures elsewhere.
    re: /\b(?:it|test)\.only\s*\(|\bfit\s*\(|\bfdescribe\s*\(/,
  },
];

// ─── Phase 2: Block-level checks ─────────────────────────────────────────────
//
// These require seeing the full test body to determine if the pattern applies.
// We split the body on `expect(` to isolate each assertion's "tail" string,
// then check what assertion method follows.

/**
 * An assertion tail is "bare existence" if it only checks that something exists
 * (e.g. .toBeTruthy(), .toBeInTheDocument()) with no actual content verified.
 */
const BARE_EXISTENCE_RE = [
  /\.toBeTruthy\s*\(\s*\)/,
  // Only flag *positive* toBeInTheDocument — .not.toBeInTheDocument() is a meaningful absence check.
  /(?<!\.not)\.toBeInTheDocument\s*\(\s*\)/,
  // toBeDefined() only asserts something is not undefined — no content verified.
  /\.toBeDefined\s*\(\s*\)/,
];

/**
 * An assertion tail is "meaningful" if it checks an actual value or behaviour.
 * Note: .toHaveBeenCalled() counts as meaningful (asserts a function ran).
 */
const MEANINGFUL_ASSERTION_RE =
  /\.(toBe|toEqual|toStrictEqual|toContain|toHaveBeenCalled|toHaveLength|toMatch|toHaveValue|toHaveTextContent|toHaveAttribute|toBeGreaterThan|toBeLessThan|toBeNull|toBeUndefined|toBeFalsy)\s*\(/;

/**
 * Analyse a single test block for block-level violations.
 * Returns an array of violation objects (may be empty).
 */
function checkBlock(block) {
  const violations = [];
  const body = block.body;

  // Split body after each `expect(` to get the assertion "tails".
  // Each tail is everything after a given `expect(` until the next one.
  const tails = body.split(/\bexpect\s*\(/).slice(1);

  if (tails.length === 0) {
    violations.push({
      id: 'no-expect',
      label: 'Test has no expect() calls',
    });
    return violations;
  }

  // Check: every expect ends in .not.toThrow() — "doesn't crash" test
  const allNotThrow = tails.every((t) =>
    /\.not\s*\.\s*toThrow\s*\(/.test(t)
  );
  if (allNotThrow) {
    violations.push({
      id: 'not-throw-only',
      label: '.not.toThrow() is the only assertion (no behaviour verified)',
    });
    return violations; // further checks not needed
  }

  // Check: every expect is a bare existence check (toBeTruthy / toBeInTheDocument)
  // and none contain a meaningful content assertion.
  const allExistence = tails.every((tail) => {
    const isExistence = BARE_EXISTENCE_RE.some((re) => re.test(tail));
    const isMeaningful = MEANINGFUL_ASSERTION_RE.test(tail);
    return isExistence && !isMeaningful;
  });
  if (allExistence) {
    violations.push({
      id: 'existence-only',
      label: 'Only existence checks — no content or behaviour verified',
    });
  }

  return violations;
}

// ─── Per-file analysis ────────────────────────────────────────────────────────

function analyseFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split('\n');
  const violations = [];

  // Phase 1: line-by-line
  for (const check of FILE_LEVEL_CHECKS) {
    for (let i = 0; i < lines.length; i++) {
      if (check.re.test(lines[i])) {
        violations.push({
          line: i + 1,
          id: check.id,
          label: check.label,
          testName: getNearestTestName(lines, i),
        });
      }
    }
  }

  // Phase 2: block-level
  for (const block of extractTestBlocks(source)) {
    for (const v of checkBlock(block)) {
      violations.push({
        line: block.startLine,
        id: v.id,
        label: v.label,
        testName: block.name,
      });
    }
  }

  violations.sort((a, b) => a.line - b.line);
  return violations;
}

// ─── Report & main ────────────────────────────────────────────────────────────

const ALL_IDS = [
  ...FILE_LEVEL_CHECKS.map((c) => c.id),
  'not-throw-only',
  'no-expect',
  'existence-only',
];

// Labels for block-level checks used in the summary footer
const BLOCK_LEVEL_CHECK_LABELS = [
  { id: 'not-throw-only', label: '.not.toThrow() only' },
  { id: 'no-expect',      label: 'No expect() calls' },
  { id: 'existence-only', label: 'Existence checks only (.toBeTruthy / .toBeInTheDocument)' },
];

function run() {
  const files = collectSpecFiles(TARGET).sort();

  if (files.length === 0) {
    console.log(`No spec files found at: ${TARGET}`);
    process.exit(0);
  }

  const counts = Object.fromEntries(ALL_IDS.map((id) => [id, 0]));
  let totalViolations = 0;
  let filesWithViolations = 0;
  const DIVIDER = '─'.repeat(80);

  for (const file of files) {
    const violations = analyseFile(file);
    if (violations.length === 0) continue;

    filesWithViolations++;
    totalViolations += violations.length;

    const rel = path.relative(ROOT, file);
    console.log(`\nVIOLATIONS IN: ${rel}`);

    for (const v of violations) {
      counts[v.id] = (counts[v.id] || 0) + 1;
      const lineCol = padEnd(`Line ${v.line}`, 9);
      const idCol = padEnd(`[${v.id}]`, 32);
      const nameCol = `"${truncate(v.testName, 55)}"`;
      console.log(`  ${lineCol}  ${idCol}  ${nameCol}`);
    }
  }

  console.log('\n' + DIVIDER);

  if (totalViolations === 0) {
    console.log(
      `✓  No violations found across ${files.length} spec file${files.length !== 1 ? 's' : ''}.`
    );
    process.exit(0);
  }

  console.log(
    `TOTAL: ${totalViolations} violation${totalViolations !== 1 ? 's' : ''} ` +
    `across ${filesWithViolations}/${files.length} files\n`
  );

  const ALL_CHECK_LABELS = [...FILE_LEVEL_CHECKS, ...BLOCK_LEVEL_CHECK_LABELS];
  for (const id of ALL_IDS) {
    const count = counts[id] || 0;
    if (count > 0) {
      const checkLabel = ALL_CHECK_LABELS.find((c) => c.id === id);
      console.log(`  ${padEnd(id, 30)}  ${count}  (${checkLabel ? checkLabel.label : id})`);
    }
  }

  console.log(DIVIDER);
  process.exit(1);
}

run();
