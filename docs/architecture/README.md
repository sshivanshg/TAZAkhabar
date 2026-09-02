# Living Architecture Atlas

> **How the system works now** — for humans (onboarding/handoff) and AI agents.  
> Decisions live in `docs/adr/`. Product intent lives in `docs/PRD.md`. Feature history lives in `docs/superpowers/`.

## Start here

1. Read [00-system-overview](./00-system-overview.md) for the end-to-end picture (readers, admin, API, Neon, CDN, ingest).
2. Jump to the subsystem you are changing (table below).
3. Before merging structural PRs, follow the [keep-fresh protocol](#keep-fresh-protocol).

## Map

| Page | Covers |
|------|--------|
| [00-system-overview](./00-system-overview.md) | Topology, communication, tech stack + why |
| [01-monorepo](./01-monorepo.md) | Packages, scripts, workspace boundaries |
| [02-api](./02-api.md) | Minimal API, auth, rate limits, CORS, DI |
| [03-data-model](./03-data-model.md) | Entities, statuses, migrations |
| [04-ingestion](./04-ingestion.md) | RSS / scrape / PDF, intelligence, cron, SSE |
| [05-admin](./05-admin.md) | Vite editorial SPA, JWT, live runs |
| [06-reader-app](./06-reader-app.md) | Expo reader, city, feed, share, desktop |
| [07-shared-types](./07-shared-types.md) | OpenAPI → NSwag contract |
| [08-hosting-and-ci](./08-hosting-and-ci.md) | Render, Cloudflare, Neon, Docker, CI |
| [09-marketing-site](./09-marketing-site.md) | Public landing site, legal pages, and reader handoff |
| [10-notifications](./10-notifications.md) | Opt-in push subscriptions, dispatch, and web/native delivery |

Template for new pages: [`_template.md`](./_template.md).

## Doc taxonomy

| Kind | Location | Job |
|------|----------|-----|
| Living atlas | `docs/architecture/` | Current how-it-works + Mermaid |
| Decisions | `docs/adr/` | Why we chose X (immutable once accepted) |
| Product intent | `docs/PRD.md` | What we build for users |
| Current capability inventory | `docs/current-capabilities.md` | Shipped features, source rules, cadence, and agent update contract |
| Feature design history | `docs/superpowers/` | Specs/plans for past work |
| Agent hard rules | `.cursor/rules/` | Short must-follow constraints; depth is here |

**Conflict rule:** If code and atlas disagree, treat it as a bug in the same change. Prefer updating the atlas to match intended design; if the atlas correctly stated intent and the code drifted, fix the code. Do not rewrite ADRs for “how it works now.”

## Keep-fresh protocol

1. Before structural/product changes, read the matching atlas page(s).
2. Update those pages in the **same change** when you touch boundaries, endpoints, entities/statuses, ingest, admin, reader routes, OpenAPI/shared-types, or hosting/env.
3. Bump **Last verified against** on edited pages.
4. New subsystem → copy `_template.md`, add hub row, add change-checklist mapping in `.cursor/rules/architecture-docs.mdc`.
5. No parallel “how it works now” docs outside `docs/architecture/`.

Agent enforcement: `.cursor/rules/architecture-docs.mdc` (`alwaysApply: true`).
