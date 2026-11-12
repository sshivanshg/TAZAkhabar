#!/usr/bin/env node
/**
 * Review gate (Cursor stop + subagentStop / Claude Code Stop + PostToolUse Task).
 *
 *   review-gate.mjs record  — a reviewer subagent finished: remember the diff it saw.
 *   review-gate.mjs stop    — the agent is about to stop: if app code changed since the
 *                             last review, send it back to run the right khabro-* reviewers.
 *
 * The fingerprint covers committed branch work and the working tree under the gated paths,
 * so committing before stopping does not skip the review.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { done, getRoot, readHookInput, skipIfCursorRunningClaudeHooks } from './session-context.mjs';

export const GATED = ['apps/', 'packages/', 'infra/', '.github/workflows/', 'render.yaml', '.cursor/hooks/'];
const IGNORED = /(\.md|\.mdx|\/docs\/.*)$|^\.cursor\/hooks\/\.sessions\/|(^|\/)(dist|\.expo|bin|obj)\//;
export const MIN_CHANGED_LINES = 10;
const BASE_REFS = ['origin/qa', 'origin/main'];

export const REVIEWERS = [
  { agent: 'khabro-code-reviewer', why: 'every non-trivial change', match: () => true },
  {
    agent: 'khabro-security-reviewer',
    why: 'admin auth, CORS, rate limits, secrets, untrusted feed content, CI or deploy config',
    match: (f) => /apps\/admin\/|Admin|Cors|RateLimit|Program\.cs$|appsettings.*\.json$|Ingest|Sanitiz|\.github\/workflows\/|render\.yaml|infra\/docker\/|\.env/.test(f),
  },
  {
    agent: 'khabro-performance-reviewer',
    why: 'queries, migrations, ingestion or feed rendering',
    match: (f) => /infra\/migrations\/|Migrations\/|Repository\.cs$|Service\.cs$|DbContext\.cs$|Ingest|apps\/app\/.*(Feed|List|Screen).*\.tsx$/.test(f),
  },
  {
    agent: 'khabro-architecture-reviewer',
    why: 'dependencies, contracts, build or module boundaries',
    match: (f) => /(^|\/)(package\.json|pnpm-workspace\.yaml|app\.json|eas\.json|.*\.csproj|.*\.sln)$|packages\/shared-types\/|infra\/migrations\/|openapi/i.test(f),
  },
  {
    agent: 'khabro-ux-engineer',
    why: 'user-facing screens or UI primitives',
    match: (f) => /apps\/(app|admin|site)\/.*\.tsx$/.test(f),
  },
  {
    agent: 'khabro-design-director',
    why: 'visual and motion quality against docs/brand.md',
    match: (f) => /apps\/(app|admin|site)\/.*\.(tsx|css)$/.test(f),
  },
];

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : null;
}

function base(root) {
  for (const ref of BASE_REFS) {
    const mergeBase = git(root, ['merge-base', 'HEAD', ref]);
    if (mergeBase) return mergeBase.trim();
  }
  return 'HEAD';
}

export function changedState(root) {
  const from = base(root);
  const tracked = (git(root, ['diff', '--name-only', from, '--', ...GATED]) || '').split('\n');
  const untracked = (git(root, ['ls-files', '--others', '--exclude-standard', '--', ...GATED]) || '').split('\n');
  const files = [...new Set([...tracked, ...untracked])].filter((f) => f && !IGNORED.test(f)).sort();
  if (!files.length) return { files, lines: 0, fingerprint: null };

  const trackedFiles = files.filter((f) => !untracked.includes(f));
  // An empty pathspec would diff the whole repository.
  const diff = trackedFiles.length ? git(root, ['diff', from, '--', ...trackedFiles]) || '' : '';
  const hash = createHash('sha256').update(diff);
  let lines = diff.split('\n').filter((l) => /^[+-](?![+-])/.test(l)).length;
  for (const file of files.filter((f) => untracked.includes(f))) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path);
    hash.update(file).update(text);
    lines += text.toString('utf8').split('\n').length;
  }
  return { files, lines, fingerprint: hash.digest('hex') };
}

export function reviewersFor(files) {
  return REVIEWERS.filter((r) => files.some((f) => r.match(f)));
}

function stateFile(root) {
  return join(root, '.cursor/hooks/.sessions/review-gate.json');
}

function readState(root) {
  try {
    return JSON.parse(readFileSync(stateFile(root), 'utf8'));
  } catch {
    return {};
  }
}

function writeState(root, state) {
  mkdirSync(join(root, '.cursor/hooks/.sessions'), { recursive: true });
  writeFileSync(stateFile(root), JSON.stringify(state));
}

export function isReviewer(input) {
  const args = input.tool_input || {};
  const reviewers = new Set(REVIEWERS.map((r) => r.agent));
  const named = (v) => typeof v === 'string' && v.trim() !== '';
  const agent = [input.subagent_type, args.subagent_type].find(named);
  if (agent !== undefined) return reviewers.has(agent.trim());
  // Payloads without an agent type: only a description that is exactly a reviewer name counts.
  const description = [input.description, args.description].find(named);
  return description !== undefined && reviewers.has(description.trim());
}

export function followUp(state) {
  const needed = reviewersFor(state.files);
  const list = needed.map((r) => `- \`${r.agent}\` (${r.why})`).join('\n');
  return [
    'Review gate: app code changed since the last independent review',
    `(${state.files.length} files, ~${state.lines} changed lines). Before finishing, spawn these`,
    'reviewers in parallel as fresh subagents (give them the task, the diff and the acceptance',
    'criteria, not your conclusions), fix every Critical/Required finding, rerun the affected',
    'checks, and report the verdicts:',
    list,
    'If this change is trivial or already reviewed, say so explicitly and stop.',
  ].join('\n');
}

export function decide(root, input, mode) {
  const state = changedState(root);
  const saved = readState(root);
  if (mode === 'record') {
    if (isReviewer(input) && state.fingerprint) writeState(root, { ...saved, reviewed: state.fingerprint });
    return null;
  }
  const looping = input.stop_hook_active === true || (typeof input.loop_count === 'number' && input.loop_count > 0);
  if (looping || (input.status && input.status !== 'completed')) return null;
  if (!state.fingerprint || state.lines < MIN_CHANGED_LINES) return null;
  if (saved.reviewed === state.fingerprint || saved.prompted === state.fingerprint) return null;
  writeState(root, { ...saved, prompted: state.fingerprint });
  return followUp(state);
}

function isMain() {
  try {
    return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (isMain()) {
  const input = await readHookInput();
  skipIfCursorRunningClaudeHooks(input);
  const mode = process.argv.includes('record') ? 'record' : 'stop';
  const message = decide(getRoot(), input, mode);
  if (!message) done();
  if (process.argv.includes('--claude')) done({ decision: 'block', reason: message });
  done({ followup_message: message });
}
