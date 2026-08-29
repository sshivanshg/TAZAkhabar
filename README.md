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

- Docker Desktop (the only requirement for the container workflow)
- For running without Docker: .NET 8 SDK, Node 20+, and pnpm 9 (`corepack enable`)
- Optional: Expo Go / Xcode / Android Studio for device builds

## Quick start (Docker only — no host pnpm/.NET)

This is the recommended setup for a restricted company laptop. Docker contains
Node, pnpm, .NET, and Postgres; source files remain editable on the laptop and
the Expo reader hot-reloads when they change.

```bash
# Reader + API + Postgres
docker compose up --build
```

Open:

- Reader: http://localhost:19006
- API health: http://localhost:8080/api/health
- OpenAPI: http://localhost:8080/openapi/v1.json

To also run the internal admin and public marketing site:

```bash
docker compose --profile tools up --build
```

- Admin: http://localhost:5173
- Marketing site: http://localhost:5174

Useful commands:

```bash
docker compose down                 # stop containers; keep database data
docker compose logs -f reader api   # follow reader/API logs
docker compose down --volumes       # reset local DB and dependency caches
```

The first start downloads images and pnpm packages, so it is slower. Later
starts reuse Docker volumes. The local reader talks to the containerized API at
`http://localhost:8080`; no production database is used.

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

## Build an Android APK (local Gradle)

### Docker build (recommended on the restricted laptop)

No host Node, pnpm, JDK, Gradle, or Android Studio is required:

```bash
docker compose run --build --rm apk
```

The first build downloads the Linux Android toolchain and can take several
minutes. The result is:

`artifacts/android/tazakhabar-release.apk`

The Compose command works from Docker Desktop terminals on macOS, Windows, and
Linux. macOS/Linux users can alternatively run the convenience wrapper
`./scripts/docker-build-apk.sh`.

The script always builds a Linux/amd64 container because the Android build
tools are x86_64; Docker Desktop emulates it on Apple Silicon. To build against
a different reachable API, override the public build value explicitly:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.example.com ./scripts/docker-build-apk.sh
```

Do not use `localhost` for an APK: on a physical phone it refers to the phone,
not the development laptop. `EXPO_PUBLIC_*` values are compiled into the app
and must never contain secrets.

The APK uses the generated debug keystore and is for sideloading/internal
testing. For Play Store delivery, use the `production` EAS profile to create a
properly credentialed AAB.

### Host toolchain alternative

Builds run on your machine with Expo prebuild + Gradle — no EAS/Expo cloud account required.

### Prerequisites

- Node 20+, pnpm 9
- JDK 17
- Android SDK (Android Studio is the usual install), with `ANDROID_HOME` set

### Env file to give the builder

Copy into `apps/app/.env` (must match production API; do **not** use `localhost` — that is the phone itself):

```bash
EXPO_PUBLIC_API_BASE_URL=https://buildy-140j.onrender.com
EXPO_PUBLIC_APP_ENV=production
```

Same values are already in the committed `apps/app/.env.production`. `EXPO_PUBLIC_*` is inlined into the binary — never put secrets there.

### Build

```bash
pnpm install
pnpm build:apk
```

That regenerates `apps/app/android/` (gitignored) and runs `./gradlew assembleRelease`. APK path:

`apps/app/android/app/build/outputs/apk/release/app-release.apk`

Release is signed with the Android debug keystore for sideload/testing (fine for internal installs; use a real keystore before Play Store).

Install:

```bash
adb install apps/app/android/app/build/outputs/apk/release/app-release.apk
```

Or open `apps/app/android` in Android Studio → Build → Build APK(s) / Bundle.

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
