import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { radius, type AppColors } from '../theme/tokens'

/** Pull-to-refresh indicator — accent bar pulse, not the system spinner. */
export function FeedRefreshIndicator({ visible }: { visible: boolean }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!visible) {
    return null
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: -8 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -8 }}
      transition={{ type: 'timing', duration: 180 }}
      style={styles.wrap}
      accessibilityLabel="Refreshing feed"
      accessibilityLiveRegion="polite"
    >
      <MotiView
        from={{ scaleX: 0.35, opacity: 0.4 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 900,
          loop: true,
        }}
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
