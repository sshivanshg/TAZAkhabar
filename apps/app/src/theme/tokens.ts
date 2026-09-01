import { Platform, type ViewStyle } from 'react-native'

export type ColorScheme = 'light' | 'dark'

export type AppColors = {
  /** Page canvas */
  background: string
  /** Card / elevated surface */
  surface: string
  /** Secondary fill / cancel pill / pressed wash */
  surfaceRaised: string
  /** Accent for text, icons, borders (may brighten in dark for AA) */
  accent: string
  /** Solid accent fill for primary buttons / selected chips — brand #155EEF */
  accentFill: string
  /** Accent pressed */
  accentPressed: string
  /** Soft accent wash for selected chip / city pill */
  accentSoft: string
  /** Headline on surface/background */
  text: string
  /** Supporting body */
  textSecondary: string
  /** Source / timestamp / muted labels */
  textMuted: string
  /** Text on accent fill */
  textOnAccent: string
  /** Overlay text on hero images */
  textOnImage: string
  textOnImageMuted: string
  /** Hairline / chip outline */
  border: string
  borderSolid: string
  /** Selected chip fill */
  chipSelectedBg: string
  chipSelectedText: string
  /** Unselected chip */
  chipInactiveBorder: string
  chipInactiveText: string
  /** Skeleton shimmer base */
  skeleton: string
  /** Dark fade under hero overlay text */
  imageFade: string
  /** Soft card shadow tint */
  shadow: string
  /** Destructive / remove actions */
  destructive: string
  /** Destructive row wash */
  destructiveSoft: string
  /** Legacy alias — same as textMuted */
  muted: string
  /** Scrim behind sheets */
  overlay: string
  /** Soft badge border wash */
  badgeSoftBorder: string
}

export const colorsLight: AppColors = {
  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceRaised: '#EEF2F6',
  accent: '#155EEF',
  accentFill: '#155EEF',
  accentPressed: '#0F45B8',
  accentSoft: '#E8F0FF',
  text: '#101828',
  textSecondary: '#667085',
  textMuted: '#475467',
  textOnAccent: '#FFFFFF',
  textOnImage: '#FFFFFF',
  textOnImageMuted: 'rgba(255, 255, 255, 0.85)',
  border: '#E4E8EF',
  borderSolid: '#D8DFE8',
  chipSelectedBg: '#155EEF',
  chipSelectedText: '#FFFFFF',
  chipInactiveBorder: '#DCE2EA',
  chipInactiveText: '#667085',
  skeleton: '#E9EDF4',
  imageFade: '#000000',
  shadow: '#101828',
  destructive: '#C73535',
  destructiveSoft: '#FCEBEB',
  muted: '#475467',
  overlay: 'rgba(0, 0, 0, 0.4)',
  badgeSoftBorder: 'rgba(36, 76, 255, 0.08)',
}

export const colorsDark: AppColors = {
  /** Google News–style grey canvas (not navy) */
  background: '#202124',
  surface: '#292A2D',
  surfaceRaised: '#3C4043',
  /** Brighter than brand fill so accent-as-text passes AA on dark soft washes */
  accent: '#8AB4F8',
  accentFill: '#155EEF',
  accentPressed: '#AECBFA',
  accentSoft: '#17181A',
  text: '#E8EAED',
  textSecondary: '#9AA0A6',
  textMuted: '#9AA0A6',
  textOnAccent: '#FFFFFF',
  textOnImage: '#FFFFFF',
  textOnImageMuted: 'rgba(255, 255, 255, 0.85)',
  border: '#3C4043',
  borderSolid: '#5F6368',
  chipSelectedBg: '#155EEF',
  chipSelectedText: '#FFFFFF',
  chipInactiveBorder: '#5F6368',
  chipInactiveText: '#9AA0A6',
  skeleton: '#3C4043',
  imageFade: '#000000',
  shadow: '#000000',
  destructive: '#F28B82',
  destructiveSoft: '#3C1F1E',
  muted: '#9AA0A6',
  overlay: 'rgba(0, 0, 0, 0.55)',
  badgeSoftBorder: 'rgba(138, 180, 248, 0.28)',
}

/** @deprecated Prefer useTheme().colors — light alias for migration / tests */
export const colors = colorsLight

export function getColors(scheme: ColorScheme): AppColors {
  return scheme === 'dark' ? colorsDark : colorsLight
}

/**
 * Rounded design language — use these everywhere instead of ad-hoc radii.
 */
export const radius = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  /** Overflow sheet top corners (Google News–scale rounding) */
  sheet: 28,
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
  screen: 16,
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
  shadowColor: string,
): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    } as ViewStyle
  }
  return {
    shadowColor,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  }
}

export function getShadows(scheme: ColorScheme) {
  const shadow = getColors(scheme).shadow
  return {
    card: elevationShadow(10, 28, scheme === 'dark' ? 0.35 : 0.08, 4, shadow),
    tabBar: elevationShadow(12, 28, scheme === 'dark' ? 0.45 : 0.14, 10, shadow),
  } as const
}

/** @deprecated Prefer getShadows(scheme) / useTheme().shadows */
export const shadows = getShadows('light')

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

/** Reader-facing labels — "All" reads as Google News "For you". */
export const FEED_CATEGORY_LABELS: Record<FeedCategory, string> = {
  All: 'For you',
  Local: 'Local',
  Health: 'Health',
  Sports: 'Sports',
  Business: 'Business',
  State: 'State',
}

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
/** Centered feed column on tablet+ (Google News–scale width). */
export const CONTENT_RAIL_MAX = 1200
/** Right sidebar for local news on desktop/wide. */
export const RIGHT_RAIL_WIDTH = 360
export const ERROR_COLUMN_MAX = 400
