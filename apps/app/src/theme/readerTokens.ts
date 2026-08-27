import { Platform, StyleSheet, type ViewStyle } from 'react-native'
import { HIT_TARGET } from './tokens'

/** Light editorial palette for the article reader. */
export const readerColors = {
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
} as const

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

export function readerHeaderChrome(elevated: boolean, reducedMotion: boolean): ViewStyle {
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
      backgroundColor: readerColors.header,
      borderBottomWidth: 0,
      ...web,
    }
  }

  return {
    backgroundColor: readerColors.headerSolid,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: readerColors.sheetBorder,
    ...web,
  }
}
