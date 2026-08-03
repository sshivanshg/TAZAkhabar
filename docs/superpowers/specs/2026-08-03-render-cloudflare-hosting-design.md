# Design: Render API + Cloudflare Pages/CDN hosting

- Status: Approved
- Date: 2026-08-03
- Related ADR: `docs/adr/004-render-cloudflare-neon-hosting.md`

## Goal

Replace Railway with Render for the .NET API, keep Cloudflare Pages for the Expo web export, and use Cloudflare edge caching on feed read APIs so Neon is not hit on every scroll/refresh.

## Non-goals

- Staging Render service (production only for now)
- Pointing local/dev tools at Neon production
- In-process API cache, Redis, or Cloudflare Workers/KV
- Changing product UI or auth model

## Topology

```
Browser
  ├─ Cloudflare Pages  →  Expo static web export (apps/app/dist)
  └─ Cloudflare proxy (orange cloud)
        └─ Render Web Service (.NET 8 API, Docker)
              └─ Neon Postgres (production branch)
```

| Layer | Provider | Role |
|-------|----------|------|
| Web / PWA | Cloudflare Pages | Host Expo `expo export -p web` artifact; static asset CDN |
| API edge | Cloudflare DNS + Cache Rules | Proxy `api.<domain>` to Render; cache eligible GET responses |
| API compute | Render Web Service | Run `NewsFeed.Api` from `infra/docker/Dockerfile.api` |
| Database | Neon | Managed Postgres; only the API talks to it |

Local development stays on Docker Postgres (`.env.example`). Never point local tools at production Neon.

## Deploy model

### API (Render)

- Blueprint file: `render.yaml` at repo root
- One **Web Service**, production only
- Build: Docker, `dockerfilePath: infra/docker/Dockerfile.api`
- Health check: `GET /api/health`
- Port: `8080` (`ASPNETCORE_URLS=http://+:8080` already in Dockerfile)
- Auto-deploy from GitHub branch `main` (Render owns the build; no Railway CLI / deploy-api job)

**Render dashboard secrets / env (not in git):**

| Variable | Purpose |
|----------|---------|
| `ConnectionStrings__Database` | Neon pooled connection string (`sslmode=require`) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `Cors__AllowedOrigins__0` (+ more as needed) | Cloudflare Pages origin(s), e.g. `https://newsfeed.pages.dev` or custom domain |
| `RateLimiting__PermitLimit` / `RateLimiting__WindowSeconds` | Public API abuse control |
| `Serilog__MinimumLevel` | Optional; default Information |

### Web (Cloudflare Pages)

- Unchanged GitHub Actions job: install → `pnpm --filter @newsfeed/app build:web` → `cloudflare/pages-action`
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Vars: `CLOUDFLARE_PAGES_PROJECT_NAME`, `EXPO_PUBLIC_API_BASE_URL` (must be the Cloudflare-proxied API URL, e.g. `https://api.<domain>`)

### Remove Railway

- Delete `railway.toml`
- Remove `deploy-api` job and all `RAILWAY_*` references from `.github/workflows/deploy.yml`
- Update README, `.env.staging.example`, `.env.production.example`, `.cursor/rules/security.mdc`

## Feed caching (reduce Neon cost)

### Cached endpoints

| Endpoint | TTL (start) | Notes |
|----------|-------------|-------|
| `GET /api/articles` | 60s | Full query string is the cache key (`city`, `category`, `q`, `offset`, `limit`) |
| `GET /api/cities` | 60s (or longer later) | Rarely changes |

### Not cached

- `GET /api/health`
- Any future write/admin endpoints

### Implementation

1. **API:** On successful 200 responses for the endpoints above, set:
   - `Cache-Control: public, max-age=60, s-maxage=60`
   - Do not set this on 4xx/5xx
2. **Cloudflare:** DNS A/CNAME for `api.<domain>` → Render, **proxied** (orange cloud). Cache Rule matching `/api/articles*` and `/api/cities` that respects origin `Cache-Control` (eligible for cache; bypass for non-GET).
3. **CORS:** Allowlist Pages origins only; edge cache must not break CORS (ensure `Access-Control-Allow-Origin` is correct for the allowed origin; avoid `*` with credentials).

### Tuning

- Start at 60s. Raise if feed freshness allows (e.g. 120–300s) to cut Neon further.
- Purge via Cloudflare cache purge if an urgent content correction is needed before TTL.

## DNS / domains (ops checklist)

1. Add custom domain (or use Pages `*.pages.dev` + later custom domain).
2. Cloudflare DNS: `api` → Render service hostname, proxied.
3. Render: add custom domain `api.<domain>` and complete TLS verification as Render requires.
4. Set Pages `EXPO_PUBLIC_API_BASE_URL=https://api.<domain>`.
5. Set Render `Cors__AllowedOrigins__*` to the Pages URL(s).
6. Add Cloudflare Cache Rule for feed paths.
7. Verify: two identical feed requests within 60s → second shows Cloudflare cache HIT (response headers / CF dashboard), Neon query count does not double.

## Security constraints (unchanged)

- No secrets in git, Dockerfiles, or workflow files
- Rate limit all public endpoints
- CORS allowlist only (never `AllowAnyOrigin` in production)
- Untrusted content rules for future ingestion still apply

## Repo file impact (implementation)

| Action | Path |
|--------|------|
| Create | `render.yaml` |
| Create | `docs/adr/004-render-cloudflare-neon-hosting.md` |
| Delete | `railway.toml` |
| Modify | `.github/workflows/deploy.yml` (Pages only) |
| Modify | `README.md` Deploy + secrets |
| Modify | `.env.production.example`, `.env.staging.example` |
| Modify | `.cursor/rules/security.mdc`, `.cursor/rules/architecture.mdc` if they mention Railway |
| Modify | `apps/api` article/cities endpoints (or shared helper) for `Cache-Control` |
| Modify | API tests asserting `Cache-Control` on 200 for those routes |

## Success criteria

1. No Railway config or CI secrets remain in the repo
2. `render.yaml` documents the production API service and health check
3. Push to `main` auto-deploys API on Render; Actions deploys web to Pages
4. Feed GETs advertise 60s public cache headers
5. Docs (ADR + README) describe topology, env vars, DNS, and cache setup
6. CI (lint/test/build) still green

## Open ops steps (human, outside repo)

- Create Render account/service linked to this GitHub repo
- Create/confirm Neon production DB and paste connection string into Render
- Configure Cloudflare DNS + Cache Rule + Pages project
- Rotate/remove any old Railway tokens from GitHub Environments
