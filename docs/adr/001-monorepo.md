# ADR-001: Monorepo instead of multiple repositories

- Status: Accepted
- Date: 2026-08-03
- Deciders: Engineering (2-person team)

## Context

We are building a localized news summarization product with a .NET 8 API and a universal Expo client (web + native). Shared contracts (DTOs / OpenAPI types) must stay in sync. With only two engineers, coordinating changes across separate repos adds PR overhead and versioning drift with little isolation benefit.

## Decision

Use a single monorepo with:

- `apps/app` — Expo universal client (React Native Web for MVP hosting; iOS/Android later)
- `apps/api` — .NET 8 Web API
- `packages/shared-types` — TypeScript types generated from the API OpenAPI document

Tooling: pnpm workspaces for JS packages. No Turborepo/Nx until CI build time becomes a real problem.

> **Update (ADR-003):** The original note deferred React Native. We now use Expo from day one so web and native share one UI.

## Consequences

- One PR can update API + shared types + Expo app together (required for contract changes).
- CI must build/test both stacks on every PR.
- Clone and local setup are slightly heavier; mitigated by clear README and docker-compose.
- Native store builds use the same `apps/app` (EAS) — no second UI codebase.
