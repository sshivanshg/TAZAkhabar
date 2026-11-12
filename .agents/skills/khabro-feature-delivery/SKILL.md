---
name: khabro-feature-delivery
description: Entry skill for delivering a Khabro feature or fix end to end: read rules, plan, implement on qa, keep contracts/atlas in sync, verify, review, commit.
---

# Khabro Feature Delivery

1. `git status --short`; preserve existing work. Read [AGENTS.md](../../../AGENTS.md), relevant `.codex/rules/*.mdc`, `docs/PRD.md` for product scope, and the matching atlas page.
2. Substantial work: `khabro-principal-engineer` plans slices with disjoint files.
3. Record a baseline: `pnpm test:api`, `pnpm lint:app`, `pnpm test:app` as relevant; do not hide failures.
4. Implement with the area skill: [khabro-backend](../khabro-backend/SKILL.md), [khabro-database](../khabro-database/SKILL.md), [khabro-ingestion](../khabro-ingestion/SKILL.md), [khabro-reader-app](../khabro-reader-app/SKILL.md), [khabro-admin](../khabro-admin/SKILL.md).
5. Contract changed -> [khabro-api-contracts](../khabro-api-contracts/SKILL.md). Structure changed -> atlas page + "Last verified" bump; ADR if hosting/auth/data ownership/monorepo shape.
6. Fresh review via `khabro-code-reviewer` (plus security/architecture/performance reviewers when relevant). Resolve Critical/Required.
7. Commit on `qa` (Conventional Commits) and push unless told local-only; promotion per [khabro-release](../khabro-release/SKILL.md).
