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

/** Moti-style transition config (timing or spring). */
export type MotionTransition = {
  type?: 'timing' | 'spring' | 'decay' | 'no-animation'
  duration?: number
  delay?: number
  loop?: boolean
  repeatReverse?: boolean
  damping?: number
  stiffness?: number
  mass?: number
  [key: string]: unknown
}

/** Pure resolver: reduced motion collapses any transition to an instant, non-looping timing. */
export function resolveMotionTransition<T extends MotionTransition>(
  config: T,
  reduced: boolean,
): T | { type: 'timing'; duration: 0; delay: 0; loop: false } {
  return reduced ? { type: 'timing', duration: 0, delay: 0, loop: false } : config
}

/** Returns `config`, or a duration-0 timing when the user prefers reduced motion. */
export function useMotionTransition<T extends MotionTransition>(config: T) {
  return resolveMotionTransition(config, usePrefersReducedMotion())
}
