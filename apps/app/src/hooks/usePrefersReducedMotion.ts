import { useEffect, useState } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'

/** Respect OS / browser reduced-motion so reader chrome does not animate. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      const apply = () => setReduced(media.matches)
      apply()
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', apply)
        return () => media.removeEventListener('change', apply)
      }
      media.addListener(apply)
      return () => media.removeListener(apply)
    }

    let mounted = true
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) {
        setReduced(value)
      }
    })
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  return reduced
}
