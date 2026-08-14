# Living Architecture Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the full living architecture atlas under `docs/architecture/` so humans and agents can answer “how does X work now?” with Mermaid diagrams, tech-stack rationale, and keep-fresh rules.

**Architecture:** Markdown hub + nine subsystem pages (Mermaid only), plus Cursor always-apply freshness rule. ADRs/PRD remain decisions/intent; atlas is current how-it-works. Sync short `architecture.mdc` and root README so they no longer omit `apps/admin`.

**Tech Stack:** Markdown + Mermaid; Cursor rules (`.mdc`); no new runtime deps.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-14-living-architecture-atlas-design.md` layout and page template exactly.
- Do not rewrite ADRs or superpowers history.
- No parallel “how it works now” docs outside `docs/architecture/`.
- Ask before creating unrelated `.md` files; these atlas pages are in-scope for this plan.
- Document scrape→`Published` vs RSS/PDF→`PendingReview` accurately from current code.

---

### Task 1: Scaffold hub, template, freshness rule

**Files:**
- Create: `docs/architecture/_template.md`
- Create: `docs/architecture/README.md`
- Create: `.cursor/rules/architecture-docs.mdc`
- Modify: `.cursor/rules/git-and-pr-conventions.mdc`

- [ ] **Step 1:** Create `_template.md` with the 11 required sections from the design.
- [ ] **Step 2:** Create hub `README.md` with start-here map, taxonomy, freshness protocol, and index links (pages may be stubs until later tasks fill them).
- [ ] **Step 3:** Add `architecture-docs.mdc` (`alwaysApply: true`) with code→page mapping from the design.
- [ ] **Step 4:** Extend PR conventions with architecture checklist + Docs line in PR body expectations.
- [ ] **Step 5:** Verify files exist and hub links resolve to intended paths.

### Task 2: Sync short architecture rule + root README

**Files:**
- Modify: `.cursor/rules/architecture.mdc`
- Modify: `README.md`

- [ ] **Step 1:** Update layout to include `apps/admin` and link to `docs/architecture/`.
- [ ] **Step 2:** Keep hard boundaries; note admin SPA is ADR-006 exception to Expo-only client.
- [ ] **Step 3:** Update root README layout + Deploy section to point at atlas hub.

### Task 3: Write `00-system-overview` through `04-ingestion`

**Files:**
- Create: `docs/architecture/00-system-overview.md`
- Create: `docs/architecture/01-monorepo.md`
- Create: `docs/architecture/03-data-model.md`
- Create: `docs/architecture/02-api.md`
- Create: `docs/architecture/04-ingestion.md`

- [ ] **Step 1:** Write `00` with end-to-end Mermaid (reader/admin/CDN/API/Neon/cron/sources/Claude) + stack rationale table.
- [ ] **Step 2:** Write `01` monorepo packages/scripts/boundaries.
- [ ] **Step 3:** Write `03` entities, enums, migrations ownership.
- [ ] **Step 4:** Write `02` endpoint groups, auth, rate limits, CORS, DI.
- [ ] **Step 5:** Write `04` RSS/scrape/PDF/image enrichment, run lifecycle, SSE, cron.
- [ ] **Step 6:** Set “Last verified against” to `2026-08-14` on each page.

### Task 4: Write `05-admin` through `08-hosting-and-ci`

**Files:**
- Create: `docs/architecture/05-admin.md`
- Create: `docs/architecture/06-reader-app.md`
- Create: `docs/architecture/07-shared-types.md`
- Create: `docs/architecture/08-hosting-and-ci.md`

- [ ] **Step 1:** Write admin Vite SPA routes, JWT auth, live ingest UI.
- [ ] **Step 2:** Write reader Expo routes, city preference, feed, share, desktop layer.
- [ ] **Step 3:** Write OpenAPI → NSwag regenerate rule.
- [ ] **Step 4:** Write Render/Cloudflare/Neon/docker-compose/CI/env templates + traffic Mermaid.
- [ ] **Step 5:** Cross-link ADRs/PRD/specs from Related docs sections; bump hub index if needed.

### Task 5: Final consistency pass

- [ ] **Step 1:** Grep atlas for TBD/TODO/placeholder; fix.
- [ ] **Step 2:** Confirm Mermaid blocks fence correctly and match inventory (health `/healthz` for Render; scrape status).
- [ ] **Step 3:** Confirm `architecture.mdc` no longer omits admin.
- [ ] **Step 4:** Confirm change checklists cover the design’s code→page mapping table.
