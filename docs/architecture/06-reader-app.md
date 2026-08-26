# Reader app

> **Living doc** — update when Expo routes, city/feed/share behavior, or desktop web layer change.  
> **Last verified against:** 2026-08-26 (main feed card: summary on list + hero)

## Purpose

Universal Expo client (`apps/app`) for readers: web/PWA now, native later. Phone-first localized feed with WhatsApp share ([ADR-003](../adr/003-expo-universal-client.md)).

## Boundaries

- **In scope:** Expo Router screens, API client, city preference, share, desktop layout, theme tokens, PWA assets.
- **Out of scope:** Admin tooling; API implementation.

## Context diagram

```mermaid
flowchart LR
  User[Reader] --> Pages[Cloudflare Pages<br/>newsfeed-web]
  Pages --> Expo[Expo RN Web export]
  Expo -->|EXPO_PUBLIC_API_BASE_URL<br/>no auth| API[NewsFeed.Api]
  Expo --> Storage[AsyncStorage city + prefs]
```

## Components / key types

### Routes (`apps/app/app/`)

| File | Role |
|------|------|
| `index.tsx` | Boot: stored city → tabs else `/city` |
| `city.tsx` | City picker |
| `(tabs)/index.tsx` | Home feed |
| `(tabs)/search.tsx` | Discover / search |
| `(tabs)/bookmarks.tsx` | Local bookmarks |
| `(tabs)/profile.tsx` | Settings / change city |
| `(tabs)/categories.tsx` | Hidden (`href: null`) |
| `article/[id].tsx` | Immersive vertical swipe pager; hydrates `body` via `getArticle` |
| `feed.tsx` | Legacy redirect → tabs |

### Modules

| Module | Role |
|--------|------|
| `src/api/client.ts` | Typed API calls |
| `src/api/useAsyncResource.ts` | Shared async lifecycle hook for ordinary server-state reads |
| `src/storage/cityPreference.ts` | Persisted city |
| `src/utils/shareToWhatsApp.ts` | Share deep link / intent |
| `src/components/desktop/*` | Desktop shell / sidebar / hero row |
| `src/storage/viewSession.ts` | Anonymous view sessions for trending |
| `src/theme/tokens.ts` | Light shell `#F4F6FA`, accent `#2855E8` |
| `src/components/CompactArticleCard.tsx` | Primary feed row: thumbnail, headline, 2–3 line summary, source/time |
| `src/components/BreakingHeroCard.tsx` | Breaking/hero media card with optional summary teaser |
| `public/manifest.webmanifest`, `public/_headers` | PWA / Pages headers |

Stack: Expo ~54, expo-router, Gluestack UI, Moti, AsyncStorage.

Server state convention: ordinary API reads should go through `useAsyncResource`
or a feature hook built on it. Keep imperative `useState`/`useEffect` loaders only
where pagination, swipe prefetching, or fire-and-forget mutations make the flow
meaningfully different. Revisit TanStack Query when cross-screen caching,
invalidation, or offline behavior becomes product-critical.

## Data & control flows

```mermaid
sequenceDiagram
  participant U as Reader
  participant App as Expo app
  participant API as API
  U->>App: Open / QR land
  alt no city
    App->>U: City picker
    App->>App: AsyncStorage save
  end
  App->>API: getCities / getArticles / getArticleDates
  U->>App: Open article
  App->>API: getArticles (stack) + getArticle (body)
  App->>API: recordArticleView
  U->>App: Share
  App->>U: WhatsApp share sheet / URL
```

API helpers used: `getHealth`, `getCities`, `getArticles`, `getArticleDates`, `getArticle`, `getTrendingArticles`, `recordArticleView`.

## Key files

- `apps/app/package.json`, `app.json` / Expo config
- `apps/app/src/api/client.ts`
- `apps/app/app/**`
- `apps/app/.env.example`

## Public contracts

| Item | Value |
|------|-------|
| Env | `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_ENV` |
| Deploy artifact | `pnpm build:web` → `apps/app/dist` |
| Bundle report | `pnpm --filter @newsfeed/app bundle:report` |
| Pages project | default `newsfeed-web` |
| Auth | None for MVP |

## Frontend quality baselines

- Bundle baseline after direct lucide icon imports:
  - Before: `5534.7 KiB` raw / `1049.0 KiB` gzip, `4670` Metro modules.
  - After: `3751.7 KiB` raw / `869.7 KiB` gzip, `2936` Metro modules.
  - Sourcemap check after the fix found `29` lucide sources instead of the full icon set; lucide no longer appears in the top generated-byte buckets.
- Gluestack import check: `@gluestack-ui/themed` publishes a top-level `build/index.js` and `build/components/index.js`, with no supported per-component export map equivalent to `lucide-react-native/icons/*`. Keep usage scoped at call sites, but treat `react-aria` / `react-stately` weight as inherent unless the library is replaced or removed.
- Desktop popover keyboard baseline: `StoryOptionsPopover` traps Tab/Shift+Tab within action rows, focuses the first action on open, restores focus to the trigger on close, and activates focused actions with Enter/Space. Jest coverage lives in `apps/app/__tests__/storyOptionsPopover.test.tsx`.
- Contrast baseline: `apps/app/__tests__/contrast.test.ts` checks normal text and UI contrast for light feed tokens, category badges, destructive affordances, and the dark reader palette. Token changes must keep WCAG AA thresholds.
- Font scaling baseline: `apps/app/src/accessibility/defaultTextScaling.ts` sets RN `Text` and `TextInput` defaults to allow OS font scaling up to `2` (200%).
- Static screen-reader label/role sweep: all current `Pressable` call sites under `apps/app/app` and `apps/app/src` have matching role/label coverage as of this verification.

Manual verification still required before claiming a comprehensive a11y sweep is complete: VoiceOver/TalkBack spot-checks on Home feed and Article detail, plus one desktop-only interaction (popover or sidebar nav), on a real device or named simulator/emulator.

## Failure modes & invariants

- Use RN primitives (`View`/`Text`/`Pressable`) so web and native stay aligned — avoid raw HTML/CSS except thin `Platform` forks.
- Do not add a second Vite reader app.
- MVP UI stays light + single blue accent until branding lands.
- No login — city preference is device-local only.
- List payloads omit `body`; the swipe card shows full plain-text `body` when `GET /api/articles/{id}` returns it, otherwise the summary. For translated reads, the API suppresses original-language `body` so the card shows translated headline/summary rather than mixing languages.
- Article pager scroll settling clamps each gesture to one adjacent story so fast wheel/trackpad/touch momentum cannot skip multiple pages.
- Article reader body scroll uses a shrinkable flex column (`minHeight: 0`) and a nested-scroll pager so the article text can scroll inside the card on web and Android.

## Related docs

- [ADR-002](../adr/002-no-auth-mvp.md), [ADR-003](../adr/003-expo-universal-client.md)
- [PRD](../PRD.md) core flows
- Spec: `docs/superpowers/specs/2026-08-13-responsive-desktop-web-layer-design.md`

## Change checklist

| When you change… | Update… |
|------------------|---------|
| Routes / feed / share / desktop | This page |
| Reader API usage / DTO fields | This page + [07-shared-types](./07-shared-types.md) |
| Pages deploy / headers | [08-hosting-and-ci](./08-hosting-and-ci.md) |
