import { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { radius, type AppColors } from '../theme/tokens'
import { useMotionTransition } from '../hooks/usePrefersReducedMotion'
import { useAccessibilityLanguage, useT } from '../i18n'

type Props = {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Centered confirm dialog — dark overlay + scale-in card. */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel: confirmLabelProp,
  cancelLabel: cancelLabelProp,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme()
  const a11yLang = useAccessibilityLanguage()
  const t = useT()
  const confirmLabel = confirmLabelProp ?? t('common.block')
  const cancelLabel = cancelLabelProp ?? t('common.cancel')
  const styles = useMemo(() => createStyles(colors), [colors])
  const overlayTransition = useMotionTransition({ type: 'timing', duration: 200 })
  const cardTransition = useMotionTransition({ type: 'timing', duration: 220 })

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLanguage={a11yLang}
          accessibilityLabel={t('common.dismissConfirmation')}
        >
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={overlayTransition}
            style={styles.overlay}
          />
        </Pressable>

        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.94 }}
          transition={cardTransition}
          style={styles.card}
        >
          <VStack space="md" px="$5" pt="$5" pb="$3">
            <Text fontSize={20} lineHeight={28} fontWeight="$bold" color={colors.text}>
              {title}
            </Text>
            <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
              {message}
            </Text>
          </VStack>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLanguage={a11yLang}
              accessibilityLabel={cancelLabel}
              style={({ pressed }) => [styles.actionBtn, pressed ? styles.pressed : null]}
            >
              <Text fontSize={16} lineHeight={22} fontWeight="$semibold" color={colors.textSecondary}>
                {cancelLabel}
              </Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLanguage={a11yLang}
              accessibilityLabel={confirmLabel}
              style={({ pressed }) => [styles.actionBtn, pressed ? styles.pressed : null]}
            >
              <Text fontSize={16} lineHeight={22} fontWeight="$bold" color={colors.destructive}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </MotiView>
      </View>
    </Modal>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    actions: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      minHeight: 52,
    },
    actionBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    actionDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
    },
    pressed: {
      backgroundColor: c.surfaceRaised,
    },
  })
}
