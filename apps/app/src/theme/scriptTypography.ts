import type { AppLanguage } from '../i18n/runtime'

/**
 * Devanagari has shirorekha + matras: tight or wide tracking breaks the
 * headline bar and uppercase is meaningless. In Hindi every letterSpacing is 0.
 */
export function scriptTracking(lang: AppLanguage, value: number): number {
  return lang === 'hi' ? 0 : value
}

/** Minimum Hindi eyebrow size (uppercase labels in English). */
const HI_EYEBROW_SIZE = 14
const HI_EYEBROW_LINE = 20

type AnyStyle = Record<string, unknown>

/**
 * Pure: return a Hindi-safe copy of a StyleSheet-like object. English returns
 * the input untouched (same identity). Styles without tracking/uppercase are reused.
 */
export function adaptStylesForScript<T extends Record<string, AnyStyle>>(styles: T, lang: AppLanguage): T {
  if (lang !== 'hi') return styles
  const out: Record<string, AnyStyle> = {}
  for (const [name, style] of Object.entries(styles)) {
    const hasTracking = typeof style.letterSpacing === 'number' && style.letterSpacing !== 0
    const uppercase = style.textTransform === 'uppercase'
    if (!hasTracking && !uppercase) {
      out[name] = style
      continue
    }
    const next: AnyStyle = { ...style }
    if (hasTracking) next.letterSpacing = 0
    if (uppercase) {
      next.textTransform = 'none'
      if (typeof next.fontSize === 'number' && next.fontSize < HI_EYEBROW_SIZE) next.fontSize = HI_EYEBROW_SIZE
      if (typeof next.lineHeight === 'number' && next.lineHeight < HI_EYEBROW_LINE) next.lineHeight = HI_EYEBROW_LINE
    }
    out[name] = next
  }
  return out as T
}
