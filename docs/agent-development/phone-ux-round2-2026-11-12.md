# Phone-first UX and motion round 2 — 2026-11-12

Khabro is **phone-first**: judge every change for a one-handed, 40+ reader on a phone. Desktop only has to not break. This builds on PR #46 (`feat/ui-aesthetics-pass`).

## Owner decisions
- **City at first launch:** language → city step ("Use my location", or "Skip, show All India") → tabs.
- **Full Hindi UI:** all app chrome is translated (strings in a catalog, switched by the chosen language). Done in phase 3, after the UX and motion work lands.
- **Offline:** persist the last feed on the device and show it with an offline banner. Cached stories expire after 7 days, matching article retention.
- **In scope:** WhatsApp as the primary share action; the "Profile" tab renamed "Settings"; a next-story cue and a "Back to news" button in the article bottom bar; the article language switch in the bottom bar.

## UX findings (khabro-ux-engineer, web at 390px)
P0
1. Onboarding never asks for a city (`app/language.tsx`, `app/index.tsx`), so readers land on All India. Add the city step.
2. Offline or error is a dead end: English-only copy, the loaded feed isn't shown, and Try again sits high on the screen (`app/(tabs)/index.tsx:~804`, `ui/ErrorState.tsx`). Keep the last feed with a banner, and put Try again in the lower half.
P1
3. The article has no reading-language switch. `LanguageSegment` exists but isn't used; put it in `ArticleBottomBar`.
4. Nothing shows you can swipe to the next story. Add a "Next story ↓" cue (`ArticleStory.tsx` / `CaughtUpFooter.tsx`).
5. Back is only a small top-left arrow. Make sure iOS swipe-back works, and add "Back to news" to the article bottom bar.
6. Share: label it "WhatsApp" with the icon, as the primary action (`ArticleBottomBar.tsx`).
7. Removing a bookmark is instant with no undo (`(tabs)/bookmarks.tsx:~201`). Show a "Removed · Undo" toast.
8. On first launch, English is preselected (`app/language.tsx`). Remove the preselection.
P2
9. Rename the "Profile" tab to "Settings" (`(tabs)/_layout.tsx`).
10. Hide "Turn off" alerts until alerts are on (`profile.tsx:~380`).
11. Blocking a category is hidden behind a long press (`CategoryChips.tsx`). Add an explicit "Manage topics" option.
12. "All India, India" duplicates itself (`CitySearch.tsx`, `CityListItem.tsx`).
13. The eyebrow labels a local story "GLOBAL" (`ArticleStory.tsx`). Show the city or category instead.
14. No confirmation toast after saving or changing city.

## Motion findings (khabro-motion-engineer, code review)
P0
M1. Pager feel (`article/[id].tsx` ~L715): drop `snapToInterval`/`snapToAlignment`; keep `pagingEnabled`, `getItemLayout` and `disableIntervalMomentum`; set `decelerationRate="fast"`.
M2. Bookmark confirmation:
  - optimistic update, with rollback and an error toast if saving fails;
  - Moti scale 1→1.15→1, spring {damping 14, stiffness 220, mass 0.6}, skipped under reduced motion;
  - Light haptic on save;
  - `announceForAccessibility('Saved')`;
  - `accessibilityState.selected`.
M3. Add `expo-haptics` and a `src/lib/haptics.ts` wrapper (no-op on web, try/catch). Use it in only three places:
  - selection on a tab change and on picking a city or language;
  - Light on bookmark save;
  - Success when pull-to-refresh brings new items.
  No haptics on paging.
P1
M4. Skeletons pulse at opacity 0.55↔1 over 1100ms; content fades in 0→1 over 180ms. Skip both under reduced motion.
M5. Add a `useMotionTransition()` helper that returns duration 0 under reduced motion. Apply it to TabScreenShell, BottomSheet, ConfirmModal, CityPickerDropdown, BreakingHeroCard, the categories stagger, language, the tab icon and the FeedRefreshIndicator loop.
M6. BottomSheet: translateY spring {damping 22, stiffness 260, mass 0.9}; backdrop 200ms timing; dismiss 200ms timing.
M7. One shared `pressFeedback`: cards and chips at opacity 0.85 and scale 0.98; icon buttons at opacity 0.6. Every Pressable gets pressed feedback, including Retry.
P2
M8. Tab icon: drop the scale; fade the background colour over 160ms.
M9. Animate row entrance only for `index < 6`.

## Phases and file ownership
Phase 1 runs in parallel. Agents edit only their own files; the coordinator commits.
- **UX-A, onboarding, feed, offline and settings:** `app/language.tsx`, `app/index.tsx`, new `app/city.tsx`, `app/(tabs)/index.tsx`, `ui/ErrorState.tsx`, new offline cache in `src/lib/feedCache.ts` and `src/components/OfflineBanner.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/profile.tsx`, `CategoryChips.tsx`, `CitySearch.tsx`, `CityListItem.tsx`, `useCityPicker.tsx`, and a new shared `src/components/ui/Toast.tsx` (UX-A owns it; B and phase 2 use it). Covers 1, 2, 8, 9, 10, 11, 12, 14 (city).
- **UX-B, article, bookmarks and contact:** `app/article/[id].tsx`, `src/components/article/*`, `CaughtUpFooter.tsx`, `app/(tabs)/bookmarks.tsx`, `app/contact.tsx`. Covers 3, 4, 5, 6, 7, 13, and 14 (save toast via Toast).
- **Motion-1, foundation and isolated components:** `package.json` (expo-haptics), `src/lib/haptics.ts`, `src/hooks/usePrefersReducedMotion.ts` plus `useMotionTransition`, `src/lib/pressFeedback.ts`, `ui/BottomSheet.tsx`, `ConfirmModal.tsx`, `TabScreenShell.tsx`, `FeedRefreshIndicator.tsx`, `BreakingHeroCard.tsx`, `app/(tabs)/categories.tsx`, `CityPickerDropdown.tsx`, `CompactArticleCard.tsx` and its skeleton. Covers M3 (foundation), M5 (its files), M6, M7 (its files), M9.

Phase 2, motion integration in the UX-owned files: M1, M2, M3 call sites, M4 article skeleton, M5/M7 in the remaining files, M8.

Phase 3, full Hindi UI: a string catalog with en and hi, a `useT()` hook driven by the chosen language, and every screen migrated.

Phase 4: a fresh code review, then a design director and UX re-score on the phone.

## QA notes
- The hosted API sends no CORS header for localhost, so web QA needs a proxy. Fix the API CORS for dev origins separately.
- No Simulator.app or Expo Go is installed, so native QA isn't possible yet. No Android emulator either.
