---
name: khabro-admin
description: Implement or review the Khabro Vite editorial admin SPA at apps/admin (review queue, sources, uploads, live ingest view, shared-password JWT auth).
---

# Khabro Admin

Atlas: [05-admin.md](../../../docs/architecture/05-admin.md); ADRs 005 and 006 in `docs/adr/`.

- Vite + React SPA: `apps/admin/src/` (`pages/`, `components/`, `live/`, `api.ts`, `auth.ts`, `theme.ts`). Internal tool, not a reader.
- Auth: shared admin password -> JWT from `AdminAuthEndpoints`; token handling in `auth.ts`. Never persist the password.
- All HTTP through `api.ts` using shared-types; live ingest via SSE from the API event bus.
- Deployed to Pages `newsfeed-admin` (admin.khabro.in) by `deploy.yml`.

## Verify
`pnpm build:admin`; dev `pnpm dev:admin` (5173).
