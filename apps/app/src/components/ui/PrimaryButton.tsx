import { type ReactNode, useMemo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../../theme/tokens'

type CommonProps = {
  label: string
  onPress: () => void
  accessibilityLabel?: string
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
  fullWidth?: boolean
  children?: ReactNode
}

/** Solid accent CTA — error retry, change city, sheet primary actions. */
export function PrimaryButton({
  label,
  onPress,
  accessibilityLabel,
  disabled,
  loading,
  style,
  fullWidth,
}: CommonProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      style={({ pressed }) => [
        styles.base,
        styles.primary,
        fullWidth ? styles.fullWidth : null,
        pressed && !disabled ? styles.primaryPressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} />
      ) : (
        <Text
          fontSize={typography.button.fontSize}
          lineHeight={typography.button.lineHeight}
          fontWeight="$semibold"
          color={colors.textOnAccent}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

/**
 * Text / outline secondary — visually distinct from PrimaryButton.
 * Never styled as a white filled duplicate of primary.
 */
export function SecondaryButton({
  label,
  onPress,
  accessibilityLabel,
  disabled,
  style,
  fullWidth,
  outline = false,
}: CommonProps & { outline?: boolean }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.textOnly,
        fullWidth ? styles.fullWidth : null,
        pressed ? styles.secondaryPressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text
        fontSize={typography.button.fontSize}
        lineHeight={typography.button.lineHeight}
        fontWeight="$semibold"
        color={colors.textSecondary}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    base: {
      minHeight: HIT_TARGET,
      paddingHorizontal: space.lg,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
    },
    fullWidth: {
      alignSelf: 'stretch',
      width: '100%',
    },
    primary: {
      backgroundColor: c.accentFill,
    },
    primaryPressed: {
      backgroundColor: c.accentPressed,
      transform: [{ scale: 0.985 }],
    },
    textOnly: {
      backgroundColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: c.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    secondaryPressed: {
      opacity: 0.78,
    },
    disabled: {
      opacity: 0.5,
    },
  })
}
