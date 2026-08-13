# ADR-006: Internal admin SPA (exception to ADR-003)

- Status: Accepted
- Date: 2026-08-13
- Deciders: Engineering (2-person team)
- Relates: ADR-003 (Expo universal reader client), ADR-005 (admin shared credential)

## Context

ADR-003 requires a single Expo client for the **reader** product (web + native). Editorial tooling needs a dense internal UI (tables, forms, review queue) that does not belong in the reader app and should not ship to public PWA users.

## Decision

Add `apps/admin` as a separate Vite + React + TypeScript SPA for editors only.

- Separate package and deploy origin from `apps/app`
- Reuses `packages/shared-types` for API contracts
- May copy **token values** (colors/spacing) from the reader theme for consistency; own components (tables/forms), not reader cards
- Auth: shared admin password + JWT (ADR-005)

ADR-003 still governs the public NewsFeed client. This ADR is a narrow exception for an internal tool.

## Consequences

- CORS must allowlist the admin origin (localhost:5173 in dev; production origin when deployed)
- CI may build admin separately; reader Expo web export unchanged
- Do not add admin routes inside `apps/app`
