# @newsfeed/app

Expo universal client for **NewsFeed** (placeholder name) — web is the primary MVP surface.
iOS/Android builds use the same codebase later.

## UI

Light shell (`#FAFAFA`) with a single blue accent (`#1D7BFF`). No auth — pick a city, read the feed, share stories.

## Setup

```bash
pnpm install
cp apps/app/.env.example apps/app/.env
# Set EXPO_PUBLIC_API_BASE_URL (default local: http://localhost:8080)
pnpm dev:web
pnpm build:web

# later:
pnpm --filter @newsfeed/app ios
pnpm --filter @newsfeed/app android
```

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | API origin (no trailing slash), e.g. `http://localhost:8080` |
| `EXPO_PUBLIC_APP_ENV` | `local` / `staging` / `production` |

## PWA / web export

- Config: `app.json` → `web.themeColor` (`#FAFAFA`), `backgroundColor`, name/shortName/description; splash via `splash-icon.png`.
- Static files in `public/` are copied into `dist/` by `expo export -p web`:
  - `manifest.webmanifest` — `display: standalone`, icons, theme/background
  - `_headers` — Cloudflare Pages security headers (copied with the export)
  - `index.html` — links the manifest + theme-color meta
- Hosting: Cloudflare Pages publishes `apps/app/dist` (see ADR-004).

Use React Native primitives. API calls go through `src/api/client.ts`.
