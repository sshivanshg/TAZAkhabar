/**
 * Shared helpers for the Khabro agent hooks: per-conversation session logs under
 * docs/sessions/YYYY-MM-DDTHH-MM-SS.md (Goal / Activity / Summary), stdin parsing,
 * secret redaction and hook output.
 */
import { createHash } from 'node:crypto';
import { existsSync, linkSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const VALID_SESSION_KEY = /^[A-Za-z0-9_-]{1,128}$/;

export function getRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.env.CURSOR_PROJECT_DIR || process.cwd();
}

export function getSessionsDir(root) {
  return join(root, 'docs', 'sessions');
}

export async function readHookInput() {
  try {
    const raw = await new Response(process.stdin).text();
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Cursor also executes .claude/settings.json hooks, which pass --claude. Cursor already
// runs .cursor/hooks.json for the same event, so the Claude copy must not log twice.
export function skipIfCursorRunningClaudeHooks(input) {
  if (process.argv.includes('--claude') && (input.cursor_version || process.env.CURSOR_VERSION)) {
    done();
  }
}

// Cursor sends conversation_id, Claude Code sends session_id. An ID that is not a safe
// file name is hashed rather than dropped, so it never falls back to the shared pointer.
function sessionKey(input) {
  const raw = [input.conversation_id, input.session_id].find((value) => typeof value === 'string' ? value !== '' : typeof value === 'number');
  if (raw === undefined) return '';
  const key = String(raw);
  return VALID_SESSION_KEY.test(key) ? key : `h${createHash('sha256').update(key).digest('hex').slice(0, 32)}`;
}

function pointerPaths(root, input) {
  const hooksDir = join(root, '.cursor/hooks');
  const key = sessionKey(input);
  return {
    perSession: key ? join(hooksDir, '.sessions', key) : null,
    latest: join(hooksDir, '.current-session'),
  };
}

export function rememberSessionLog(root, input, logFile) {
  const { perSession, latest } = pointerPaths(root, input);
  if (perSession) {
    mkdirSync(join(root, '.cursor/hooks/.sessions'), { recursive: true });
    writeFileSync(perSession, logFile);
  }
  writeFileSync(latest, logFile);
}

// Exclusive create: two sessions starting in the same second never share or truncate a file.
function writeNewFile(base, contents) {
  for (let n = 1; ; n += 1) {
    const file = n === 1 ? `${base}.md` : `${base}-${n}.md`;
    try {
      writeFileSync(file, contents, { flag: 'wx' });
      return file;
    } catch (error) {
      if (error.code !== 'EEXIST' || n >= 100) throw error;
    }
  }
}

function buildSessionLog(root, input, note) {
  const sessionsDir = getSessionsDir(root);
  mkdirSync(sessionsDir, { recursive: true });

  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const tool = input.hook_event_name === 'SessionStart' || process.argv.includes('--claude') ? 'Claude Code' : 'Cursor';
  const id = sessionKey(input);
  const suffix = id ? `-${id.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)}` : '';

  const lines = [
    `# Session ${stamp}`,
    '',
    `**Started:** ${now.toISOString()}`,
    `**Workspace:** ${root}`,
    `**Tool:** ${tool}`,
    '',
  ];
  if (id) lines.push(`**Conversation ID:** ${id}`, '');
  if (input.model) lines.push(`**Model:** ${oneLine(input.model, 80)}`, '');
  lines.push(
    '## Goal',
    '',
    '<!-- Agent: one or two sentences on what this session is for -->',
    '',
    '## Activity',
    '',
    `- ${now.toISOString()} — ${note}`,
    '',
  );

  const logFile = writeNewFile(join(sessionsDir, `${stamp}${suffix}`), lines.join('\n'));
  return { logFile, tool };
}

export function createSessionLog(root, input, { note = 'session started' } = {}) {
  const session = buildSessionLog(root, input, note);
  rememberSessionLog(root, input, session.logFile);
  return session;
}

function readPointer(pointer) {
  if (!existsSync(pointer)) return null;
  const logFile = readFileSync(pointer, 'utf8').trim();
  return logFile && existsSync(logFile) ? logFile : null;
}

// Parallel hooks of one new conversation race here; a hard link claims the pointer
// atomically, and losers discard their file and use the winner's.
function claimSessionLog(root, input, perSession) {
  const session = buildSessionLog(root, input, 'session log created on first activity (no session start event)');
  mkdirSync(join(root, '.cursor/hooks/.sessions'), { recursive: true });
  const temp = `${perSession}.${process.pid}.tmp`;
  writeFileSync(temp, session.logFile);
  try {
    if (existsSync(perSession) && !readPointer(perSession)) unlinkSync(perSession);
    linkSync(temp, perSession);
    return session.logFile;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    unlinkSync(session.logFile);
    return readPointer(perSession);
  } finally {
    unlinkSync(temp);
  }
}

// Parallel chats and subagents run at once. A conversation with an ID always logs to its
// own file; the shared latest pointer is only for hook inputs that carry no ID.
export function findSessionLog(root, input, { create = true } = {}) {
  const { perSession, latest } = pointerPaths(root, input);
  const logFile = readPointer(perSession || latest);
  if (logFile || !perSession || !create) return logFile;
  try {
    return claimSessionLog(root, input, perSession);
  } catch {
    return null;
  }
}

const SECRET_PATTERNS = [
  /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{8,}/g,
  /\bwhsec_[A-Za-z0-9]{8,}/g,
  /\bpat[A-Za-z0-9]{10,}\.[A-Za-z0-9]{20,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /((?:password|passwd|secret|token|api[_-]?key)\s*[=:]\s*)\S+/gi,
];

export function redact(text) {
  return SECRET_PATTERNS.reduce(
    (out, pattern) => out.replace(pattern, (match, prefix) =>
      typeof prefix === 'string' && /[=:]\s*$/.test(prefix) ? `${prefix}[REDACTED]` : '[REDACTED]'),
    String(text),
  );
}

export function oneLine(text, max) {
  const flat = redact(text).replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

export function done(output = {}) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exit(0);
}
