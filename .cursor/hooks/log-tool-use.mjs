#!/usr/bin/env node
/**
 * Post tool use hook (Cursor postToolUse / Claude Code PostToolUse)
 * Appends significant tool calls to the active session log.
 */
import { appendFileSync } from 'node:fs';
import { relative } from 'node:path';
import {
  done, findSessionLog, getRoot, oneLine, readHookInput, skipIfCursorRunningClaudeHooks,
} from './session-context.mjs';

const ROOT = getRoot();

const LOGGABLE = new Set([
  // Cursor
  'Shell', 'Write', 'StrReplace', 'Delete', 'EditNotebook', 'CallMcpTool', 'Task',
  // Claude Code
  'Bash', 'Edit', 'MultiEdit', 'NotebookEdit',
]);

const input = await readHookInput();
skipIfCursorRunningClaudeHooks(input);
const tool = input.tool_name || input.tool || input.name || '';
if (!LOGGABLE.has(tool) && !tool.startsWith('mcp__')) done();

const logFile = findSessionLog(ROOT, input);
if (!logFile) done();

const args = input.tool_input || input.input || input.arguments || {};
const path = args.path || args.file_path || args.notebook_path || '';
let detail = '';

if (tool === 'Shell' || tool === 'Bash') detail = args.command || args.description || '';
else if (path) detail = path.startsWith(ROOT) ? relative(ROOT, path) : path;
else if (tool === 'Task') detail = args.description || args.subagent_type || '';
else if (tool === 'CallMcpTool') detail = `${args.server || ''}/${args.toolName || ''}`.replace(/^\//, '');
else if (tool.startsWith('mcp__')) detail = tool;
else detail = JSON.stringify(args);

const line = `- ${new Date().toISOString()} — **${tool}**${detail ? `: \`${oneLine(detail, 200).replace(/`/g, "'")}\`` : ''}\n`;
appendFileSync(logFile, line);

done();
