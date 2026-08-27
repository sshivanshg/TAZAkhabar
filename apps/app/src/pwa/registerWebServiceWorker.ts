import { Platform } from 'react-native'

/**
 * Registers the installability service worker on web only.
 * Never runs in Expo native.
 */
export function registerWebServiceWorker(): void {
  if (Platform.OS !== 'web') {
    return
  }
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return
  }
  if (!('serviceWorker' in navigator)) {
    return
  }

  const register = () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Optional — install prompt degrades without SW.
    })
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
