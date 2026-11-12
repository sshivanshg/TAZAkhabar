import { Platform } from 'react-native'
import type { ReadingLanguageCode } from '../storage/languagePreference'
import { en, type StringKey } from './en'
import { hi } from './hi'

export type { StringKey } from './en'
export type AppLanguage = ReadingLanguageCode
export type TParams = Record<string, string | number>
export type TFunction = (key: StringKey, params?: TParams) => string

const CATALOGS: Record<AppLanguage, Record<StringKey, string>> = { en, hi }

/** BCP-47 tags for screen readers and the web `lang` attribute. */
export const LANGUAGE_TAGS: Record<AppLanguage, string> = { en: 'en-IN', hi: 'hi-IN' }

let currentLanguage: AppLanguage = 'en'

/** Called by LanguagePreferenceProvider whenever the chosen app language changes. */
export function setAppLanguage(lang: AppLanguage): void {
  currentLanguage = lang
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.lang = LANGUAGE_TAGS[lang]
  }
}

export function getAppLanguage(): AppLanguage {
  return currentLanguage
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export function translateIn(lang: AppLanguage, key: StringKey, params?: TParams): string {
  const value = CATALOGS[lang][key] || en[key]
  return interpolate(value, params)
}

/** Non-hook translate for toasts, announcements and other calls outside render. */
export function translate(key: StringKey, params?: TParams): string {
  return translateIn(currentLanguage, key, params)
}


/**
 * Reader-facing text for a caught error. Network failures already carry translated copy;
 * server (ApiError) and unknown errors fall back to the screen's translated message.
 */
export function readableErrorMessage(err: unknown, fallback: StringKey): string {
  if (err instanceof Error && err.name !== 'ApiError' && err.message === translate('common.networkError')) {
    return err.message
  }
  return translate(fallback)
}
