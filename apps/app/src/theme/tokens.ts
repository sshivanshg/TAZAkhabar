import { Platform, type ViewStyle } from 'react-native'

/**
 * Light UI palette with a single blue accent.
 * Contrast targets (WCAG AA) are documented next to each text token.
 */
export const colors = {
  /** Page canvas — near-white */
  background: '#FAFAFA',
  /** Card / elevated surface */
  surface: '#FFFFFF',
  /** Pressed / secondary fill on light */
  surfaceRaised: '#F0F0F0',
  /** Single blue accent — tabs, chips, links, category pills */
  accent: '#1D7BFF',
  /** Accent pressed / darker hover */
  accentPressed: '#1563D4',
  /** Soft accent wash for selected chip outlines / icon tints */
  accentSoft: 'rgba(29, 123, 255, 0.12)',
  /** Headline on surface/background — ~16:1 on #FAFAFA */
  text: '#1A1A1A',
  /** Summary / supporting body — ~5.5:1 on #FAFAFA */
  textSecondary: '#6B6B6B',
  /** Source / timestamp — AA for small text on white */
  textMuted: '#8A8A8A',
  /** Text on accent fill */
  textOnAccent: '#FFFFFF',
  /** Hairline / chip outline */
  border: 'rgba(0, 0, 0, 0.08)',
  borderSolid: '#D6D6D6',
  /** Selected chip fill */
  chipSelectedBg: '#1D7BFF',
  chipSelectedText: '#FFFFFF',
  /** Unselected chip */
  chipInactiveBorder: '#D6D6D6',
  chipInactiveText: '#6B6B6B',
  /** Skeleton shimmer base */
  skeleton: '#E8E8E8',
  /** Dark fade under hero overlay text (legibility on photos) */
  imageFade: '#000000',
  /** Soft card shadow tint */
  shadow: '#000000',
  /** Legacy alias */
  muted: '#8A8A8A',
} as const

/**
 * Rounded design language — use these everywhere instead of ad-hoc radii.
 * sm/md/lg for surfaces; full for pills (chips, primary buttons, search).
 */
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  /** Fully pill-shaped controls (height/2 or larger) */
  full: 9999,
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
  screen: 16,
} as const

/** Image / media sizing used by cards and heroes. */
export const media = {
  thumb: 108,
  heroHeight: 220,
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
  card: elevationShadow(2, 10, 0.08, 3),
  tabBar: elevationShadow(6, 16, 0.12, 8),
} as const

export const typography = {
  headline: { fontSize: 23, lineHeight: 30, fontWeight: '700' as const },
  headlineSm: { fontSize: 17, lineHeight: 24, fontWeight: '700' as const },
  summary: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0.2 },
  chip: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  section: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
} as const

export const CITY_STORAGE_KEY = 'newsfeed.selectedCitySlug'

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
export const TAB_BAR_HEIGHT = 64
/** Breathing room above the floating tab bar for the last list item */
export const TAB_BAR_CONTENT_GAP = 20

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const

export const SIDEBAR_WIDTH = 240
export const CONTENT_RAIL_MAX = 720
export const ERROR_COLUMN_MAX = 400
