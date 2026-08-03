# ADR-003: Universal Expo client (React Native + Web) from day one

- Status: Accepted
- Date: 2026-08-03
- Deciders: Engineering (2-person team)
- Supersedes: Phase-2-only React Native deferral in ADR-001 notes / earlier scaffold

## Context

The first scaffold used a Vite React PWA (`apps/web`) with React Native deferred. We need a phone-first product (QR flyers → mobile browsers) and will want native store builds later. Maintaining a separate React DOM app and a future RN app doubles UI work for a two-person team.

Expo (React Native) includes **React Native Web**, so one codebase can:

1. Ship the MVP as a static/PWA web app (Cloudflare Pages) now
2. Add iOS/Android binaries later without a second product UI

## Decision

- Use a single client app at `apps/app` (Expo + TypeScript).
- Target **web from day one** via Expo’s web export; deploy that artifact to Cloudflare Pages.
- Do **not** maintain a separate Vite React app.
- Native (iOS/Android) builds are in-scope for the same app when needed; no parallel `apps/web` / `apps/mobile` split.

## Consequences

- UI must use React Native primitives (`View`, `Text`, `Pressable`, etc.) — not raw HTML/CSS — so web and native stay aligned.
- Some web-only APIs need `Platform` forks; keep those thin.
- PWA installability on web is configured through Expo web / manifest settings (not vite-plugin-pwa).
- CI builds `expo export -p web` for Pages; native EAS builds can be added later without restructuring.
- Slightly heavier local tooling (Expo Metro) vs Vite — accepted for one UI codebase.
