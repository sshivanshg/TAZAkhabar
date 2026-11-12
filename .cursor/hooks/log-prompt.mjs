#!/usr/bin/env node
/**
 * Prompt hook (Cursor beforeSubmitPrompt / Claude Code UserPromptSubmit)
 * Appends the user's prompt (redacted, truncated) to the active session log.
 */
import { appendFileSync } from 'node:fs';
import {
  done, findSessionLog, getRoot, oneLine, readHookInput, skipIfCursorRunningClaudeHooks,
} from './session-context.mjs';

const ROOT = getRoot();
const input = await readHookInput();
skipIfCursorRunningClaudeHooks(input);

const logFile = findSessionLog(ROOT, input);
const prompt = input.prompt || input.user_prompt || '';

if (logFile && prompt) {
  appendFileSync(logFile, `- ${new Date().toISOString()} — **Prompt:** ${oneLine(prompt, 600)}\n`);
}

if (input.hook_event_name === 'UserPromptSubmit') done({});
done({ continue: true });
