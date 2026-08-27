import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Appearance, Platform } from 'react-native'
import {
  getStoredThemePreference,
  getSystemColorScheme,
  resolveColorScheme,
  setStoredThemePreference,
  type ThemePreference,
} from '../storage/themePreference'
import {
  getColors,
  getShadows,
  type AppColors,
  type ColorScheme,
} from '../theme/tokens'
import { getReaderColors, type ReaderColors } from '../theme/readerTokens'

type ThemePreferenceContextValue = {
  ready: boolean
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  colorScheme: ColorScheme
  colors: AppColors
  readerColors: ReaderColors
  shadows: ReturnType<typeof getShadows>
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null)

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(() => getSystemColorScheme())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const stored = await getStoredThemePreference()
      if (cancelled) {
        return
      }
      if (stored) {
        setPreferenceState(stored)
      }
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const sync = () => setSystemScheme(getSystemColorScheme())

    const appearanceSub = Appearance.addChangeListener(sync)

    let media: MediaQueryList | null = null
    const onMedia = () => sync()
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      media = window.matchMedia('(prefers-color-scheme: dark)')
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', onMedia)
      } else {
        media.addListener(onMedia)
      }
    }

    return () => {
      appearanceSub.remove()
      if (media) {
        if (typeof media.removeEventListener === 'function') {
          media.removeEventListener('change', onMedia)
        } else {
          media.removeListener(onMedia)
        }
      }
    }
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    void setStoredThemePreference(next)
  }, [])

  const colorScheme = resolveColorScheme(preference, systemScheme)
  const colors = getColors(colorScheme)
  const readerColors = getReaderColors(colorScheme)
  const shadows = getShadows(colorScheme)

  const value = useMemo(
    () => ({
      ready,
      preference,
      setPreference,
      colorScheme,
      colors,
      readerColors,
      shadows,
    }),
    [ready, preference, setPreference, colorScheme, colors, readerColors, shadows],
  )

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  )
}

export function useTheme(): ThemePreferenceContextValue {
  const ctx = useContext(ThemePreferenceContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemePreferenceProvider')
  }
  return ctx
}
