# TazaKhabar

Localized news summarization monorepo. MVP: **Expo (React Native + Web)** + .NET 8 API + Postgres. No auth.

> **Name:** TazaKhabar — fresh, clear local news for your city.

## Layout

```
apps/app              Expo universal client (web now, iOS/Android when needed)
apps/admin            Vite editorial SPA (internal; separate Pages origin)
apps/api              .NET 8 Minimal API
apps/api.Tests        xUnit + WebApplicationFactory tests
packages/shared-types OpenAPI → TypeScript via NSwag
infra/docker          Dockerfiles
infra/migrations      EF Core migrations (never edit applied ones)
docs/architecture     Living system atlas (start here for how-it-works)
docs/adr              Architecture decision records
docs/PRD.md           Product requirements
```

**Architecture:** [docs/architecture/README.md](docs/architecture/README.md) — system overview, ingest/scrapers, admin, CDN/hosting, and tech-stack rationale.

One reader codebase ships the Cloudflare Pages web/PWA via React Native Web and later native binaries — see `docs/adr/003-expo-universal-client.md`. Admin is a separate Vite app (`docs/adr/006-internal-admin-spa.md`).

UI is **light** (`#FAFAFA` shell) with a **single blue accent** (`#1D7BFF`) — no multi-color brand palette yet so full branding can land later.

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

# 3. API (applies pending EF migrations on startup when using a relational DB)
dotnet run --project apps/api/TazaKhabar.Api.csproj

# Optional manual migrate instead of / in addition to startup:
# dotnet ef database update --project apps/api/TazaKhabar.Api.csproj

# 4. App (web in browser — primary MVP path)
pnpm install
pnpm dev:web
```

- Expo web: http://localhost:19006 (hosted API-compatible local dev origin)
- API health: http://localhost:8080/api/health
- OpenAPI: http://localhost:8080/openapi/v1.json

Native later: `pnpm --filter @tazakhabar/app ios` / `android` (same app).

## Build an Android APK

Use an APK when you want to install a test build directly on an Android phone or emulator. The `preview` build profile is already configured in [`apps/app/eas.json`](apps/app/eas.json) for this purpose. The `production` profile generates an AAB for Google Play instead.

1. Create an [Expo account](https://expo.dev/signup), then install dependencies and sign in from the Expo app directory:

   ```bash
   pnpm install
   cd apps/app
   pnpm dlx eas-cli login
   pnpm dlx eas-cli init
   ```

   `eas init` creates or links the Expo project and writes its non-secret project ID to `app.json`. Commit that change when this is the shared project for the repository.

2. Point the build at a deployed, publicly reachable API. Do not use `http://localhost:8080`: that address refers to the phone itself, not your development machine. Replace the example URL with the staging or production API URL:

   ```bash
   pnpm dlx eas-cli env:set \
     --name EXPO_PUBLIC_API_BASE_URL \
     --value https://api.example.com \
     --environment preview \
     --visibility plaintext
   pnpm dlx eas-cli env:set \
     --name EXPO_PUBLIC_APP_ENV \
     --value staging \
     --environment preview \
     --visibility plaintext
   ```

   `EXPO_PUBLIC_*` values are bundled into the app, so never put secrets in them.

3. Start the cloud build. On the first run, EAS may ask to create Android signing credentials; accept the prompts for a new project.

   ```bash
   pnpm dlx eas-cli build --platform android --profile preview
   ```

4. When the build finishes, open the URL printed by EAS, download the `.apk`, and install it on the Android device. Android may ask you to allow installs from the browser or file manager you used. Alternatively, with USB debugging enabled:

   ```bash
   adb install path/to/tazakhabar.apk
   ```

To install the latest EAS build on a running Android emulator, use:

```bash
cd apps/app
pnpm dlx eas-cli build:run --platform android --latest
```

For a Google Play release, build an AAB instead:

```bash
cd apps/app
pnpm dlx eas-cli build --platform android --profile production
```

### Mock-data flow (no login)

There is **no authentication** for MVP. Typical path:

1. **Select a city**
2. Browse the **feed** (summaries for that city)
3. Open a story and **share** (e.g. WhatsApp)

## Environments

| Env | Config templates | Database |
|-----|------------------|----------|
| local | `.env.example`, `apps/app/.env.example` | Docker Postgres |
| staging | `.env.staging.example` | Neon (separate) |
| production | `.env.production.example` | Neon (separate) |

Never point local/staging tools at production data.

## Shared types (OpenAPI → TypeScript)

```bash
pnpm --filter @tazakhabar/shared-types fetch-openapi
pnpm generate:types
```

Commit OpenAPI snapshot + generated types in the **same PR** as API contract changes.

## Tests

```bash
dotnet test TazaKhabar.sln
pnpm test:app
pnpm build:web   # Expo static export used by Cloudflare Pages
```

## Deploy

Per `docs/adr/004-render-cloudflare-neon-hosting.md` and [docs/architecture/08-hosting-and-ci.md](docs/architecture/08-hosting-and-ci.md):

- **API** → Render (Docker Web Service; auto-deploy from `main`)
- **Web** → Cloudflare Pages from `expo export -p web` → `apps/app/dist`
- **Admin** → Cloudflare Pages from Vite build → `apps/admin/dist` (separate origin)
- **DB** → Neon
- **Native** → EAS Build when you are ready (same `apps/app`)
- Nightly batch ingest is triggered by `.github/workflows/nightly-ingest.yml`; set `INGEST_URL` and `RssIngest__Secret` in GitHub so it can call `/api/ingest/daily`.

Secrets / vars: Render + Cloudflare credentials, `EXPO_PUBLIC_API_BASE_URL` for the reader web build, and `VITE_API_BASE_URL` for admin. Render must allowlist both Pages origins in `Cors__AllowedOrigins__*`.

PWA layout notes: Expo copies `apps/app/public/` into `dist` on export (manifest, `_headers`, icons). See `apps/app/README.md`.

## Explicit non-goals (MVP)

- No login / authentication (see `docs/adr/002-no-auth-mvp.md`)
- No separate Vite web app — web is the Expo export
- No full brand system yet — light UI + single blue accent only
