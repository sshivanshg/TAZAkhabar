import { Platform, type ViewStyle } from 'react-native'

/**
 * Light UI palette with a single blue accent.
 * Naming kept for existing imports; values match the UI redesign palette.
 */
export const colors = {
  /** Page canvas — crisp editorial white */
  background: '#F4F6FA',
  /** Card / elevated surface */
  surface: '#FFFFFF',
  /** Secondary fill / cancel pill / pressed wash — surfaceAlt */
  surfaceRaised: '#EEF2F6',
  /** Single blue accent — tabs, chips, links, category pills */
  accent: '#155EEF',
  /** Accent pressed */
  accentPressed: '#0F45B8',
  /** Soft accent wash for selected chip / city pill */
  accentSoft: '#E8F0FF',
  /** Headline on surface/background */
  text: '#101828',
  /** Supporting body */
  textSecondary: '#667085',
  /** Source / timestamp / muted labels */
  textMuted: '#475467',
  /** Text on accent fill */
  textOnAccent: '#FFFFFF',
  /** Overlay text on hero images */
  textOnImage: '#FFFFFF',
  textOnImageMuted: 'rgba(255, 255, 255, 0.85)',
  /** Hairline / chip outline */
  border: '#E4E8EF',
  borderSolid: '#D8DFE8',
  /** Selected chip fill */
  chipSelectedBg: '#155EEF',
  chipSelectedText: '#FFFFFF',
  /** Unselected chip */
  chipInactiveBorder: '#DCE2EA',
  chipInactiveText: '#667085',
  /** Skeleton shimmer base */
  skeleton: '#E9EDF4',
  /** Dark fade under hero overlay text */
  imageFade: '#000000',
  /** Soft card shadow tint */
  shadow: '#101828',
  /** Destructive / block actions */
  destructive: '#C73535',
  /** Destructive row wash */
  destructiveSoft: '#FCEBEB',
  /** Legacy alias — same as textMuted */
  muted: '#475467',
  /** Scrim behind sheets */
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const

/**
 * Rounded design language — use these everywhere instead of ad-hoc radii.
 */
export const radius = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  /** Fully pill-shaped controls */
  full: 999,
} as const

/** Shared spacing scale (px). Prefer these over magic numbers. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  /** Screen edge inset used by cards / lists */
  screen: 18,
} as const

/** Image / media sizing used by cards and heroes. */
export const media = {
  /** List card thumbnail (default / mobile) — square, right-aligned like Google News */
  thumb: 96,
  /** Denser list thumbnail (desktop compact rows) */
  thumbDense: 72,
  /** Full-bleed / carousel hero image (text sits below) */
  heroHeight: 200,
  /** Desktop lead hero image */
  heroPrimaryHeight: 240,
  /** Each stacked secondary beside the lead */
  heroSecondaryHeight: 134,
  articleHeroHeight: 260,
  cardImageHeight: 188,
} as const

/**
 * Cross-platform elevation. Prefer `boxShadow` on web (RNW deprecates
 * shadowColor/Offset/Opacity/Radius) and classic shadow props on native.
 */
function elevationShadow(
  offsetY: number,
  blur: number,
  opacity: number,
  elevation: number,
): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    } as ViewStyle
  }
  return {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  }
}

export const shadows = {
  card: elevationShadow(10, 28, 0.08, 4),
  tabBar: elevationShadow(12, 28, 0.14, 10),
} as const

/**
 * Type scale — names kept for imports; sizes match redesign h1–label.
 */
export const typography = {
  /** ~h1 */
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.5 },
  /** ~h2 — app title, section titles */
  section: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.35 },
  /** ~h3 — hero headline, card section titles */
  headlineSm: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.2 },
  /** Legacy large headline */
  headline: { fontSize: 21, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.35 },
  /** ~body */
  summary: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySemibold: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  /** ~caption */
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0.2 },
  /** ~label — chips, badges, uppercase section headers */
  label: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.4 },
  chip: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
} as const

export const CITY_STORAGE_KEY = 'tazakhabar.selectedCitySlug'

export const FEED_CATEGORIES = [
  'All',
  'Local',
  'Health',
  'Sports',
  'Business',
  'State',
] as const

export type FeedCategory = (typeof FEED_CATEGORIES)[number]

export function isFeedCategory(value: string | undefined | null): value is FeedCategory {
  return value != null && (FEED_CATEGORIES as readonly string[]).includes(value)
}

export const PAGE_SIZE = 20

/** Hero carousel shows this many lead stories */
export const BREAKING_NEWS_COUNT = 5

/** Floating tab bar height — keep in sync with tabBarStyle.height in (tabs)/_layout */
export const TAB_BAR_HEIGHT = 72
/** Breathing room above the floating tab bar for the last list item */
export const TAB_BAR_CONTENT_GAP = 20

/** Wide-web tab bar max width (centered) */
export const TAB_BAR_MAX_WIDTH = 560

/** Minimum touch target (a11y) */
export const HIT_TARGET = 44

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const

export const SIDEBAR_WIDTH = 240
export const CONTENT_RAIL_MAX = 720
export const ERROR_COLUMN_MAX = 400
