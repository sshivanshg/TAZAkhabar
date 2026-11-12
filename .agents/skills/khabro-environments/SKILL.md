---
name: khabro-environments
description: Khabro environments, hosted resources, env var catalog and deploy-failure triage (Render API, Cloudflare Pages, Neon, GitHub Actions, Docker local stack).
---

# Khabro Environments

Source: [docs/architecture/08-hosting-and-ci.md](../../../docs/architecture/08-hosting-and-ci.md), [render.yaml](../../../render.yaml), [docker-compose.yml](../../../docker-compose.yml).

| Env | Reader | Admin | API | DB |
| --- | --- | --- | --- | --- |
| Local | `pnpm dev:web` / compose :19006 | `pnpm dev:admin` :5173 | `pnpm dev:api` / compose :8080 | compose Postgres 16 |
| QA | Pages `newsfeed-web` branch `qa` (qa.newsfeed-web.pages.dev) via `deploy-qa.yml` | - | Render (shared) | Neon |
| Prod | `newsfeed-web` khabro.in | `newsfeed-admin` admin.khabro.in | Render `tazakhabar-api` (free, Docker `infra/docker/Dockerfile.api`) | Neon |

Marketing site: Pages `khabro-site`. Env templates: `.env.example`, `.env.staging.example`, `.env.production.example`, `apps/*/.env.example`.

## Triage
- API down after deploy: Render deploy logs; missing `ConnectionStrings__Database`, failing boot migration, non-default admin creds check.
- Free tier sleeps: first request slow; scheduled ingest workflow wakes + retries.
- Reader shows old build: check `newsfeed-web` production deployment is `main`; Pages Git build command must stay `pnpm build:web`.
- CORS errors: origin missing from `Cors__AllowedOrigins__*`.
- Backups: Neon-managed; confirm retention and do a restore test into a non-prod branch before launch.
