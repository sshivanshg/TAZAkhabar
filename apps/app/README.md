# @buildy/app

Expo universal client — **web is the primary MVP surface** (React Native Web).
iOS/Android builds use the same codebase later (EAS / `expo run:ios|android`).

## Web from day one

Official Expo web stack is installed:

- `react-dom`
- `react-native-web`
- `@expo/metro-runtime` (imported first in `index.ts`)

Plus portable helpers already wired for both web and native:

- `react-native-safe-area-context`
- `react-native-screens` (ready when navigation is added)
- `expo-linking`, `expo-font`, `expo-splash-screen`, `expo-constants`, `expo-system-ui`

```bash
# from repo root
pnpm install
cp apps/app/.env.example apps/app/.env
pnpm dev:web          # Expo web → browser
pnpm build:web        # static export → apps/app/dist (Cloudflare Pages)

# later, same app:
pnpm --filter @buildy/app ios
pnpm --filter @buildy/app android
```

Use React Native primitives only (`View`, `Text`, `Pressable`, …). API calls go through `src/api/client.ts`.
