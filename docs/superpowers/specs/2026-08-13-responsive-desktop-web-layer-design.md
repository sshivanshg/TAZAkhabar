# Design: Responsive Web/Desktop Layer for NewsFeed

- Status: Approved
- Date: 2026-08-13
- Scope: Expo universal client (`apps/app`)

## Goal

Make the Expo universal app a genuinely good desktop/web experience via an **additive** layout layer. Phone-width UI stays pixel-identical and behaviorally unchanged. Desktop/web chrome is composed in new files; existing mobile-designed components are not rewritten.

## Non-goals

- Right rail (city / categories / trending) — deferred to a follow-up
- Visual redesign of mobile chrome (floating tab bar, `HomeTopBar`, `BreakingNewsCarousel`, etc.)
- Forking card / badge / button content logic into desktop duplicates
- Changing API, auth, or shared-types contracts
- A second theme/token file

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Shell architecture | Root-level `AppShell` (Approach B) |
| Right rail | None in v1 |
| Shell coverage | Tabs + article detail + city picker |
| Platforms | Web **and** native whenever width ≥ 1024 |
| Desktop search | Header expands inline; Discover remains a separate sidebar destination |
| Story options | New `StoryOptionsPopover` on desktop; mobile keeps `BottomSheet` |
| Breaking news | New `DesktopHeroRow` on desktop; do not modify `BreakingNewsCarousel` |

## Breakpoints

Extend `apps/app/src/theme/tokens.ts`:

```ts
export const breakpoints = {
  mobile: 0,      // < 768
  tablet: 768,    // 768–1023
  desktop: 1024,  // >= 1024
  wide: 1440,     // >= 1440; cap content width beyond this
}
```

Layout constants (same file): `SIDEBAR_WIDTH ≈ 240`, `CONTENT_RAIL_MAX ≈ 720`, error column max ≈ 400.

`useBreakpoint()` (`apps/app/src/hooks/useBreakpoint.ts`) uses `useWindowDimensions` and returns `'mobile' | 'tablet' | 'desktop' | 'wide'`.

Helpers (same module or adjacent):

- `isDesktopLayout` → `desktop | wide`
- `isCompactNav` → `mobile | tablet` (floating tab bar stays)

Reuse this hook everywhere; no ad hoc width checks.

## Architecture

```
Root Stack (app/_layout.tsx)
  └─ AppShell
       ├─ compact (mobile|tablet): true passthrough → children only
       └─ desktop|wide:
            ├─ DesktopSidebar (fixed ~240px)
            └─ ContentRail (max ~720, centered)
                 └─ Stack / Tabs / article / city
```

### AppShell passthrough (hard constraint)

On mobile/tablet, `AppShell` must return `children` with **no** extra wrapping `View` (or other layout node) that could change flex behavior. Only the desktop branch may introduce shell chrome.

### Tab bar on desktop

In `app/(tabs)/_layout.tsx`, when `isDesktopLayout`, hide the Expo tab bar via `tabBarStyle` (e.g. `display: 'none'`). Do **not** edit `TabIcon` / Moti active-dot internals.

**Resize hazard:** Live browser resize across 1024 must not flash Moti active-dot state or otherwise glitch tab-bar mount lifecycle. Prefer a hide strategy that keeps mount stable when possible; verify on web during implementation and adjust if needed.

### Isolation rules

- Do not edit internals of mobile-designed components (`HomeTopBar`, `CategoryChips`, `BreakingNewsCarousel`, `CompactArticleCard`, `BottomSheet`, floating tab bar icons, etc.).
- New desktop logic lives under `apps/app/src/components/desktop/` and the breakpoint hook.
- Screens may branch at the top for layout composition; do not thread breakpoint checks into shared primitives.
- Shared UI primitives (`Card`, `Chip`, `Badge`, buttons) may gain optional `size` / `variant` only if **defaults remain identical** to current mobile output.

## Desktop components

| Component | Role |
|-----------|------|
| `AppShell` | Root chrome switch; compact = passthrough |
| `DesktopSidebar` | Logo/app name + vertical nav (Home, Discover, Bookmarks, Profile); active row = left accent bar or filled pill using existing accent tokens |
| `ContentRail` | Max-width ~720, centered, generous vertical padding |
| `DesktopTopBar` | Desktop header; search expands inline on focus/click (blur/Escape collapses). Mobile `HomeTopBar` unchanged |
| `DesktopHeroRow` | 2–3 visible breaking cards in a horizontal row; composes card content; does **not** wrap or modify `BreakingNewsCarousel` |
| `StoryOptionsPopover` | Anchored ⋯ menu; same section groups/icons as mobile sheet; outside click + Escape; Moti ~150–250ms |

## Per-breakpoint layouts

### Mobile (< 768)

Unchanged. AppShell passthrough; floating tab bar; existing screens/components.

### Tablet (768–1023)

- Floating tab bar kept (compact nav).
- Home article list: **2-column** card grid.
- Breaking news: existing `BreakingNewsCarousel` (no hero row swap).
- Story options: existing `BottomSheet`.
- No sidebar.

### Desktop / wide (≥ 1024)

- Sidebar replaces floating tab bar entirely.
- Main column: single-column feed in `ContentRail` (no right rail → single column is mandatory).
- Home: `DesktopTopBar` + `DesktopHeroRow` + article list; story actions → `StoryOptionsPopover`.
- Discover / Bookmarks / Profile: same data/logic; chrome from shell + rail. Profile as settings-style cards in the rail.
- Article detail + city picker: inside the same shell + rail (no full-bleed stretch on wide viewports).
- Error state: same content/hierarchy as mobile, centered in rail with max-width ~400.

## Interactions (desktop/web)

- Hover tint on sidebar rows and article cards using existing soft accent / surface tokens — no hover-only content unreachable on touch.
- Sidebar and article list keyboard-tabbable with a visible focus ring (never suppress outline without a replacement).
- Popover closes on outside click and Escape.
- Motion via Moti/Reanimated at the established 150–250ms scale for popover and sidebar hover transitions.

## Data & logic sharing

Keep fetch, prefs, bookmark, and story-action handlers in one place per screen. Desktop layouts **compose** existing cards/lists; they do not fork API or storage layers. Prefer extracting shared body/controller only when needed to avoid duplicating data logic between mobile and desktop layout trees.

## File map (expected)

```
apps/app/src/theme/tokens.ts          # + breakpoints, rail/sidebar constants
apps/app/src/hooks/useBreakpoint.ts   # new
apps/app/src/components/desktop/      # AppShell, DesktopSidebar, ContentRail,
                                      # DesktopTopBar, DesktopHeroRow, StoryOptionsPopover
apps/app/app/_layout.tsx              # wrap Stack with AppShell
apps/app/app/(tabs)/_layout.tsx       # hide tab bar when isDesktopLayout (style only)
apps/app/app/(tabs)/*.tsx             # thin layout branches where needed
apps/app/app/article/[id].tsx         # sit inside shell/rail on desktop
apps/app/app/city.tsx                 # sit inside shell/rail on desktop
apps/app/__tests__/                   # breakpoint + popover + sidebar coverage
```

## Verification / definition of done

- Resize 320 → 1600: layout shifts only at defined breakpoints; no broken in-between states.
- Phone-width rendering (web and native) visually and behaviorally unchanged — review diffs of mobile component files for zero regressions.
- No shared/mobile component received new props that change default rendering.
- Sidebar, popover, and desktop hero row are new isolated components — none live inside existing mobile component files.
- Keyboard nav and focus states work on desktop; tablet touch targets ≥ 44×44.
- AppShell compact path is a true children passthrough (no wrapper layout node).
- Live resize across desktop breakpoint does not flash tab-bar Moti active-dot state.
- No dead duplicated mobile forks left behind; desktop composes/reuses card content.

## Out of scope / follow-ups

- Optional right rail (city selector, category quick-filters, trending)
- Further article typography/reading-width tuning beyond the content rail
- Desktop-specific Discover IA beyond current search screen in the rail
```
