import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  detectDeviceReadingLanguage,
  getStoredReadingLanguage,
  setStoredReadingLanguage,
  type ReadingLanguageCode,
} from '../storage/languagePreference'
import { setAppLanguage } from '../i18n/runtime'

import {
  LanguagePreferenceContext,
  type LanguagePreferenceContextValue,
} from './languagePreferenceContextObject'

export { LanguagePreferenceContext }

export function LanguagePreferenceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [preferredLanguage, setPreferredLanguageState] = useState<ReadingLanguageCode>('en')
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const stored = await getStoredReadingLanguage()
      if (cancelled) {
        return
      }
      setPreferredLanguageState(stored ?? detectDeviceReadingLanguage())
      setHasSelectedLanguage(Boolean(stored))
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setPreferredLanguage = useCallback((code: ReadingLanguageCode) => {
    setAppLanguage(code)
    setPreferredLanguageState(code)
    setHasSelectedLanguage(true)
    void setStoredReadingLanguage(code)
  }, [])

  // Keep the non-hook translate() (toasts, announcements) in sync with the chosen language.
  // Synced in the setter (before re-render) and in this effect — never during render.
  useEffect(() => {
    setAppLanguage(preferredLanguage)
  }, [preferredLanguage])

  const value = useMemo(
    () => ({ ready, hasSelectedLanguage, preferredLanguage, setPreferredLanguage }),
    [ready, hasSelectedLanguage, preferredLanguage, setPreferredLanguage],
  )

  return (
    <LanguagePreferenceContext.Provider value={value}>
      {children}
    </LanguagePreferenceContext.Provider>
  )
}

export function useLanguagePreference(): LanguagePreferenceContextValue {
  const ctx = useContext(LanguagePreferenceContext)
  if (!ctx) {
    throw new Error('useLanguagePreference must be used within LanguagePreferenceProvider')
  }
  return ctx
}
