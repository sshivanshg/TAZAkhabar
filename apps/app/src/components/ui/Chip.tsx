import { type ReactNode } from 'react'
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { colors, HIT_TARGET, radius, space, typography } from '../../theme/tokens'

type Props = {
  label: string
  selected?: boolean
  onPress?: () => void
  onLongPress?: () => void
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

/** Filter / category pill with subtle scale on selection. */
export function Chip({
  label,
  selected = false,
  onPress,
  onLongPress,
  accessibilityLabel,
  style,
  children,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={380}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={style}
    >
      {({ pressed }) => (
        <MotiView
          animate={{ scale: selected ? 1 : 0.96 }}
          transition={{ type: 'timing', duration: 180 }}
          style={[
            styles.chip,
            selected ? styles.selected : styles.unselected,
            pressed && !selected ? styles.pressed : null,
          ]}
        >
          {children ?? (
            <Text
              fontSize={typography.chip.fontSize}
              lineHeight={typography.chip.lineHeight}
              fontWeight="$medium"
              color={selected ? colors.chipSelectedText : colors.chipInactiveText}
            >
              {label}
            </Text>
          )}
        </MotiView>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    minHeight: HIT_TARGET,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  unselected: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.96,
  },
})
