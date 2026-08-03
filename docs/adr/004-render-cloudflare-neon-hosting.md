# ADR-004: Render API + Cloudflare Pages/CDN + Neon

- Status: Accepted
- Date: 2026-08-03
- Deciders: Engineering (2-person team)
- Supersedes: Railway as API host (scaffold README / `railway.toml`)

## Context

The monorepo scaffold targeted **Railway** for the .NET API, **Cloudflare Pages** for the Expo web export, and **Neon** for Postgres. We are dropping Railway and need a production host that:

1. Builds the existing Docker API image (`infra/docker/Dockerfile.api`)
2. Auto-deploys from `main` without a custom CLI in CI
3. Works with Cloudflare in front so feed reads can be edge-cached and reduce Neon query cost

The web MVP already ships as a static Expo export to Cloudflare Pages (ADR-003). Static Pages CDN alone does not cache JSON feed responses; those hit the API and Neon on every request unless the API sits behind Cloudflare with cacheable `Cache-Control` headers.

## Decision

| Concern | Choice |
|---------|--------|
| API compute | **Render** Web Service (Docker), production only for MVP |
| API deploy | Render auto-deploy from GitHub `main` via Blueprint (`render.yaml`) |
| Web hosting | **Cloudflare Pages** (unchanged) via GitHub Actions |
| Database | **Neon** Postgres (API is sole DB client) |
| Feed CDN / DB cost | Cloudflare-proxied `api.<domain>` + `Cache-Control` on `GET /api/articles` and `GET /api/cities` (start TTL 60s) |
| Local DB | Docker Postgres (not production Neon) |

Remove `railway.toml` and all Railway deploy CI/secrets documentation.

## Consequences

- GitHub Actions deploy workflow only publishes the web app; API deploys are owned by Render.
- Production requires a domain (or temporary `*.onrender.com` + later custom domain) with Cloudflare proxy enabled for edge feed caching to work.
- CORS allowlist on the API must include the Pages origin; `EXPO_PUBLIC_API_BASE_URL` must point at the Cloudflare-facing API URL.
- Feed data can be up to ~60s stale at the edge; tune TTL as product needs change.
- Staging Render/Neon is deferred; when added, use a separate Render service and Neon branch/project.

## References

- Design spec: `docs/superpowers/specs/2026-08-03-render-cloudflare-hosting-design.md`
- ADR-003: Expo universal client → Cloudflare Pages
- Security rule: rate limits + CORS allowlist on public API
