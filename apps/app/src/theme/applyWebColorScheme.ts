import { Platform } from 'react-native'
import type { AppColors, ColorScheme } from '../theme/tokens'

/** Keep document / browser chrome in sync with the resolved reader scheme (web only). */
export function applyWebColorScheme(scheme: ColorScheme, colors: AppColors): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.style.colorScheme = scheme
  root.style.backgroundColor = colors.background

  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', colors.background)
}
