# ADR-002: No authentication for MVP

- Status: Accepted
- Date: 2026-08-03
- Deciders: Engineering (2-person team)

## Context

The MVP is a localized news feed reached primarily via QR flyers. The goal is fast validation of city selection, feed load, summarization quality, and WhatsApp share — not accounts, personalization, or gated content. Adding auth early would expand scope (identity provider, sessions, password reset, RLS policies) without validating the core product loop.

## Decision

Ship the MVP with **no login / no user accounts**.

Abuse protection at this stage:

- Rate limit all public API endpoints
- CORS locked to known frontend origins
- Treat ingested RSS/scraped content as untrusted input
- Separate local / staging / production databases (never test against production data)

## Consequences

- Faster path to QR-flyer pilots and staging validation.
- No per-user history, bookmarks, or personalization until a later ADR.
- Rate limiting and origin lockdown are mandatory, not optional.
- When auth is needed, introduce it behind a new ADR and avoid bolting it onto MVP endpoints without a clear identity model.
