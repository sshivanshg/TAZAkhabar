import { type ReactNode } from 'react'
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { colors, radius, space, typography } from '../../theme/tokens'

type Props = {
  label: string
  selected?: boolean
  onPress?: () => void
  onLongPress?: () => void
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

/** Filter pill — filled accent when selected, quiet text when idle (Google News–like). */
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
          animate={{ scale: selected ? 1 : 0.98 }}
          transition={{ type: 'timing', duration: 160 }}
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
              fontWeight={selected ? '$semibold' : '$medium'}
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
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: colors.accent,
  },
  unselected: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
})
