# ADR-005: Shared-credential admin authentication

- Status: Accepted
- Date: 2026-08-13
- Deciders: Engineering (2-person team)
- Relates: ADR-002 (no auth for MVP readers)

## Context

Editorial review requires protected write APIs. Per-editor accounts are out of scope for v1. The ingest machine path already uses a shared `X-Ingest-Key`.

## Decision

- Readers remain unauthenticated (ADR-002 unchanged).
- Editors use a single shared password (`Admin:Password`) plus a free-text display name at login.
- Successful login returns an HS256 JWT (8 hours) with `sub=admin` and `name=<displayName>`.
- All `/api/admin/*` routes except login require Bearer JWT.
- `X-Ingest-Key` remains only for `POST /api/ingest/rss` and is not accepted on admin routes.
- Login is rate-limited (5 / IP / minute).

## Consequences

- Attribution uses JWT display name in `ReviewedBy`, not a user table.
- Rotate password/signing key via env (Render secrets); never commit real values.
- Multi-editor accounts can replace this later without changing the public feed contract.
