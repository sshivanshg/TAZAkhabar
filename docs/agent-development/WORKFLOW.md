# Agent development workflow

This workflow covers the whole Khabro monorepo: the .NET API (`apps/api`,
tests in `apps/api.Tests`), the Expo reader (`apps/app`, web + native), the
admin SPA (`apps/admin`), the marketing site (`apps/site`), the generated
contract package (`packages/shared-types`) and infrastructure (`infra/`).
[AGENTS.md](../../AGENTS.md) and `.codex/rules/` stay authoritative; this file
describes how an agent moves a task from request to `qa`.

## First checkout

Node 20+ and pnpm (see `package.json` `engines`/`packageManager`) plus the .NET
SDK used by `TazaKhabar.sln`. From the repository root:

```bash
pnpm install          # also runs `prepare`, which configures the git hooks
dotnet restore TazaKhabar.sln
docker compose config # sanity-check the local Postgres stack in infra/docker
```

Local `.env` files are never read by agents (`.claude/settings.json` denies it);
copy `*.example` templates by hand.

## Scope the work

Read AGENTS.md, inspect `git status`, and identify the surface. For anything
beyond a quick fix, `khabro-git-steward` creates or reuses a GitHub issue
(`gh issue create` / `gh issue view`) and keeps it updated with progress,
blockers, verification evidence, review verdicts and the commit/PR link. No
secrets or private data in issues. For a substantial feature copy
[TASK_TEMPLATE.md](TASK_TEMPLATE.md) into the issue body or `docs/sessions/`.
Give each acceptance criterion an observable pass/fail signal.

Start with `khabro-feature-delivery`, then load only the skills for the surface:

| Surface | Skills |
| --- | --- |
| Reader app (`apps/app`) | `khabro-reader-app`, `khabro-ui-system`, `khabro-api-contracts` |
| Admin / site (`apps/admin`, `apps/site`) | `khabro-admin`, `khabro-ui-system` |
| API (`apps/api`) | `khabro-backend`, `khabro-database`, `khabro-security`, `khabro-api-contracts` |
| Feed ingestion (scheduled/nightly ingest workflows) | `khabro-ingestion`, `khabro-observability` |
| Architecture or new dependency | `khabro-architecture`, `khabro-architecture-review`, `documentation-and-adrs` |
| Deploys, env vars, promotion | `khabro-environments`, `khabro-release` |

## Implement and verify

Read the relevant code and tests before changing behaviour. For a defect,
reproduce it and add a regression test (`khabro-test-engineer`, failing test
first). Contract changes regenerate types in the same change
(`pnpm generate:types`).

Verification commands (all from `package.json`):

| Change touches | Run |
| --- | --- |
| `apps/api`, `infra/migrations` | `pnpm test:api` (`dotnet test TazaKhabar.sln`), `pnpm build:api` |
| `apps/app` | `pnpm lint:app`, `pnpm test:app`, `pnpm build:web` |
| `apps/admin` | `pnpm build:admin` |
| `apps/site` | `pnpm build:site` |
| OpenAPI / `packages/shared-types` | `pnpm generate:types`, then the consumers' builds above |

For a UI change, run it (`pnpm dev:web`, `pnpm dev:admin`, `pnpm dev:site`) and
check loading, empty, error and narrow-screen states. Record what was actually
observed; do not claim a check that was not run. EF migrations are generated
with `dotnet ef migrations add` but never applied by an agent
(`dotnet ef database update` is denied); production runs via the
`migrate-production.yml` workflow.

## Parallel agents

Give each agent a disjoint set of files and a concrete deliverable. For larger
independent changes use a worktree under `.worktrees/` (gitignored) cut from
`origin/qa`. The coordinator integrates and runs the combined verification.
Never put two agents on the same mutable file or database.

## Independent review

After any non-trivial change under `apps/`, `packages/` or `infra/`, the
coordinator spawns fresh reviewers in parallel (routing in
[khabro-quality-shield](../../.codex/rules/khabro-quality-shield.mdc)). Give them
the task, diff, source and acceptance criteria, not the author's conclusion. The
author never approves their own diff; no hand-off with Critical or Required
findings open. The review gate hook (`.cursor/hooks/review-gate.mjs`) enforces
this at the end of a turn.

## Branches, CI and deploys

| Branch | Role | Moves by |
| --- | --- | --- |
| `qa` | Integration + QA environment. `deploy-qa.yml` publishes the `qa` Cloudflare Pages preview; Render QA services follow `render.yaml` | Direct commits for routine work (AGENTS.md), or PRs into `qa` (`gh pr create --base qa`) for larger/agent-team work |
| `main` | Production: reader `newsfeed-web` at khabro.in, `newsfeed-admin`, `khabro-site` on Cloudflare Pages; API on Render (`deploy.yml`) | Only the **Promote QA to production** workflow (`promote-qa.yml`, fast-forward). Direct pushes to `main` are denied |

`ci.yml` runs lint, tests and builds; a red CI blocks promotion.
`khabro-ops-watcher` verifies deploys and health after a push; it redeploys only
when asked. `khabro-platform-engineer` changes CI/Render/Pages config.

## Finish with evidence

Fill the session file's Summary (`docs/sessions/`), record durable decisions as
an ADR in `docs/adr/`, update `docs/architecture/` pages or state N/A, update the
GitHub issue via `khabro-git-steward`, then commit with a Conventional Commit
message and push `qa` (or open the PR into `qa`).
See [TOOLS.md](TOOLS.md) for the tool setup.
