import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import BellRing from 'lucide-react-native/icons/bell-ring'
import ShieldAlert from 'lucide-react-native/icons/shield-alert'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { getStoredCitySlug } from '../storage/cityPreference'
import {
  getNotificationPromptState,
  shouldRePromptForNotifications,
  type NotificationPromptState,
} from '../storage/notificationPreferences'
import {
  markNotificationPromptShown,
  registerNewsNotifications,
  suppressNotificationPrompt,
} from '../notifications/registerNotifications'
import { radius, space, typography, type AppColors } from '../theme/tokens'

const PROMPT_COOLDOWN_DAYS = 7

export function NotificationOptInBanner() {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [citySlug, setCitySlug] = useState<string | null>(null)
  const [promptState, setPromptState] = useState<NotificationPromptState | null>(null)
  const [visible, setVisible] = useState(false)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [storedCity, storedPrompt] = await Promise.all([
        getStoredCitySlug(),
        getNotificationPromptState(),
      ])
      if (cancelled) {
        return
      }
      setCitySlug(storedCity)
      setPromptState(storedPrompt)
      setVisible(Boolean(storedCity) && shouldRePromptForNotifications(storedPrompt, PROMPT_COOLDOWN_DAYS))
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready || !visible || !citySlug || !promptState) {
    return null
  }

  const onEnable = async () => {
    setLoading(true)
    try {
      await markNotificationPromptShown()
      const result = await registerNewsNotifications(citySlug)
      if (result.status === 'granted') {
        setVisible(false)
        return
      }
      if (result.status === 'denied') {
        await suppressNotificationPrompt('denied')
        setVisible(false)
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const onLater = async () => {
    await suppressNotificationPrompt('dismissed')
    setVisible(false)
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220 }}
    >
      <View style={styles.banner}>
        <View style={styles.iconWrap}>
          <BellRing size={18} color={colors.accentFill} strokeWidth={2.2} />
        </View>
        <View style={styles.textWrap}>
          <Text fontSize={typography.headlineSm.fontSize} lineHeight={typography.headlineSm.lineHeight} fontWeight="$semibold" color={colors.text}>
            Turn on news alerts
          </Text>
          <Text fontSize={typography.meta.fontSize} lineHeight={typography.meta.lineHeight} color={colors.textSecondary} mt="$1">
            Get city-specific breaking stories. We only ask again after a pause if you tap not now.
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={onEnable}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Enable news alerts"
            style={({ pressed }) => [styles.primaryAction, pressed ? styles.pressed : null]}
          >
            <Text fontSize={typography.label.fontSize} lineHeight={typography.label.lineHeight} fontWeight="$semibold" color={colors.surface}>
              {loading ? 'Working…' : 'Enable'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onLater}
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
            style={({ pressed }) => [styles.secondaryAction, pressed ? styles.secondaryPressed : null]}
          >
            <Text fontSize={typography.label.fontSize} lineHeight={typography.label.lineHeight} fontWeight="$semibold" color={colors.accentFill}>
              Maybe later
            </Text>
          </Pressable>
          <View style={styles.notice}>
            <ShieldAlert size={14} color={colors.textMuted} strokeWidth={2} />
            <Text fontSize={typography.meta.fontSize} lineHeight={typography.meta.lineHeight} color={colors.textMuted}>
              One prompt per cooldown window.
            </Text>
          </View>
        </View>
      </View>
    </MotiView>
  )
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    banner: {
      marginHorizontal: space.screen,
      marginBottom: space.sm,
      padding: space.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
    },
    actions: {
      gap: space.xs,
      alignItems: 'flex-end',
    },
    primaryAction: {
      minHeight: 44,
      minWidth: 96,
      paddingHorizontal: space.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.accentFill,
    },
    secondaryAction: {
      minHeight: 44,
      minWidth: 96,
      paddingHorizontal: space.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
      maxWidth: 160,
    },
    pressed: {
      opacity: 0.86,
    },
    secondaryPressed: {
      backgroundColor: colors.accentSoft,
    },
  })
}
