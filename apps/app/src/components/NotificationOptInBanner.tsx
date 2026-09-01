import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
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
      <Modal visible={visible} transparent animationType="none" onRequestClose={onLater}>
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onLater}
            accessibilityRole="button"
            accessibilityLabel="Close news alerts prompt"
          >
            <View style={styles.overlay} />
          </Pressable>
          <MotiView
            from={{ opacity: 0, scale: 0.94, translateY: 12 }}
            animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.94, translateY: visible ? 0 : 12 }}
            transition={{ type: 'timing', duration: 220 }}
            style={styles.card}
          >
            <View style={styles.cardBody}>
              <View style={styles.iconWrap}>
                <BellRing size={20} color={colors.accentFill} strokeWidth={2.2} />
              </View>
              <Text fontSize={22} lineHeight={28} fontWeight="$bold" color={colors.text} mt="$3">
                Stay close to what matters
              </Text>
              <Text fontSize={typography.summary.fontSize} lineHeight={typography.summary.lineHeight} color={colors.textSecondary} mt="$2">
                Get breaking stories from {citySlug}. Alerts are optional and can be turned off anytime in Profile.
              </Text>
              <View style={styles.trustRow}>
                <ShieldAlert size={15} color={colors.textMuted} strokeWidth={2} />
                <Text fontSize={typography.meta.fontSize} lineHeight={typography.meta.lineHeight} color={colors.textMuted}>
                  We will only send important local updates.
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable
                onPress={onLater}
                accessibilityRole="button"
                accessibilityLabel="Not now"
                style={({ pressed }) => [styles.secondaryAction, pressed ? styles.secondaryPressed : null]}
              >
                <Text fontSize={typography.button.fontSize} lineHeight={typography.button.lineHeight} fontWeight="$semibold" color={colors.textSecondary}>
                  Not now
                </Text>
              </Pressable>
              <Pressable
                onPress={onEnable}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Enable news alerts"
                style={({ pressed }) => [styles.primaryAction, pressed ? styles.pressed : null]}
              >
                <Text fontSize={typography.button.fontSize} lineHeight={typography.button.lineHeight} fontWeight="$semibold" color={colors.surface}>
                  {loading ? 'Working…' : 'Enable alerts'}
                </Text>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </Modal>
    </MotiView>
  )
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: space.xl,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 360,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    cardBody: {
      padding: space.xl,
    },
    trustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: space.lg,
    },
    actions: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      minHeight: 58,
    },
    primaryAction: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.sm,
      backgroundColor: colors.accentFill,
    },
    secondaryAction: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.sm,
      backgroundColor: colors.surface,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
    },
    pressed: {
      opacity: 0.86,
    },
    secondaryPressed: {
      backgroundColor: colors.accentSoft,
    },
  })
}
