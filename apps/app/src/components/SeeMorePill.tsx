import { useMemo } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import Newspaper from 'lucide-react-native/icons/newspaper'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { radius, space, typography, type AppColors } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'

type Props = {
  onPress: () => void
  accessibilityLabel?: string
}

/** Compact “See more” cluster control — outline pill with a newspaper mark. */
export function SeeMorePill({ onPress, accessibilityLabel = 'See more' }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [styles.pill, pressed ? styles.pressed : null]}
    >
      <Newspaper size={14} strokeWidth={iconStroke} color={colors.accent} />
      <Text
        fontSize={typography.label.fontSize}
        lineHeight={typography.label.lineHeight}
        fontWeight="$semibold"
        color={colors.accent}
      >
        See more
      </Text>
    </Pressable>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      minHeight: 32,
      paddingHorizontal: space.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.surface,
    },
    pressed: {
      backgroundColor: c.accentSoft,
    },
  })
}
