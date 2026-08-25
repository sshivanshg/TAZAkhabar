import { StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { colors, radius, space, typography } from '../../theme/tokens'

type Props = {
  label: string
  /** Solid accent on dark heroes vs soft wash on light cards — same size either way */
  variant?: 'filled' | 'soft'
}

/** Shared category pill — identical size/weight on hero and list cards. */
export function Badge({ label, variant = 'filled' }: Props) {
  const filled = variant === 'filled'
  return (
    <View
      style={[styles.base, filled ? styles.filled : styles.soft]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text
        fontSize={typography.label.fontSize}
        lineHeight={typography.label.lineHeight}
        fontWeight="$medium"
        letterSpacing={typography.label.letterSpacing}
        color={filled ? colors.textOnAccent : colors.accent}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.xs + 4,
    paddingVertical: 4,
    borderRadius: radius.full,
    maxWidth: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  filled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  soft: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(36, 76, 255, 0.08)',
  },
})
