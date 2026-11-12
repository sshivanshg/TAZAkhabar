#!/usr/bin/env node
/**
 * Session start hook (Cursor sessionStart / Claude Code SessionStart)
 * Creates docs/sessions/<timestamp>.md
 */
import { relative } from 'node:path';
import {
  createSessionLog, done, getRoot, readHookInput, skipIfCursorRunningClaudeHooks,
} from './session-context.mjs';

const ROOT = getRoot();
const input = await readHookInput();
skipIfCursorRunningClaudeHooks(input);

const { logFile, tool } = createSessionLog(ROOT, input);

const note = [
  `This session is logged to ${relative(ROOT, logFile)}; fill in its Goal and finish with a "## Summary" section (see AGENTS.md).`,
  'Record durable decisions as ADRs under docs/adr/.',
  'Route substantial apps/, packages/ or infra/ work to the khabro-* subagents yourself (table in .codex/rules/khabro-quality-shield.mdc) and run the matching khabro-* reviewers before finishing.',
].join(' ');

if (tool === 'Claude Code') {
  done({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: note } });
}
done({ additional_context: note });
