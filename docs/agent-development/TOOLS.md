# Tools and skills for this repository

One primary coding agent with the repository's executable checks, plus fresh
independent reviewers when the change warrants it. Claude Code, Codex and
Cursor all read the same rules and skills.

## What is configured in Git

| Tool/surface | Entry point | How to use it |
| --- | --- | --- |
| Claude Code | [CLAUDE.md](../../CLAUDE.md), `.claude/agents/khabro-*.md`, `.claude/skills` (symlinks into `.agents/skills`), `.claude/settings.json` (permissions + hooks) | Open the repo; the coordinator routes to `khabro-*` subagents |
| Codex | [AGENTS.md](../../AGENTS.md), `.codex/rules/`, `.codex/hooks.json` | Same rules; skills from `.agents/skills` |
| Cursor | `.cursor/rules/`, `.cursor/hooks.json` | Same rules and hooks |
| Every agent | [WORKFLOW.md](WORKFLOW.md), root `pnpm` scripts | Same setup and verification commands |
| GitHub | `.github/workflows/` (`ci.yml`, `deploy-qa.yml`, `promote-qa.yml`, `deploy.yml`, ingest jobs) | CI evidence and promotion; issues via `gh` |

## Hooks

`.cursor/hooks/*.mjs` run for both Claude Code (via `.claude/settings.json`,
with `--claude`) and Cursor (via `.cursor/hooks.json`); Cursor skips the Claude
copies to avoid double logging.

| Hook | Event | Effect |
| --- | --- | --- |
| `log-session-start.mjs` | session start | Creates `docs/sessions/<timestamp>.md` (Goal / Activity / Summary) and injects routing context |
| `log-prompt.mjs` | prompt submit | Appends the redacted prompt |
| `log-tool-use.mjs` | after shell/edit/MCP/Task calls | Appends a one-line activity entry |
| `log-session-stop.mjs` | stop | Appends a stop marker and a Summary placeholder |
| `review-gate.mjs` | stop + after Task/Agent | Blocks finishing once if ≥10 lines under `apps/`, `packages/`, `infra/`, workflows or `render.yaml` changed since the last `khabro-*` reviewer ran |
| `session-context.mjs` | (library) | Session file, pointer and redaction helpers |

Runtime pointers live in `.cursor/hooks/.current-session` and
`.cursor/hooks/.sessions/` (gitignored). The older `session-store.py` and
`verify-build.py` Cursor hooks keep running alongside.

## Hosted services

Render (API), Cloudflare Pages (`newsfeed-web`, `newsfeed-admin`,
`khabro-site`) and Neon (Postgres) are inspected through their logged-in CLIs or
MCP servers by `khabro-ops-watcher` / `khabro-sre`. Keep tokens out of the
repository; use platform secrets.

## Adding tools

Add a tool or skill when a concrete task shows the need. `khabro-skill-curator`
captures repeated procedures as skills and wires each one to an agent.
