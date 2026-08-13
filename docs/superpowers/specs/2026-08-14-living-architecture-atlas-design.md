# Living Architecture Atlas — Design

- Status: Approved for implementation
- Date: 2026-08-14
- Audience: Humans (onboarding/handoff) and AI coding agents (equally)

## Problem

The repo has product intent (`docs/PRD.md`), decision history (`docs/adr/`), feature design history (`docs/superpowers/`), and short agent rules (`.cursor/rules/`), but no living “how the system works now” atlas with diagrams. Short rules already drift (e.g. `architecture.mdc` omitting `apps/admin`). Without a keep-fresh protocol, deep docs go stale.

## Goals

1. Human-readable architecture hub with Mermaid diagrams and deep subsystem pages.
2. Agent-actionable update rules so structural code changes update matching docs in the same change.
3. Clear taxonomy so living docs, ADRs, PRD, and feature specs do not collide.
4. Full atlas written in one pass (not phased stubs).

## Non-goals

- Rewriting existing ADRs or superpowers history
- Auto-generating docs from code
- CI “docs outdated” enforcement in v1
- Marketing/brand site documentation
- Duplicating the full atlas into Cursor rules

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Approach | Living Architecture Atlas under `docs/architecture/` |
| Depth | Full system atlas in first delivery |
| Diagrams | Mermaid embedded in Markdown only |
| Freshness | Cursor always-apply rule + PR checklist |
| Audience | Both humans and agents |

## Doc taxonomy

| Kind | Location | Job |
|------|----------|-----|
| Living atlas | `docs/architecture/` | Current how-it-works + Mermaid |
| Decisions | `docs/adr/` | Why we chose X (immutable once accepted) |
| Product intent | `docs/PRD.md` | What we build for users |
| Feature design history | `docs/superpowers/` | Specs/plans for past work |
| Agent hard rules | `.cursor/rules/` | Short must-follow constraints; point to atlas for depth |

**Conflict rule:** If code and atlas disagree, treat it as a bug in the same change. Prefer updating the atlas to match intended design; if the atlas correctly stated intent and the code drifted, fix the code (and keep the atlas accurate). ADRs are not rewritten for “how it works now.”

## Folder layout

```
docs/architecture/
  README.md                 # Hub: map, start-here, freshness protocol
  00-system-overview.md
  01-monorepo.md
  02-api.md
  03-data-model.md
  04-ingestion.md
  05-admin.md
  06-reader-app.md
  07-shared-types.md
  08-hosting-and-ci.md
  _template.md              # Required sections for new pages
```

Root `README.md` stays a quick start and links to the atlas hub.  
`.cursor/rules/architecture.mdc` stays short hard boundaries and links to the hub (must be synced so it no longer contradicts reality).

## Page template

Every atlas page except the hub uses:

1. Living-doc banner + “Last verified against”
2. Purpose
3. Boundaries (in / out of scope)
4. Context diagram (Mermaid)
5. Components / key types
6. Data & control flows (Mermaid as needed)
7. Key files (paths only)
8. Public contracts (endpoints, events, env vars)
9. Failure modes & invariants
10. Related docs (ADRs, PRD, specs)
11. Change checklist (“When you change … → update …”)

## Page inventory (full depth)

| Page | Covers |
|------|--------|
| `00-system-overview` | Reader ↔ API ↔ Postgres; admin ↔ API; Cloudflare/Render/Neon; high-level ingest |
| `01-monorepo` | Packages, scripts, workspace boundaries |
| `02-api` | Minimal API layout, public + admin endpoint groups, auth, rate limits, CORS, DI |
| `03-data-model` | Entities, statuses, migrations ownership |
| `04-ingestion` | RSS / scrape / PDF, article intelligence, event bus / live stream, run lifecycle |
| `05-admin` | Vite SPA pages, auth, review queue, sources, uploads, live run UI |
| `06-reader-app` | Expo routes, city preference, feed, share, desktop layer, theme |
| `07-shared-types` | OpenAPI → NSwag, regenerate rule, no hand-edit of generated |
| `08-hosting-and-ci` | render.yaml, Cloudflare, Neon, docker-compose, env templates |

## Keep-fresh protocol

### Cursor rule: `.cursor/rules/architecture-docs.mdc` (`alwaysApply: true`)

Agents must:

1. Before structural/product changes, read matching `docs/architecture/*.md` page(s).
2. Same-change updates when touching boundaries, endpoints, entities/statuses, ingest, admin, reader routes, OpenAPI/shared-types, hosting/env.
3. Bump “Last verified” on edited pages.
4. New subsystem → page from `_template.md`, hub link, change-checklist row.
5. No parallel “how it works now” docs outside `docs/architecture/`.
6. Treat atlas/code disagreement as a bug to fix in the same change.

Code → page mapping:

| Code area | Atlas page |
|-----------|------------|
| `apps/api/Endpoints/*`, `Program.cs` | `02-api` (+ `00` if topology changes) |
| `apps/api/Data/*`, migrations | `03-data-model` |
| `apps/api/Ingest/*` | `04-ingestion` |
| `apps/admin/**` | `05-admin` |
| `apps/app/**` | `06-reader-app` |
| `packages/shared-types/**`, OpenAPI | `07-shared-types` |
| `render.yaml`, docker, Cloudflare, env examples | `08-hosting-and-ci` |

### PR checklist (extend `git-and-pr-conventions.mdc`)

For architecture-relevant PRs:

- [ ] Atlas page(s) updated (or N/A with one-line why)
- [ ] Mermaid still accurate
- [ ] “Last verified” bumped on edited pages
- [ ] Hub index updated if a new page was added

PR body expectations: What / Why / How tested / **Docs** (which atlas pages changed).

## Delivery order

1. Scaffold `docs/architecture/` + `_template.md` + hub `README.md`
2. Add `architecture-docs.mdc`; update `git-and-pr-conventions.mdc`
3. Sync `architecture.mdc` + root `README.md` (include `apps/admin`; link atlas)
4. Write pages: `00` → `01` → `03` → `02` → `04` → `07` → `06` → `05` → `08`
5. Cross-link ADRs / PRD / relevant specs
6. Verify Mermaid and change checklists cover the mapping table

## Success criteria

- A new engineer or agent can answer “how does X work?” from the atlas without reading the whole repo
- Structural PRs have an explicit docs touchpoint
- `architecture.mdc` matches reality (admin SPA, ingest live events, current intelligence provider, etc.)

## Implementation next step

After user review of this spec: invoke writing-plans and produce an implementation plan under `docs/superpowers/plans/`, then execute the atlas write.
