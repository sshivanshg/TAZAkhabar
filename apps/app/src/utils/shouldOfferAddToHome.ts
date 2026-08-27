import { Platform } from 'react-native'

type NavigatorWithStandalone = Navigator & { standalone?: boolean }

/**
 * Install hint is for mobile browsers only — never Expo native, never an
 * already-installed PWA (standalone / fullscreen / iOS home-screen).
 */
export function shouldOfferAddToHome(): boolean {
  if (Platform.OS !== 'web') {
    return false
  }
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  if (isInstalledPwa()) {
    return false
  }

  return isMobileBrowser()
}

function isInstalledPwa(): boolean {
  const nav = navigator as NavigatorWithStandalone
  if (nav.standalone === true) {
    return true
  }

  if (typeof window.matchMedia !== 'function') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  )
}

function isMobileBrowser(): boolean {
  const ua = navigator.userAgent || ''
  // Phone / tablet browsers only. Desktop Chrome install UI is out of scope.
  if (/Android|iPhone|iPad|iPod/i.test(ua)) {
    return true
  }
  // iPadOS 13+ may report as Mac with touch.
  if (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1) {
    return /Macintosh/i.test(ua)
  }
  return false
}
