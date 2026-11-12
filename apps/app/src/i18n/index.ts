import { useCallback, useContext } from 'react'
import { LanguagePreferenceContext } from '../preferences/languagePreferenceContextObject'
import { FEED_CATEGORY_LABEL_KEYS, isFeedCategory } from '../theme/tokens'
import { LANGUAGE_TAGS, translateIn, type AppLanguage, type TFunction } from './runtime'

export * from './runtime'

/** Current app-chrome language; English when rendered outside the provider (tests). */
export function useAppLanguage(): AppLanguage {
  return useContext(LanguagePreferenceContext)?.preferredLanguage ?? 'en'
}

export function useT(): TFunction {
  const lang = useAppLanguage()
  return useCallback<TFunction>((key, params) => translateIn(lang, key, params), [lang])
}

/** Reader-facing label for a feed category; unknown (API) categories pass through unchanged. */
export function feedCategoryLabel(t: TFunction, value: string): string {
  return isFeedCategory(value) ? t(FEED_CATEGORY_LABEL_KEYS[value]) : value
}

/**
 * BCP-47 tag for `accessibilityLanguage` (iOS VoiceOver picks the matching voice).
 * Android has no per-view prop (TalkBack detects Devanagari itself); web uses <html lang>.
 */
export function useAccessibilityLanguage(): string {
  return LANGUAGE_TAGS[useAppLanguage()]
}
