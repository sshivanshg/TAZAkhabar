---
name: khabro-api-contracts
description: Change or review a Khabro API request/response, OpenAPI document or packages/shared-types. Use whenever an endpoint, DTO or consumer type changes.
---

# Khabro API Contracts

Source: [docs/architecture/02-api.md](../../../docs/architecture/02-api.md), [07-shared-types.md](../../../docs/architecture/07-shared-types.md).

1. Change the endpoint in `apps/api/Endpoints/` and DTO in `apps/api/Dtos/`; document it so OpenAPI stays complete.
2. Errors are ProblemDetails (RFC 7807); never raw exception text.
3. Regenerate: run the API, then `pnpm generate:types` (NSwag via `packages/shared-types/scripts/generate.mjs`; `nswag.json` -> `src/generated.ts`, snapshot in `packages/shared-types/openapi/`). Never hand-edit `generated.ts`.
4. Update consumers (`apps/app/src/api/`, `apps/admin/src/api.ts`) in the same change.
5. CI (`.github/workflows/ci.yml`) runs an OpenAPI drift check; keep it green.
6. Add/adjust endpoint tests in `apps/api.Tests` via `TazaKhabarWebApplicationFactory`.
7. Update `docs/architecture/02-api.md` and `07-shared-types.md`.
