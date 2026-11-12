@AGENTS.md

The repository skills in `.claude/skills/` route to `.agents/skills/` (symlinks).
Use the canonical instructions and verification commands there; `.codex/rules/*.mdc`
remain the project rules. Project subagents live in `.claude/agents/khabro-*.md`.
Khabro has no Linear project: track work on the `qa` branch and GitHub issues
(`khabro-git-steward`). Do not put secrets or env values in commits, issues or PR notes.
