import { useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { radius, space, typography, type AppColors } from '../theme/tokens'
import { getStoredCitySlug } from '../storage/cityPreference'

const A2HS_DISMISSED_KEY = 'tazakhabar.a2hs.dismissed.v1'

function installHintCopy(): string {
  // Heuristic: iOS Safari vs other browsers (Chrome install / menu).
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return 'Add TazaKhabar to your home screen for quick access'
  }
  const ua = navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  if (isIOS) {
    return 'On iPhone: tap Share, then Add to Home Screen'
  }
  return 'Install TazaKhabar from your browser menu for quick access'
}

/**
 * Soft install hint after city selection. Dismissed once (persisted).
 * Mount under HomeTopBar on web only.
 */
export function AddToHomeBanner() {
  const [visible, setVisible] = useState(false)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      marginHorizontal: space.screen,
      marginBottom: space.xs,
      paddingHorizontal: space.sm + 2,
      paddingVertical: space.xs,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
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
      backgroundColor: c.accentSoft,
    },
  })
}
