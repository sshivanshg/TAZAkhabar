---
name: khabro-release
description: Ship Khabro: qa-first branch flow, CI gates, promote qa to main, Render auto-deploy, Cloudflare Pages deploys, production migrations and rollback.
---

# Khabro Release

Rules: [.codex/rules/git-and-pr-conventions.mdc](../../../.codex/rules/git-and-pr-conventions.mdc), [08-hosting-and-ci.md](../../../docs/architecture/08-hosting-and-ci.md).

1. Routine work lands directly on `qa` with Conventional Commits. No direct commits to `main`.
2. `ci.yml` (format/build/test API with Postgres, migration SQL artifact, OpenAPI drift, app lint/test/export, site + admin build) must pass.
3. `deploy-qa.yml` publishes the reader to `newsfeed-web` branch `qa`; verify there.
4. Promote with the `Promote QA to production` workflow (`promote-qa.yml`, fast-forward only). Notes: what, why, how tested, atlas pages changed or N/A.
5. `main` -> Render auto-deploys the API (applies migrations on boot); `deploy.yml` publishes reader, site, admin to Pages.
6. Manual reader deploy: Wrangler `apps/app/dist` to `newsfeed-web --branch main`; prune stale previews after verification.
7. Rollback: Render rollback to last good deploy; Pages rollback to previous production deployment. Migrations are forward-only - ship a new migration to undo schema.
