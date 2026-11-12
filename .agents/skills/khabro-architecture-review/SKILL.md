---
name: khabro-architecture-review
description: Independent architecture review of a Khabro change against ADRs, the atlas, hard boundaries and design principles. Use for hosting, auth, data model, ingestion pipeline or monorepo-shape changes.
---

# Khabro Architecture Review

Check the change against:
- Hard boundaries in [AGENTS.md](../../../AGENTS.md): API-only DB access, no reader auth, one reader codebase, contract sync.
- ADRs in `docs/adr/` (001 monorepo ... 007 marketing site). A change that contradicts one needs a new ADR, not an edit.
- [11-design-principles.md](../../../docs/architecture/11-design-principles.md): dependency direction, thin endpoints, adapters behind interfaces.
- Atlas accuracy: affected `docs/architecture/` pages updated, Mermaid accurate, "Last verified" bumped.
- Operability on Render free tier + Neon: boot migrations safe, background work bounded, scheduled ingest still works.

Output Critical / Required / Suggestion with `path:line`, verdict `APPROVE` only with none of the first two.
