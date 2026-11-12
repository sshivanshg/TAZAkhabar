import { Pressable, StyleSheet, Text, View } from 'react-native'
import { iconPress } from '../lib/pressFeedback'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space } from '../theme/tokens'

export const OFFLINE_BANNER_COPY = {
  message: "You're offline. Showing saved stories.",
  retry: 'Retry',
  retryA11y: 'Retry loading the latest stories',
} as const

/** Shown above a cached feed when the latest fetch failed. */
export function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  const { colors } = useTheme()
  return (
    <View
      testID="offline-banner"
      accessibilityLiveRegion="polite"
      style={[styles.root, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
    >
      <Text style={[styles.text, { color: colors.text }]}>{OFFLINE_BANNER_COPY.message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={OFFLINE_BANNER_COPY.retryA11y}
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, iconPress(pressed)]}
        >
          <Text style={[styles.retryText, { color: colors.accent }]}>
            {OFFLINE_BANNER_COPY.retry}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.md,
    marginTop: space.xs,
    paddingLeft: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, fontSize: 16, lineHeight: 22, paddingVertical: space.xs },
  retry: { minHeight: HIT_TARGET, paddingHorizontal: space.md, justifyContent: 'center' },
  retryText: { fontSize: 16, fontWeight: '700' },
})
