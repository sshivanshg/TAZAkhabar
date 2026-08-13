# Responsive Desktop/Web Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an additive desktop/web layout layer (sidebar, content rail, desktop hero, story popover) so NewsFeed feels native on wide viewports while phone-width UI stays unchanged.

**Architecture:** Root `AppShell` is a true children passthrough on mobile/tablet and a sidebar + centered content rail on desktop/wide. New code lives under `src/hooks/` and `src/components/desktop/`. Screens branch layout at the top; mobile component internals stay untouched (except a mechanical extract of the shared breaking-hero card presentational unit so desktop can compose it without forking markup).

**Tech Stack:** Expo Router 6, React Native / RN Web, Moti, Jest + RNTL, existing tokens in `apps/app/src/theme/tokens.ts`.

**Spec:** `docs/superpowers/specs/2026-08-13-responsive-desktop-web-layer-design.md`

## Global Constraints

- Phone-width rendering must remain visually and behaviorally identical — no new default props on shared mobile primitives.
- Do not edit internals of `HomeTopBar`, `CategoryChips`, `BreakingNewsCarousel` (beyond mechanical `HeroCard` extract), `CompactArticleCard`, `BottomSheet`, or `TabIcon` Moti dots.
- `AppShell` compact path: return `children` with **no** extra layout wrapper `View`.
- No right rail in v1.
- Breakpoints: mobile `<768`, tablet `768–1023`, desktop `≥1024`, wide `≥1440`.
- Shell applies on web **and** native when width ≥ 1024.
- Desktop header search expands inline; Discover remains a separate sidebar destination.
- Tab bar hidden on desktop via style only; verify live resize does not flash Moti active-dot state.
- Commits: Conventional Commits; only when the user/agent is executing this plan and committing is in-scope for that run.

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/app/src/theme/tokens.ts` | Add `breakpoints`, `SIDEBAR_WIDTH`, `CONTENT_RAIL_MAX`, `ERROR_COLUMN_MAX` |
| `apps/app/src/hooks/useBreakpoint.ts` | `breakpointFromWidth`, `useBreakpoint`, `isDesktopLayout`, `isCompactNav` |
| `apps/app/src/components/BreakingHeroCard.tsx` | Shared presentational hero card (extracted from carousel) |
| `apps/app/src/components/BreakingNewsCarousel.tsx` | Import `BreakingHeroCard` instead of inline `HeroCard` — behavior unchanged |
| `apps/app/src/components/desktop/AppShell.tsx` | Compact passthrough / desktop chrome |
| `apps/app/src/components/desktop/ContentRail.tsx` | Max-width centered main column |
| `apps/app/src/components/desktop/DesktopSidebar.tsx` | Persistent left nav |
| `apps/app/src/components/desktop/DesktopTopBar.tsx` | Desktop header + expandable search |
| `apps/app/src/components/desktop/DesktopHeroRow.tsx` | 2–3 card horizontal hero row |
| `apps/app/src/components/desktop/StoryOptionsPopover.tsx` | Anchored story actions menu |
| `apps/app/src/components/desktop/index.ts` | Barrel exports |
| `apps/app/app/_layout.tsx` | Wrap Stack with `AppShell` |
| `apps/app/app/(tabs)/_layout.tsx` | Hide tab bar when `isDesktopLayout` |
| `apps/app/app/(tabs)/index.tsx` | Desktop/tablet layout branches (hero, grid, popover, top bar) |
| `apps/app/app/(tabs)/search.tsx` | Accept optional `q` param; desktop story popover; rail-friendly error |
| `apps/app/app/(tabs)/bookmarks.tsx` | Desktop story popover if applicable; rail already from shell |
| `apps/app/app/(tabs)/profile.tsx` | Desktop: zero bottom tab clearance; content fits rail |
| `apps/app/app/article/[id].tsx` | No full-bleed stretch; rely on shell rail |
| `apps/app/app/city.tsx` | Same |
| `apps/app/__tests__/useBreakpoint.test.ts` | Breakpoint mapping |
| `apps/app/__tests__/desktopShell.test.tsx` | AppShell passthrough + sidebar active |
| `apps/app/__tests__/storyOptionsPopover.test.tsx` | Escape / outside close |
| `apps/app/__tests__/desktopHeroRow.test.tsx` | Renders N cards |
| `apps/app/__tests__/breakingNewsCarousel.test.tsx` | Must still pass after extract |

---

### Task 1: Breakpoints token + `useBreakpoint` hook

**Files:**
- Modify: `apps/app/src/theme/tokens.ts`
- Create: `apps/app/src/hooks/useBreakpoint.ts`
- Test: `apps/app/__tests__/useBreakpoint.test.ts`

**Interfaces:**
- Consumes: `useWindowDimensions` from `react-native`
- Produces:
  - `breakpoints = { mobile: 0, tablet: 768, desktop: 1024, wide: 1440 }`
  - `SIDEBAR_WIDTH = 240`, `CONTENT_RAIL_MAX = 720`, `ERROR_COLUMN_MAX = 400`
  - `export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide'`
  - `export function breakpointFromWidth(width: number): Breakpoint`
  - `export function useBreakpoint(): Breakpoint`
  - `export function isDesktopLayout(bp: Breakpoint): boolean` — true for `desktop` | `wide`
  - `export function isCompactNav(bp: Breakpoint): boolean` — true for `mobile` | `tablet`

- [ ] **Step 1: Write the failing test**

```ts
import { breakpointFromWidth, isCompactNav, isDesktopLayout } from '../src/hooks/useBreakpoint'

describe('breakpointFromWidth', () => {
  it('maps boundaries', () => {
    expect(breakpointFromWidth(320)).toBe('mobile')
    expect(breakpointFromWidth(767)).toBe('mobile')
    expect(breakpointFromWidth(768)).toBe('tablet')
    expect(breakpointFromWidth(1023)).toBe('tablet')
    expect(breakpointFromWidth(1024)).toBe('desktop')
    expect(breakpointFromWidth(1439)).toBe('desktop')
    expect(breakpointFromWidth(1440)).toBe('wide')
    expect(breakpointFromWidth(1600)).toBe('wide')
  })

  it('classifies layout helpers', () => {
    expect(isDesktopLayout('desktop')).toBe(true)
    expect(isDesktopLayout('wide')).toBe(true)
    expect(isDesktopLayout('tablet')).toBe(false)
    expect(isCompactNav('mobile')).toBe(true)
    expect(isCompactNav('tablet')).toBe(true)
    expect(isCompactNav('desktop')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @newsfeed/app test -- useBreakpoint.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Add tokens + implement hook**

Append to `tokens.ts`:

```ts
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const

export const SIDEBAR_WIDTH = 240
export const CONTENT_RAIL_MAX = 720
export const ERROR_COLUMN_MAX = 400
```

Create `useBreakpoint.ts`:

```ts
import { useWindowDimensions } from 'react-native'
import { breakpoints } from '../theme/tokens'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide'

export function breakpointFromWidth(width: number): Breakpoint {
  if (width >= breakpoints.wide) return 'wide'
  if (width >= breakpoints.desktop) return 'desktop'
  if (width >= breakpoints.tablet) return 'tablet'
  return 'mobile'
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions()
  return breakpointFromWidth(width)
}

export function isDesktopLayout(bp: Breakpoint): boolean {
  return bp === 'desktop' || bp === 'wide'
}

export function isCompactNav(bp: Breakpoint): boolean {
  return bp === 'mobile' || bp === 'tablet'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @newsfeed/app test -- useBreakpoint.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/theme/tokens.ts apps/app/src/hooks/useBreakpoint.ts apps/app/__tests__/useBreakpoint.test.ts
git commit -m "$(cat <<'EOF'
feat: add breakpoints and useBreakpoint hook

EOF
)"
```

---

### Task 2: Extract `BreakingHeroCard` (behavior-identical)

**Files:**
- Create: `apps/app/src/components/BreakingHeroCard.tsx`
- Modify: `apps/app/src/components/BreakingNewsCarousel.tsx` (replace local `HeroCard` with import)
- Test: existing `apps/app/__tests__/breakingNewsCarousel.test.tsx` (must stay green)

**Interfaces:**
- Consumes: `ArticleResponse`, tokens, `Badge`, `ImageBottomFade`, Moti
- Produces:
  - `export function BreakingHeroCard(props: { article: ArticleResponse; index: number; width: number; onPress: (a: ArticleResponse) => void; style?: ViewStyle })`

**Approach:** Move the existing private `HeroCard` body into `BreakingHeroCard.tsx` unchanged. Carousel keeps the same FlatList / dots / snap behavior and only swaps the render call. This is the only allowed edit to the carousel file — no desktop props, no mode flags.

- [ ] **Step 1: Run existing carousel test as characterization baseline**

Run: `pnpm --filter @newsfeed/app test -- breakingNewsCarousel.test.tsx`

Expected: PASS

- [ ] **Step 2: Extract component and update carousel import**

Move `HeroCard` markup into `BreakingHeroCard.tsx`. In carousel:

```tsx
import { BreakingHeroCard } from './BreakingHeroCard'
// ...
renderItem={({ item, index }) => (
  <BreakingHeroCard article={item} index={index} width={cardWidth} onPress={onPress} />
)}
```

- [ ] **Step 3: Re-run carousel tests**

Run: `pnpm --filter @newsfeed/app test -- breakingNewsCarousel.test.tsx`

Expected: PASS (identical behavior)

- [ ] **Step 4: Commit**

```bash
git add apps/app/src/components/BreakingHeroCard.tsx apps/app/src/components/BreakingNewsCarousel.tsx
git commit -m "$(cat <<'EOF'
refactor: extract BreakingHeroCard for shared hero presentation

EOF
)"
```

---

### Task 3: `ContentRail` + `AppShell` (passthrough + desktop chrome)

**Files:**
- Create: `apps/app/src/components/desktop/ContentRail.tsx`
- Create: `apps/app/src/components/desktop/AppShell.tsx`
- Create: `apps/app/src/components/desktop/index.ts`
- Modify: `apps/app/app/_layout.tsx`
- Test: `apps/app/__tests__/desktopShell.test.tsx`

**Interfaces:**
- Consumes: `useBreakpoint`, `isDesktopLayout`, `isCompactNav`, `SIDEBAR_WIDTH`, `CONTENT_RAIL_MAX`, `colors`, `space`
- Produces:
  - `ContentRail({ children }: { children: React.ReactNode })`
  - `AppShell({ children, sidebar }: { children: React.ReactNode; sidebar?: React.ReactNode })`
  - Compact: `return children` (no wrapper)
  - Desktop: row with `sidebar` + flex main containing `ContentRail` around `children`

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { AppShell } from '../src/components/desktop/AppShell'

jest.mock('../src/hooks/useBreakpoint', () => ({
  useBreakpoint: jest.fn(),
  isDesktopLayout: (bp: string) => bp === 'desktop' || bp === 'wide',
  isCompactNav: (bp: string) => bp === 'mobile' || bp === 'tablet',
}))

const { useBreakpoint } = require('../src/hooks/useBreakpoint')

it('passthrough on mobile — no shell chrome', () => {
  useBreakpoint.mockReturnValue('mobile')
  const { toJSON } = render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('ChildOnly')).toBeTruthy()
  expect(screen.queryByText('Sidebar')).toBeNull()
  // tree root should be the child text node path, not a shell row labeled AppShell
  expect(JSON.stringify(toJSON())).not.toContain('Desktop shell')
})

it('renders sidebar on desktop', () => {
  useBreakpoint.mockReturnValue('desktop')
  render(
    <AppShell sidebar={<Text>Sidebar</Text>}>
      <Text>ChildOnly</Text>
    </AppShell>,
  )
  expect(screen.getByText('Sidebar')).toBeTruthy()
  expect(screen.getByText('ChildOnly')).toBeTruthy()
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm --filter @newsfeed/app test -- desktopShell.test.tsx`

- [ ] **Step 3: Implement `ContentRail` and `AppShell`**

`AppShell` compact branch **must** be:

```tsx
if (isCompactNav(bp)) {
  return children
}
```

Desktop branch: `View` row (`flex:1`, `flexDirection:'row'`, `backgroundColor: colors.background`) with sidebar slot + main (`flex:1`) wrapping `ContentRail`.

`ContentRail`: outer `flex:1`, inner column `maxWidth: CONTENT_RAIL_MAX`, `width: '100%'`, `alignSelf: 'center'`, vertical padding `space.xl`.

Wire in `app/_layout.tsx` around `<Stack>` (sidebar can be `null` until Task 4 — pass `sidebar={null}` or omit and treat missing sidebar as empty). Prefer accepting optional `sidebar` so Task 4 plugs `DesktopSidebar` without reworking the root again.

Until sidebar exists, root can use:

```tsx
<AppShell>{/* Stack */}</AppShell>
```

and Task 4 updates root to pass sidebar. Alternatively create a tiny `DesktopChrome` wrapper in Task 4 — pick one path and keep root changes minimal.

**Recommended:** In this task, `AppShell` accepts optional `sidebar`. Root wraps Stack now with no sidebar. Task 4 adds sidebar at root.

- [ ] **Step 4: Tests PASS + `pnpm --filter @newsfeed/app lint`**

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/components/desktop/ContentRail.tsx apps/app/src/components/desktop/AppShell.tsx apps/app/src/components/desktop/index.ts apps/app/app/_layout.tsx apps/app/__tests__/desktopShell.test.tsx
git commit -m "$(cat <<'EOF'
feat: add AppShell and ContentRail for desktop layout

EOF
)"
```

---

### Task 4: `DesktopSidebar` + hide tab bar on desktop

**Files:**
- Create: `apps/app/src/components/desktop/DesktopSidebar.tsx`
- Modify: `apps/app/app/_layout.tsx` (pass sidebar into `AppShell`)
- Modify: `apps/app/app/(tabs)/_layout.tsx` (hide tab bar when desktop)
- Test: extend `apps/app/__tests__/desktopShell.test.tsx`

**Interfaces:**
- Consumes: `usePathname` / `useRouter` from `expo-router`, lucide icons (`Home`, `Globe`, `Bookmark`, `User`) matching tabs layout, `SIDEBAR_WIDTH`, accent tokens, Moti optional for hover/active
- Produces: `DesktopSidebar()` with items:
  - Home → `/(tabs)` or `/(tabs)/index`
  - Discover → `/(tabs)/search`
  - Bookmarks → `/(tabs)/bookmarks`
  - Profile → `/(tabs)/profile`
- Active row: left accent bar **or** `colors.accentSoft` filled pill + `colors.accent` icon/label (same tokens as mobile active tab)
- Hover (web): subtle `accentSoft` / surface tint — no hover-only content
- Focus: visible outline / ring on web (`outlineStyle` / border) — do not set `outlineWidth: 0` without replacement
- `accessibilityRole="navigation"` on container; each item `accessibilityRole="link"` or `button` with `accessibilityState={{ selected }}`

**Tab bar hide:**

```tsx
const bp = useBreakpoint()
const desktop = isDesktopLayout(bp)
// in tabBarStyle:
...(desktop ? { display: 'none' as const, height: 0, marginBottom: 0, overflow: 'hidden' as const } : null),
```

Keep `TabIcon` untouched. Prefer style-only hide so the tab navigator stays mounted (mitigates Moti flash on resize). Manually verify resize across 1024 on web after this task.

- [ ] **Step 1: Write failing test for active nav label**

Mock `usePathname` to `'/bookmarks'` (or whatever expo-router returns in tests), render `DesktopSidebar`, assert Bookmarks selected / Home not selected via `accessibilityState` or testID `sidebar-nav-bookmarks`.

- [ ] **Step 2: Implement sidebar + wire root + hide tab bar**

- [ ] **Step 3: Run tests + lint**

Run: `pnpm --filter @newsfeed/app test -- desktopShell.test.tsx && pnpm --filter @newsfeed/app lint`

- [ ] **Step 4: Manual check** — web resize 900 ↔ 1100: tab bar appears/disappears without active-dot flash; sidebar appears only ≥1024.

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/components/desktop/DesktopSidebar.tsx apps/app/app/_layout.tsx apps/app/app/\(tabs\)/_layout.tsx apps/app/__tests__/desktopShell.test.tsx
git commit -m "$(cat <<'EOF'
feat: add DesktopSidebar and hide tab bar on desktop

EOF
)"
```

---

### Task 5: `DesktopTopBar` + Discover `q` param

**Files:**
- Create: `apps/app/src/components/desktop/DesktopTopBar.tsx`
- Modify: `apps/app/app/(tabs)/index.tsx` (desktop uses `DesktopTopBar` instead of `HomeTopBar`)
- Modify: `apps/app/app/(tabs)/search.tsx` (read optional `q` from `useLocalSearchParams`)

**Interfaces:**
- Produces: `DesktopTopBar({ cityTitle?: string; onCityPress: () => void })`
- Search: collapsed icon → expands `TextInput` on press/focus; Escape / blur-when-empty collapses
- On submit (Enter): `router.push({ pathname: '/(tabs)/search', params: { q: trimmed, from: 'home' } })` — does **not** replace Discover as a destination
- City pill still navigates to `/city` (same as mobile)
- Do **not** modify `HomeTopBar.tsx`

Discover change (minimal):

```ts
const params = useLocalSearchParams<{ category?: string; from?: string; q?: string }>()
useEffect(() => {
  if (typeof params.q === 'string' && params.q.length > 0) {
    setQuery(params.q)
  }
}, [params.q])
```

- [ ] **Step 1: Implement `DesktopTopBar`**

- [ ] **Step 2: Branch in home screen**

```tsx
const bp = useBreakpoint()
const desktop = isDesktopLayout(bp)
// ...
{desktop ? (
  <DesktopTopBar cityTitle={...} onCityPress={...} />
) : (
  <HomeTopBar ... onSearchPress={goDiscover} />
)}
```

- [ ] **Step 3: Wire Discover `q` + run feed tests**

Run: `pnpm --filter @newsfeed/app test -- feed.test.tsx`

Expected: PASS (mobile path unchanged when width mocked default)

- [ ] **Step 4: Commit**

```bash
git add apps/app/src/components/desktop/DesktopTopBar.tsx apps/app/app/\(tabs\)/index.tsx apps/app/app/\(tabs\)/search.tsx
git commit -m "$(cat <<'EOF'
feat: add DesktopTopBar with expandable search

EOF
)"
```

---

### Task 6: `DesktopHeroRow`

**Files:**
- Create: `apps/app/src/components/desktop/DesktopHeroRow.tsx`
- Modify: `apps/app/app/(tabs)/index.tsx`
- Test: `apps/app/__tests__/desktopHeroRow.test.tsx`

**Interfaces:**
- Consumes: `BreakingHeroCard`, `ArticleResponse`, `CONTENT_RAIL_MAX` / parent width, `space`
- Produces: `DesktopHeroRow({ articles: ArticleResponse[]; onPress: (a: ArticleResponse) => void })`
- Show first 2 cards when rail is narrow-ish, 3 when wide enough — practical rule: if `articles.length >= 3` and parent width ≥ ~640 show 3, else min(2, length). Use measured parent width via `onLayout` or `useWindowDimensions` minus `SIDEBAR_WIDTH` on desktop.
- Horizontal `View`/`ScrollView` row (not carousel dots); equal flex children with gap `space.sm`
- Do **not** import or wrap `BreakingNewsCarousel`

Home branch:

```tsx
{desktop ? (
  <DesktopHeroRow articles={breaking} onPress={openArticle} />
) : (
  <BreakingNewsCarousel articles={breaking} onPress={openArticle} />
)}
```

- [ ] **Step 1: Failing test — renders 3 headlines when given 3+ articles**

- [ ] **Step 2: Implement + wire home**

- [ ] **Step 3: Tests pass**

- [ ] **Step 4: Commit**

```bash
git add apps/app/src/components/desktop/DesktopHeroRow.tsx apps/app/app/\(tabs\)/index.tsx apps/app/__tests__/desktopHeroRow.test.tsx
git commit -m "$(cat <<'EOF'
feat: add DesktopHeroRow for multi-card breaking news

EOF
)"
```

---

### Task 7: `StoryOptionsPopover`

**Files:**
- Create: `apps/app/src/components/desktop/StoryOptionsPopover.tsx`
- Modify: `apps/app/app/(tabs)/index.tsx`, `search.tsx`, `bookmarks.tsx` (wherever `BottomSheet` story actions are used)
- Test: `apps/app/__tests__/storyOptionsPopover.test.tsx`

**Interfaces:**
- Consumes: same section shape as mobile — reuse `BottomSheetSection` / `BottomSheetItem` types from `ui/BottomSheet` (import types only; do not modify sheet behavior)
- Produces:
  ```ts
  StoryOptionsPopover({
    visible: boolean
    anchor: { x: number; y: number; width: number; height: number } | null
    title?: string
    sections: BottomSheetSection[]
    onClose: () => void
  })
  ```
- Position near anchor (below-end of ⋯); Moti opacity/scale 150–220ms
- Outside press + Escape (`keydown` on web via `useEffect`) call `onClose`
- Keyboard focus trap not required for v1; ensure first action is tabbable and focus ring visible

Screen wiring pattern:

```tsx
const desktop = isDesktopLayout(useBreakpoint())
// keep building storySections as today
{desktop ? (
  <StoryOptionsPopover
    visible={actionArticle != null}
    anchor={popoverAnchor}
    sections={storySections}
    onClose={() => setActionArticle(null)}
  />
) : (
  <BottomSheet visible={...} sections={storySections} onClose={...} />
)}
```

Capture anchor from the more-button layout if needed: extend the `onMorePress` call site with a measureInWindow callback **in the screen**, not by changing `CompactArticleCard` defaults. Prefer:

```tsx
onMorePress={(article) => {
  setActionArticle(article)
  // optional: store last pointer position from a wrapper Pressable on desktop only
}}
```

If measuring without editing `CompactArticleCard` is awkward, allow a **desktop-only wrapper** around the card list item that provides the ⋯ menu — do not add required new props to `CompactArticleCard`. Optional prop with default `undefined` that does not change rendering is acceptable only if defaults stay identical; prefer zero changes to the card file.

- [ ] **Step 1: Failing tests — Escape and outside press call onClose**

- [ ] **Step 2: Implement popover**

- [ ] **Step 3: Wire desktop branches on home/discover/bookmarks**

- [ ] **Step 4: Run related tests**

Run: `pnpm --filter @newsfeed/app test -- feed.test.tsx storyOptionsPopover.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/components/desktop/StoryOptionsPopover.tsx apps/app/app/\(tabs\)/index.tsx apps/app/app/\(tabs\)/search.tsx apps/app/app/\(tabs\)/bookmarks.tsx apps/app/__tests__/storyOptionsPopover.test.tsx
git commit -m "$(cat <<'EOF'
feat: add StoryOptionsPopover for desktop story actions

EOF
)"
```

---

### Task 8: Tablet grid + error column + profile/article/city rail fit

**Files:**
- Modify: `apps/app/app/(tabs)/index.tsx` (tablet `numColumns={2}` for article rows; desktop stays 1)
- Modify: `apps/app/app/(tabs)/profile.tsx` (when desktop, skip extra tab clearance / full-bleed assumptions)
- Modify: `apps/app/app/article/[id].tsx` and `apps/app/app/city.tsx` if they use full-bleed widths — constrain inner content with `maxWidth: CONTENT_RAIL_MAX` only when **not** already inside rail, **or** rely solely on AppShell rail (prefer relying on shell; only add local maxWidth if stack scenes escape the rail)
- Modify error rendering on home/discover to wrap `ErrorState` in a centered box `maxWidth: ERROR_COLUMN_MAX` when `isDesktopLayout`

**Tablet grid approach:**

Use `useBreakpoint()`; when `bp === 'tablet'`, render article items in a 2-column layout. Practical options (pick one, keep mobile FlatList path identical):

1. `numColumns={bp === 'tablet' ? 2 : 1}` with `key={bp}` to force remount when crossing breakpoints, and adjust `columnWrapperStyle` for gap — only for article rows (breaking/section headers must remain full width → often easier to use two lists or a custom row mapper).
2. Or map articles into `row` pairs on tablet only inside `listData` construction.

Prefer option 2 if `numColumns` fights heterogeneous list headers (`breaking`, `section`). Example:

```ts
// when tablet, emit { kind: 'article-row'; key; left; right? } instead of single articles
```

Mobile list row shape stays as today when `bp === 'mobile'`.

Desktop: single column (mandatory without right rail).

Hover on cards (desktop/web only): wrap each card pressable area in desktop list with `style` hover using `accentSoft` **without** editing `CompactArticleCard.tsx`. On RN web, a parent `View` with `:hover` is limited — use `Pressable` `style={({ hovered }) => ...}` wrapper around the card if needed, or Platform-specific style in the **screen** wrapper `View`.

- [ ] **Step 1: Implement tablet row pairing + desktop error max width**

- [ ] **Step 2: Profile/article/city — confirm they sit in shell rail; fix any full-bleed paddings that break the rail**

- [ ] **Step 3: Run full app tests + lint**

Run: `pnpm --filter @newsfeed/app test && pnpm --filter @newsfeed/app lint`

Expected: all PASS

- [ ] **Step 4: Manual verification checklist**

- 320px: identical mobile chrome (tab bar, carousel, bottom sheet)
- 800px: tab bar visible; home articles 2-col; no sidebar
- 1100px: sidebar; no tab bar; hero row; single column; popover on ⋯
- 1600px: content still capped ~720; no edge-to-edge cards
- Keyboard: tab through sidebar + focus rings visible
- Resize across 1024: no Moti tab-dot flash

- [ ] **Step 5: Commit**

```bash
git add apps/app/app/\(tabs\)/index.tsx apps/app/app/\(tabs\)/profile.tsx apps/app/app/article apps/app/app/city.tsx
git commit -m "$(cat <<'EOF'
feat: tablet article grid and desktop content constraints

EOF
)"
```

---

### Task 9: Isolation audit + dead-code sweep

**Files:**
- Review diffs of: `HomeTopBar`, `CategoryChips`, `BreakingNewsCarousel`, `CompactArticleCard`, `BottomSheet`, `(tabs)/_layout` TabIcon
- Modify: only if accidental edits crept in — revert them
- Update: `apps/app/src/components/desktop/index.ts` barrel completeness

- [ ] **Step 1: Diff audit**

```bash
git diff main -- apps/app/src/components/HomeTopBar.tsx apps/app/src/components/CategoryChips.tsx apps/app/src/components/CompactArticleCard.tsx apps/app/src/components/ui/BottomSheet.tsx
```

Allowed carousel diff: import `BreakingHeroCard` only. Allowed tabs layout diff: `tabBarStyle` hide when desktop only.

- [ ] **Step 2: Remove any temporary duplicated hero/card forks**

- [ ] **Step 3: Final test + lint**

Run: `pnpm --filter @newsfeed/app test && pnpm --filter @newsfeed/app lint`

- [ ] **Step 4: Commit if cleanup needed**

```bash
git commit -m "$(cat <<'EOF'
chore: desktop layer isolation cleanup

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Breakpoints + `useBreakpoint` | T1 |
| AppShell passthrough / desktop chrome | T3 |
| DesktopSidebar + hide tab bar | T4 |
| ContentRail max width | T3 |
| DesktopTopBar expandable search; Discover separate | T5 |
| DesktopHeroRow; carousel untouched (except extract) | T2, T6 |
| StoryOptionsPopover Escape/outside | T7 |
| Tablet 2-col; desktop single column | T8 |
| Error max ~400; profile/article/city in shell | T8 |
| Hover + focus rings | T4, T8 |
| No right rail | Global / all tasks |
| Mobile isolation audit | T9 |

## Deferred (explicit)

- Right rail (city / categories / trending)
- Focus trap inside popover
- Desktop-specific Discover IA beyond `q` handoff
```
