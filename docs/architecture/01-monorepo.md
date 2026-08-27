# Monorepo

> **Living doc** — update when workspace packages, root scripts, or layout change.  
> **Last verified against:** 2026-08-27 (local Gradle `pnpm build:apk` plus public marketing site package)

## Purpose

Describe package layout, tooling, and boundaries so API / types / clients stay coordinated in one repo.

## Boundaries

- **In scope:** `apps/*`, `packages/*`, `infra/*`, root scripts, solution file, pnpm workspace.
- **Out of scope:** Per-feature folder trees inside an app (see subsystem pages).

## Context diagram

```mermaid
flowchart TB
  root[TazaKhabar monorepo]
  root --> app[apps/app<br/>Expo reader]
  root --> site[apps/site<br/>Vite marketing site]
  root --> admin[apps/admin<br/>Vite admin]
  root --> api[apps/api<br/>.NET 8]
  root --> tests[apps/api.Tests]
  root --> shared[packages/shared-types]
  root --> docker[infra/docker]
  root --> mig[infra/migrations]
  api --> mig
  app --> shared
  admin --> shared
  shared -.->|OpenAPI snapshot| api
```

## Components / key types

| Path | Package / project | Role |
|------|-------------------|------|
| `apps/app` | `@tazakhabar/app` | Expo universal reader |
| `apps/site` | `@tazakhabar/site` | Public marketing + legal site |
| `apps/admin` | `@tazakhabar/admin` | Editorial Vite SPA |
| `apps/api` | `TazaKhabar.Api` | Minimal API |
| `apps/api.Tests` | `TazaKhabar.Api.Tests` | xUnit + WebApplicationFactory |
| `packages/shared-types` | `@tazakhabar/shared-types` | Generated TS DTOs |
| `infra/docker` | — | `Dockerfile.api`, optional `Dockerfile.web` |
| `infra/migrations` | `TazaKhabar.Api.Migrations` (legacy namespace) | EF migrations compiled into API |
| `TazaKhabar.sln` | — | API + tests |
| `pnpm-workspace.yaml` | — | `apps/app`, `apps/site`, `apps/admin`, `packages/*` |

## Data & control flows

Root scripts (see root `package.json`):

| Script | Does |
|--------|------|
| `pnpm prepare` | Sets `core.hooksPath` to `.githooks` (local git hooks) |
| `pnpm dev:web` | Expo web reader |
| `pnpm build:web` | `expo export -p web` → `apps/app/dist` |
| `pnpm build:apk` | Expo prebuild + Gradle `assembleRelease` → sideload APK under `apps/app/android/` |
| `pnpm lint:app` | Expo app `tsc --noEmit` |
| `pnpm dev:site` | Marketing site |
| `pnpm build:site` | Vite build → `apps/site/dist` |
| `pnpm dev:admin` | Vite admin |
| `pnpm generate:types` | NSwag generate from OpenAPI snapshot |
| `pnpm dev:api` / `dotnet run` | API |
| `pnpm test:api` / `dotnet test` | Backend tests |

### Local gates (catch broken builds before push / agent “done”)

| Gate | Location | Runs |
|------|----------|------|
| Cursor agent verify | `.cursor/hooks/verify-build.py` via `afterFileEdit` + `stop` in `.cursor/hooks.json` | Marks dirty packages on edit; on agent stop runs `pnpm lint:app`, admin `tsc -b`, and/or `dotnet build` and follow-ups on failure |
| Git pre-push | `.githooks/pre-push` | Same package-scoped checks for commits being pushed |

After clone: `pnpm install` (runs `prepare`) so git uses `.githooks`.

Local stack: Docker Postgres ↔ API ↔ Metro/Expo + Vite admin.

## Key files

- `package.json`, `pnpm-workspace.yaml`
- `.githooks/pre-push`
- `.cursor/hooks.json`, `.cursor/hooks/verify-build.py`
- `TazaKhabar.sln`
- `docker-compose.yml`
- `apps/README.md`
- `.cursor/rules/architecture.mdc`

## Public contracts

Workspace consumers depend on `@tazakhabar/shared-types`. Contract changes require **same PR**: API OpenAPI + snapshot + generated types + app/admin consumers.

## Failure modes & invariants

- No Turborepo/Nx until CI build time hurts ([ADR-001](../adr/001-monorepo.md)).
- Do not add a separate Vite/CRA **reader** — only admin is the Vite exception ([ADR-003](../adr/003-expo-universal-client.md), [ADR-006](../adr/006-internal-admin-spa.md)).
- Never edit applied EF migrations; add new ones under `infra/migrations`.

## Related docs

- [00-system-overview](./00-system-overview.md)
- [ADR-001](../adr/001-monorepo.md)

## Change checklist

| When you change… | Update… |
|------------------|---------|
| Add/remove app or package | This page + hub + [00-system-overview](./00-system-overview.md) + `architecture.mdc` |
| Root scripts / workspace globs | This page |
