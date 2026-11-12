---
name: khabro-ui-system
description: Khabro visual and UX system: brand, colors, typography, light/dark modes, 40+ readability, components and tokens. Use for any reader, admin or site UI work.
---

# Khabro UI System

Sources: [docs/brand.md](../../../docs/brand.md), [.codex/rules/branding.mdc](../../../.codex/rules/branding.mdc), [frontend-conventions.mdc](../../../.codex/rules/frontend-conventions.mdc).

- Name is exactly `Khabro`; optional Hindi descriptor "ताज़ा खबर, आपके शहर की". No alternate names.
- Light: canvas `#F4F6FA`, surface `#FFFFFF`, headline `#101828`, meta `#667085`, primary blue `#155EEF`, saffron `#FFB000` for freshness/breaking only (never an action color).
- Dark: canvas `#202124`, surface `#292A2D`; solid fills stay `#155EEF`. Readers choose Light/Dark/System.
- Generous type, >=16px base, 44px min targets, direct language for 40+ readers, calm and high contrast.
- Use tokens (`apps/app/src/theme/`), gluestack config and existing components (`apps/app/src/components/`) before new ones. Icon sources in `apps/app/assets/`; do not redraw.
- Craft references: [apple-design](../apple-design/SKILL.md), [ios-design](../ios-design/SKILL.md), [ui-taste](../ui-taste/SKILL.md).
