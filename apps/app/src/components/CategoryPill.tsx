import { StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { colors, radius, space, typography } from '../theme/tokens'

type Props = {
  label: string
  /** Filled blue pill (hero overlay) vs soft outline on light cards */
  variant?: 'filled' | 'soft'
}

/** Category tag badge — blue accent, used on hero cards and compact rows. */
export function CategoryPill({ label, variant = 'filled' }: Props) {
  const filled = variant === 'filled'
  return (
    <View
      style={[styles.base, filled ? styles.filled : styles.soft]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text
        fontSize={typography.meta.fontSize}
        lineHeight={typography.meta.lineHeight}
        fontWeight="$semibold"
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
    paddingHorizontal: space.sm - 2,
    paddingVertical: space.xxs,
    borderRadius: radius.full,
    maxWidth: '100%',
  },
  filled: {
    backgroundColor: colors.accent,
  },
  soft: {
    backgroundColor: colors.accentSoft,
  },
})
