# @newsfeed/app

Expo universal client for **NewsFeed** (placeholder name) — web is the primary MVP surface.
iOS/Android builds use the same codebase later.

UI: black text on white, no accents/logo — theming comes later.

```bash
pnpm install
cp apps/app/.env.example apps/app/.env
pnpm dev:web
pnpm build:web

# later:
pnpm --filter @newsfeed/app ios
pnpm --filter @newsfeed/app android
```

Use React Native primitives only. API calls go through `src/api/client.ts`.
