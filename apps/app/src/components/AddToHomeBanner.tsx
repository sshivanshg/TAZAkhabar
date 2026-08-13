import { useEffect, useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from '@gluestack-ui/themed'
import { colors, radius, space, typography } from '../theme/tokens'
import { getStoredCitySlug } from '../storage/cityPreference'

const A2HS_DISMISSED_KEY = 'newsfeed.a2hs.dismissed.v1'

function installHintCopy(): string {
  // Heuristic: iOS Safari vs other browsers (Chrome install / menu).
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return 'Add NewsFeed to your home screen for quick access'
  }
  const ua = navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  if (isIOS) {
    return 'On iPhone: tap Share, then Add to Home Screen'
  }
  return 'Install NewsFeed from your browser menu for quick access'
}

/**
 * Soft install hint after city selection. Dismissed once (persisted).
 * Mount under HomeTopBar on web only.
 */
export function AddToHomeBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [citySlug, dismissed] = await Promise.all([
          getStoredCitySlug(),
          AsyncStorage.getItem(A2HS_DISMISSED_KEY),
        ])
        if (!cancelled && citySlug && dismissed !== '1') {
          setVisible(true)
        }
      } catch {
        // Ignore storage errors — banner is optional.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    void AsyncStorage.setItem(A2HS_DISMISSED_KEY, '1').catch(() => {})
  }

  if (!visible) {
    return null
  }

  return (
    <View
      style={styles.banner}
      accessibilityLabel={installHintCopy()}
    >
      <Text
        flex={1}
        fontSize={typography.meta.fontSize}
        lineHeight={typography.meta.lineHeight}
        fontWeight="$medium"
        color={colors.text}
      >
        {installHintCopy()}
      </Text>
      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss add to home screen hint"
        hitSlop={8}
        style={({ pressed }) => [styles.dismissBtn, pressed ? styles.pressed : null]}
      >
        <Text
          fontSize={typography.meta.fontSize}
          lineHeight={typography.meta.lineHeight}
          fontWeight="$semibold"
          color={colors.accent}
        >
          Dismiss
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.screen,
    marginBottom: space.xs,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dismissBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  pressed: {
    backgroundColor: colors.accentSoft,
  },
})
