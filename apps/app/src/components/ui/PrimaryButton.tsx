import { type ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { colors, HIT_TARGET, radius, space, typography } from '../../theme/tokens'

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

const styles = StyleSheet.create({
  base: {
    minHeight: HIT_TARGET,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  textOnly: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryPressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
})
