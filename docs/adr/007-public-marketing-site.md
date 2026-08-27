# ADR-007: Separate public marketing site from the Expo reader

- Status: Accepted
- Date: 2026-08-27
- Deciders: Engineering
- Relates: ADR-003 (Expo universal reader client), ADR-004 (Render + Cloudflare + Neon hosting), ADR-006 (internal admin SPA)

## Context

TazaKhabar needs a public landing experience with product presentation, privacy, terms, support, and corrections pages. Putting that material inside the Expo reader made the main app feel like a website shell and blurred the boundary between the actual product and launch formalities.

ADR-003 still requires a single reader client codebase for web and native. That constraint applies to the public news-reading product, not to a separate marketing surface.

## Decision

Add `apps/site` as a separate marketing-only Vite application deployed to its own Cloudflare Pages project.

- The Expo app at `apps/app` remains the only reader client
- Marketing/legal routes live on the standalone website instead of Expo Router
- The reader links out to the public website for privacy, support, and related formalities
- The marketing site links into the production reader via `VITE_READER_URL`

## Consequences

- Public/legal URLs become shareable, indexable, and deploy independently from the reader
- CI and deploy workflows build and publish an additional Cloudflare Pages artifact
- Architecture docs must track the new subsystem and the reader-to-site handoff
