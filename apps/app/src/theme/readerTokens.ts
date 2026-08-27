import { Platform, StyleSheet, type ViewStyle } from 'react-native'
import { HIT_TARGET, type ColorScheme } from './tokens'

export type ReaderColors = {
  canvas: string
  card: string
  text: string
  textMuted: string
  textSecondary: string
  accent: string
  accentSoft: string
  overlay: string
  sheet: string
  sheetBorder: string
  imageFallback: string
  header: string
  headerSolid: string
  progressTrack: string
  progressFill: string
  attribution: string
}

export const readerColorsLight: ReaderColors = {
  canvas: '#F4F6FA',
  card: '#FFFFFF',
  text: '#101828',
  textMuted: '#667085',
  textSecondary: '#475467',
  accent: '#2855E8',
  accentSoft: '#EAF0FF',
  overlay: 'rgba(16, 24, 40, 0.14)',
  sheet: '#FFFFFF',
  sheetBorder: '#E4E8EF',
  imageFallback: '#D7DEE9',
  header: 'rgba(255, 255, 255, 0.94)',
  headerSolid: 'rgba(255, 255, 255, 0.96)',
  progressTrack: '#E4E8EF',
  progressFill: '#2855E8',
  attribution: '#EEF2F6',
}

export const readerColorsDark: ReaderColors = {
  canvas: '#0F1419',
  card: '#1A222D',
  text: '#F2F4F7',
  textMuted: '#98A2B3',
  textSecondary: '#B0BAC8',
  /** Brighter link blue for dark canvas; soft wash stays near-black for AA */
  accent: '#5B8AFF',
  accentSoft: '#050A14',
  overlay: 'rgba(0, 0, 0, 0.35)',
  sheet: '#1A222D',
  sheetBorder: '#2A3441',
  imageFallback: '#243040',
  header: 'rgba(15, 20, 25, 0.94)',
  headerSolid: 'rgba(15, 20, 25, 0.96)',
  progressTrack: '#2A3441',
  progressFill: '#5B8AFF',
  attribution: '#141A22',
}

/** @deprecated Prefer useTheme().readerColors — light alias for migration / tests */
export const readerColors = readerColorsLight

export function getReaderColors(scheme: ColorScheme): ReaderColors {
  return scheme === 'dark' ? readerColorsDark : readerColorsLight
}

export const ARTICLE_COLUMN_MAX = 720
export const ARTICLE_HEADLINE_MAX = 800
export const ARTICLE_BOTTOM_BAR_HEIGHT = 58
/** Row minHeight + row paddingBottom + progress track — keep in sync with ArticleTopBar. */
export const ARTICLE_TOP_BAR_BODY = HIT_TARGET + 6 + 2

export function articleChromeTop(insetTop: number): number {
  return Math.max(insetTop, 8) + ARTICLE_TOP_BAR_BODY
}

export function articleChromeBottom(insetBottom: number): number {
  return ARTICLE_BOTTOM_BAR_HEIGHT + Math.max(insetBottom, 8)
}

export function readerHeaderChrome(
  elevated: boolean,
  reducedMotion: boolean,
  palette: ReaderColors = readerColorsLight,
): ViewStyle {
  const web: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transitionProperty: 'background-color, border-color, box-shadow',
          transitionDuration: reducedMotion ? '0ms' : '180ms',
        } as ViewStyle)
      : {}

  if (!elevated) {
    return {
      backgroundColor: palette.header,
      borderBottomWidth: 0,
      ...web,
    }
  }

  return {
    backgroundColor: palette.headerSolid,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.sheetBorder,
    ...web,
  }
}
