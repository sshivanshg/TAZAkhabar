---
name: khabro-architecture
description: Map of the Khabro system (Expo reader, Vite admin, .NET 8 API, Neon Postgres, ingestion, hosting). Use before any structural, cross-app or product-scope change.
---

# Khabro Architecture

Read [AGENTS.md](../../../AGENTS.md), [.codex/rules/architecture.mdc](../../../.codex/rules/architecture.mdc),
[docs/PRD.md](../../../docs/PRD.md) and the atlas hub [docs/architecture/README.md](../../../docs/architecture/README.md).

## Shape
- `apps/app` Expo universal reader (web via React Native Web on Cloudflare Pages `newsfeed-web` / khabro.in; native later, EAS profiles in `apps/app/eas.json`).
- `apps/admin` Vite editorial SPA (ADR-006) on Pages `newsfeed-admin` / admin.khabro.in.
- `apps/site` marketing site (ADR-007) on Pages `khabro-site`.
- `apps/api` .NET 8 Minimal API, the only database client (Neon Postgres via EF Core). Render web `tazakhabar-api`.
- `apps/api.Tests` xUnit; `infra/migrations` EF Core migrations; `packages/shared-types` NSwag-generated TS.

## Hard boundaries
- API is the only thing that talks to Postgres.
- No reader auth for MVP (ADR-002). Admin = shared password + JWT (ADR-005).
- One reader codebase (ADR-003); no separate Vite/CRA reader.
- Contract change = API + OpenAPI snapshot + `pnpm generate:types` + consumers in one change.
- Hosting/auth/data-ownership/monorepo changes need an ADR in `docs/adr/`.

## Atlas upkeep
Same change must update the matching `docs/architecture/0x-*.md` page and bump "Last verified against" (mapping in AGENTS.md "Architecture Docs").
