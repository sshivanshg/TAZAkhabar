#!/usr/bin/env node
/**
 * Stop hook (Cursor stop / Claude Code Stop) — fires at the end of every agent turn.
 * Appends a stop marker and, once per session, a Summary placeholder.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import {
  done, findSessionLog, getRoot, readHookInput, skipIfCursorRunningClaudeHooks,
} from './session-context.mjs';

const ROOT = getRoot();
const input = await readHookInput();
skipIfCursorRunningClaudeHooks(input);

const logFile = findSessionLog(ROOT, input, { create: false });
if (!logFile) done();

const status = input.status || input.reason || 'completed';
const hasSummary = /^## Summary/m.test(readFileSync(logFile, 'utf8'));

appendFileSync(
  logFile,
  `- ${new Date().toISOString()} — agent stopped (${status})\n` +
    (hasSummary
      ? ''
      : '\n## Summary\n\n<!-- Agent: fill in goal, changes, verification, open items before ending -->\n\n'),
);

done();
