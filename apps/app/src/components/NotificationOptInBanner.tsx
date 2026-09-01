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
        <View style={styles.introRow}>
          <View style={styles.iconWrap}>
            <BellRing size={18} color={colors.accentFill} strokeWidth={2.2} />
          </View>
          <View style={styles.textWrap}>
            <Text fontSize={typography.headlineSm.fontSize} lineHeight={typography.headlineSm.lineHeight} fontWeight="$semibold" color={colors.text}>
              Get breaking news for {citySlug}
            </Text>
            <Text fontSize={typography.meta.fontSize} lineHeight={typography.meta.lineHeight} color={colors.textSecondary} mt="$1">
              Alerts are optional and can be turned off in Profile.
            </Text>
          </View>
          <ShieldAlert size={15} color={colors.textMuted} strokeWidth={2} />
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
              {loading ? 'Working…' : 'Enable alerts'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onLater}
            accessibilityRole="button"
            accessibilityLabel="Not now"
            style={({ pressed }) => [styles.secondaryAction, pressed ? styles.secondaryPressed : null]}
          >
            <Text fontSize={typography.label.fontSize} lineHeight={typography.label.lineHeight} fontWeight="$semibold" color={colors.accentFill}>
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    </MotiView>
  )
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    banner: {
      marginHorizontal: space.screen,
      marginBottom: space.xs,
      padding: space.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: space.sm,
    },
    introRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
    },
    actions: {
      flexDirection: 'row',
      gap: space.xs,
      paddingLeft: 34 + space.sm,
    },
    primaryAction: {
      minHeight: 40,
      flex: 1,
      paddingHorizontal: space.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.accentFill,
    },
    secondaryAction: {
      minHeight: 40,
      flex: 1,
      paddingHorizontal: space.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.86,
    },
    secondaryPressed: {
      backgroundColor: colors.accentSoft,
    },
  })
}
