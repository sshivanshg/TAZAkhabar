---
name: khabro-backend
description: Implement or review Khabro .NET 8 Minimal API code: endpoints, services, options, hosted services/workers, validation, logging and tests under apps/api.
---

# Khabro Backend

Rules: [.codex/rules/backend-conventions.mdc](../../../.codex/rules/backend-conventions.mdc), [security.mdc](../../../.codex/rules/security.mdc), atlas [02-api.md](../../../docs/architecture/02-api.md).

## Current backend
- .NET 8 (`global.json`), `apps/api/TazaKhabar.Api.csproj` (namespace `NewsFeed.Api`), wiring in `apps/api/Program.cs`.
- Folders: `Endpoints/` (articles, cities, admin articles/auth/sources/uploads, ingest, maintenance, notifications), `Services/`, `Ingest/`, `Data/` (EF `AppDbContext`, entities, enums, seed catalogs), `Options/`, `Dtos/`.
- Health: `/healthz`. Config through env vars + typed options (`ConnectionStrings__Database`, `Admin__*`, `RssIngest__Secret`, `IngestSchedule__*`, ...).

## Conventions
- Minimal APIs, async I/O, validate all input (`AdminValidation`), ProblemDetails errors.
- Serilog structured logging only; never log secrets, tokens or full article bodies.
- Rate-limit public endpoints (`RateLimiting__*`); CORS allowlist from config (`CorsOrigin.cs`), never `*`.
- Admin endpoints require the admin JWT; ingest endpoints require `IngestKeyAuth`.
- Schema changes: [khabro-database](../khabro-database/SKILL.md). Contract changes: [khabro-api-contracts](../khabro-api-contracts/SKILL.md).

## Verify
`dotnet format --verify-no-changes TazaKhabar.sln` (CI format gate), `pnpm test:api` (`dotnet test TazaKhabar.sln`), `pnpm build:api`.
