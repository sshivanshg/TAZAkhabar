---
name: khabro-reader-app
description: Implement or review the Khabro Expo universal reader at apps/app (expo-router screens, components, hooks, API client, notifications, PWA, theme) for web first and native later.
---

# Khabro Reader App

Rules: [.codex/rules/frontend-conventions.mdc](../../../.codex/rules/frontend-conventions.mdc), atlas [06-reader-app.md](../../../docs/architecture/06-reader-app.md), [10-notifications.md](../../../docs/architecture/10-notifications.md).

- Routes in `apps/app/app/` (`(tabs)`, `article`, `city`, `feed`, `language`); code in `apps/app/src/` (`api`, `components`, `hooks`, `location`, `notifications`, `preferences`, `pwa`, `storage`, `theme`, `accessibility`).
- Entry imports `@expo/metro-runtime` first. Function components + hooks, TS strict, `@tazakhabar/shared-types`.
- RN primitives only; web-only code behind thin `Platform.OS === 'web'` forks.
- No inline `fetch` in screens; HTTP via `src/api/`. Config via `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_APP_ENV`.
- 40+ readability: >=16px base, WCAG AA, 44px targets. Tokens in `src/theme/tokens.ts` / `readerTokens.ts`; see [khabro-ui-system](../khabro-ui-system/SKILL.md).
- No auth for readers.

## Verify
`pnpm lint:app` (tsc), `pnpm test:app` (Jest + RNTL), `pnpm build:web` (expo export), dev `pnpm dev:web` (port 19006).
