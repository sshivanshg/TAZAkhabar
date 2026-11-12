import { createContext } from 'react'
import type { ReadingLanguageCode } from '../storage/languagePreference'

/**
 * Context object only (no storage imports), so `src/i18n` can read the chosen
 * language without pulling AsyncStorage into every module that translates.
 */
export type LanguagePreferenceContextValue = {
  ready: boolean
  hasSelectedLanguage: boolean
  preferredLanguage: ReadingLanguageCode
  setPreferredLanguage: (code: ReadingLanguageCode) => void
}

export const LanguagePreferenceContext = createContext<LanguagePreferenceContextValue | null>(null)
