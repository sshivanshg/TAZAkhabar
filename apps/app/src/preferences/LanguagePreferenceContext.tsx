import {
  createContext,
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

type LanguagePreferenceContextValue = {
  ready: boolean
  preferredLanguage: ReadingLanguageCode
  setPreferredLanguage: (code: ReadingLanguageCode) => void
}

const LanguagePreferenceContext = createContext<LanguagePreferenceContextValue | null>(null)

export function LanguagePreferenceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [preferredLanguage, setPreferredLanguageState] = useState<ReadingLanguageCode>('en')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const stored = await getStoredReadingLanguage()
      if (cancelled) {
        return
      }
      setPreferredLanguageState(stored ?? detectDeviceReadingLanguage())
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setPreferredLanguage = useCallback((code: ReadingLanguageCode) => {
    setPreferredLanguageState(code)
    void setStoredReadingLanguage(code)
  }, [])

  const value = useMemo(
    () => ({ ready, preferredLanguage, setPreferredLanguage }),
    [ready, preferredLanguage, setPreferredLanguage],
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
