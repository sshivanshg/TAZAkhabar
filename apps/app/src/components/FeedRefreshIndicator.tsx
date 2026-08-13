import { StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import { colors, radius } from '../theme/tokens'

/** Pull-to-refresh indicator — accent bar pulse, not the system spinner. */
export function FeedRefreshIndicator({ visible }: { visible: boolean }) {
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

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  bar: {
    height: 2,
    width: 48,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
})
