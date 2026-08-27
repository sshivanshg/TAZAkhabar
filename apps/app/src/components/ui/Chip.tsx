import { type ReactNode, useMemo } from 'react'
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { radius, space, typography, type AppColors } from '../../theme/tokens'

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
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

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
          // Scale only: Moti cannot interpolate to/from `transparent`.
          animate={{ scale: selected ? 1 : 0.98 }}
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    chip: {
      minHeight: 36,
      paddingHorizontal: space.md,
      borderRadius: radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selected: {
      backgroundColor: c.accentFill,
    },
    unselected: {
      backgroundColor: 'transparent',
    },
    pressed: {
      opacity: 0.7,
    },
  })
}
