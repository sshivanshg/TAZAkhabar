import { useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../preferences/ThemePreferenceContext'
import {
  getDeferredInstallPrompt,
  promptInstall,
  subscribeInstallPrompt,
  type BeforeInstallPromptEventLike,
} from '../pwa/installPrompt'
import { radius, space, typography, type AppColors } from '../theme/tokens'
import { getStoredCitySlug } from '../storage/cityPreference'
import { shouldOfferAddToHome } from '../utils/shouldOfferAddToHome'

/** Bump when install UX changes so prior soft-hint dismissals resurface. */
const A2HS_DISMISSED_KEY = 'tazakhabar.a2hs.dismissed.v2'

function isAndroidBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  return /Android/i.test(navigator.userAgent || '')
}

function installHintCopy(canNativeInstall: boolean): string {
  if (canNativeInstall) {
    return 'Install TazaKhabar for quick access from your home screen'
  }
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
 * Soft install hint after city selection. Web mobile browser only;
 * hidden when already installed as PWA, on desktop, and on Expo native.
 * On Android Chrome, uses beforeinstallprompt → native Install dialog.
 * Dismissed once (persisted).
 */
export function AddToHomeBanner() {
  const [eligible, setEligible] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEventLike | null>(
    () => getDeferredInstallPrompt(),
  )
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const canNativeInstall = installEvent != null

  useEffect(() => {
    if (!shouldOfferAddToHome()) {
      setEligible(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const [citySlug, dismissed] = await Promise.all([
          getStoredCitySlug(),
          AsyncStorage.getItem(A2HS_DISMISSED_KEY),
        ])
        if (!cancelled && citySlug && dismissed !== '1') {
          setEligible(true)
        }
      } catch {
        // Ignore storage errors — banner is optional.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return
    }
    return subscribeInstallPrompt(setInstallEvent)
  }, [])

  const dismiss = () => {
    setEligible(false)
    void AsyncStorage.setItem(A2HS_DISMISSED_KEY, '1').catch(() => {})
  }

  const onInstall = () => {
    void (async () => {
      const outcome = await promptInstall()
      if (outcome === 'accepted') {
        setEligible(false)
        void AsyncStorage.setItem(A2HS_DISMISSED_KEY, '1').catch(() => {})
        return
      }
      if (outcome === 'dismissed') {
        // User closed the system dialog — keep our banner unless they hit Dismiss.
        return
      }
    })()
  }

  if (!eligible) {
    return null
  }

  return (
    <View
      style={styles.banner}
      accessibilityLabel={installHintCopy(canNativeInstall)}
    >
      <Text
        flex={1}
        fontSize={typography.meta.fontSize}
        lineHeight={typography.meta.lineHeight}
        fontWeight="$medium"
        color={colors.text}
      >
        {installHintCopy(canNativeInstall)}
      </Text>
      {canNativeInstall ? (
        <Pressable
          onPress={onInstall}
          accessibilityRole="button"
          accessibilityLabel="Install TazaKhabar"
          hitSlop={8}
          style={({ pressed }) => [styles.installBtn, pressed ? styles.pressed : null]}
        >
          <Text
            fontSize={typography.meta.fontSize}
            lineHeight={typography.meta.lineHeight}
            fontWeight="$semibold"
            color={colors.accentFill}
          >
            Install
          </Text>
        </Pressable>
      ) : isAndroidBrowser() ? (
        <Text
          fontSize={typography.meta.fontSize}
          lineHeight={typography.meta.lineHeight}
          fontWeight="$semibold"
          color={colors.accent}
        >
          Menu → Install
        </Text>
      ) : null}
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
    installBtn: {
      minHeight: 44,
      minWidth: 44,
      paddingHorizontal: space.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: c.accentSoft,
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
