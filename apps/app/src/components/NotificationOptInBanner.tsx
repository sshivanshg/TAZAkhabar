import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import BellRing from 'lucide-react-native/icons/bell-ring'
import ShieldAlert from 'lucide-react-native/icons/shield-alert'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { PrimaryButton, SecondaryButton } from './ui/PrimaryButton'
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
  const [error, setError] = useState<string | null>(null)
  const { colors, shadows } = useTheme()
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
    setError(null)
    try {
      await markNotificationPromptShown()
      const result = await registerNewsNotifications(citySlug)
      if (result.status === 'granted') {
        setVisible(false)
        return
      }
      if (result.status === 'denied') {
        if (result.reason) {
          setError(result.reason)
          return
        }
        await suppressNotificationPrompt('denied')
        setVisible(false)
        return
      }
      setError(result.reason)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not enable news alerts.')
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
            style={[styles.card, shadows.card]}
          >
            <View style={styles.cardBody}>
              <View style={styles.iconWrap}>
                <BellRing size={21} color={colors.accentFill} strokeWidth={2} />
              </View>
              <Text
                fontSize={typography.section.fontSize}
                lineHeight={typography.section.lineHeight}
                fontWeight="$bold"
                color={colors.text}
                mt="$4"
                style={styles.title}
              >
                Get important local alerts
              </Text>
              <Text
                fontSize={typography.summary.fontSize}
                lineHeight={typography.summary.lineHeight}
                color={colors.textSecondary}
                mt="$2"
                style={styles.message}
              >
                We will send only breaking stories from {citySlug}. You can turn alerts off anytime in Profile.
              </Text>
              <View style={styles.trustRow}>
                <ShieldAlert size={15} color={colors.textMuted} strokeWidth={2} />
                <Text
                  fontSize={typography.meta.fontSize}
                  lineHeight={typography.meta.lineHeight}
                  color={colors.textMuted}
                  style={styles.trustCopy}
                >
                  No daily noise. Just useful updates.
                </Text>
              </View>
              {error ? (
                <Text
                  fontSize={typography.meta.fontSize}
                  lineHeight={typography.meta.lineHeight}
                  color={colors.destructive}
                  style={styles.error}
                >
                  {error}
                </Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              <SecondaryButton
                label="Not now"
                onPress={onLater}
                accessibilityLabel="Not now"
                style={styles.secondaryAction}
              />
              <PrimaryButton
                label="Enable alerts"
                onPress={onEnable}
                disabled={loading}
                accessibilityLabel="Enable news alerts"
                style={styles.primaryAction}
                loading={loading}
              />
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
      paddingHorizontal: space.md,
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
      maxWidth: 384,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardBody: {
      paddingHorizontal: space.xl,
      paddingTop: space.xl,
      paddingBottom: space.lg,
    },
    title: {
      letterSpacing: typography.section.letterSpacing,
    },
    message: {
      maxWidth: 340,
    },
    trustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: space.md,
    },
    trustCopy: {
      flexShrink: 1,
    },
    error: {
      marginTop: space.md,
      padding: space.sm,
      borderRadius: radius.md,
      backgroundColor: colors.destructiveSoft,
    },
    actions: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: space.xs,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
    },
    primaryAction: {
      minHeight: 48,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
    },
    secondaryAction: {
      minHeight: 48,
      paddingHorizontal: space.sm,
    },
  })
}
