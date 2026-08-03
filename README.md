# NewsFeed

Localized news summarization monorepo. MVP: **Expo (React Native + Web)** + .NET 8 API + Postgres. No auth.

> **Name:** `NewsFeed` is a placeholder — find-and-replace when the real product name is decided.

## Layout

```
apps/app              Expo universal client (web now, iOS/Android when needed)
apps/api              .NET 8 Minimal API
apps/api.Tests        xUnit + WebApplicationFactory tests
packages/shared-types OpenAPI → TypeScript via NSwag
infra/docker          Dockerfiles
infra/migrations      EF Core migrations (never edit applied ones)
docs/adr              Architecture decision records
docs/PRD.md           Product requirements (paste content here)
```

One client codebase ships the Cloudflare Pages web/PWA via React Native Web and later native binaries — see `docs/adr/003-expo-universal-client.md`.

UI is neutral black text on white (no branding/accents) so theming can change later without a rebuild.

## Prerequisites

- .NET 8 SDK
- Node 20+ and pnpm 9 (`corepack enable`)
- Docker (for local Postgres / full stack)
- Optional: Expo Go / Xcode / Android Studio for device builds

## Quick start (local)

```bash
# 1. Env files
cp .env.example .env
cp apps/app/.env.example apps/app/.env

# 2. Start Postgres
docker compose up -d postgres

# 3. API
dotnet run --project apps/api/NewsFeed.Api.csproj

# 4. App (web in browser — primary MVP path)
pnpm install
pnpm dev:web
```

- Expo web: http://localhost:8081 (port may vary; check terminal)
- API health: http://localhost:8080/api/health
- OpenAPI: http://localhost:8080/openapi/v1.json

Native later: `pnpm --filter @newsfeed/app ios` / `android` (same app).

## Environments

| Env | Config templates | Database |
|-----|------------------|----------|
| local | `.env.example`, `apps/app/.env.example` | Docker Postgres |
| staging | `.env.staging.example` | Neon (separate) |
| production | `.env.production.example` | Neon (separate) |

Never point local/staging tools at production data.

## Shared types (OpenAPI → TypeScript)

```bash
pnpm --filter @newsfeed/shared-types fetch-openapi
pnpm generate:types
```

Commit OpenAPI snapshot + generated types in the **same PR** as API contract changes.

## Tests

```bash
dotnet test NewsFeed.sln
pnpm test:app
pnpm build:web   # Expo static export used by Cloudflare Pages
```

## Deploy

- **API** → Railway (`railway.toml` + `.github/workflows/deploy.yml`)
- **Web** → Cloudflare Pages from `expo export -p web` → `apps/app/dist`
- **DB** → Neon
- **Native** → EAS Build when you are ready (same `apps/app`)

Secrets: `RAILWAY_*`, `CLOUDFLARE_*`, var `EXPO_PUBLIC_API_BASE_URL`.

## Explicit non-goals (MVP)

- No login / authentication (see `docs/adr/002-no-auth-mvp.md`)
- No separate Vite web app — web is the Expo export
- No custom branding / accent colors — B&W UI only until name/theme are finalized
