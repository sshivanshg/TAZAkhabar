import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { radius, type AppColors } from '../theme/tokens'
import { useMotionTransition, usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useT } from '../i18n'

/** Pull-to-refresh indicator — accent bar pulse, not the system spinner. */
export function FeedRefreshIndicator({ visible }: { visible: boolean }) {
  const { colors } = useTheme()
  const t = useT()
  const styles = useMemo(() => createStyles(colors), [colors])
  const reduced = usePrefersReducedMotion()
  const wrapTransition = useMotionTransition({ type: 'timing', duration: 180 })
  // Reduced motion: static full bar, no loop.
  const barTransition = useMotionTransition({ type: 'timing', duration: 900, loop: true })

  if (!visible) {
    return null
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: -8 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -8 }}
      transition={wrapTransition}
      style={styles.wrap}
      accessibilityLabel={t('refresh.a11y')}
      accessibilityLiveRegion="polite"
    >
      <MotiView
        from={reduced ? { scaleX: 1, opacity: 1 } : { scaleX: 0.35, opacity: 0.4 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={barTransition}
        style={styles.bar}
      />
    </MotiView>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      backgroundColor: c.background,
    },
    bar: {
      height: 2,
      width: 48,
      borderRadius: radius.full,
      backgroundColor: c.accent,
    },
  })
}
