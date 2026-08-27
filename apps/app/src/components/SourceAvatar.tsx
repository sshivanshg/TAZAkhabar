import { StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { colors, radius } from '../theme/tokens'

type Props = {
  name: string
  size?: number
  shape?: 'rounded' | 'circle'
}

function initialFor(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    return '?'
  }
  const letter = trimmed[0]
  return letter ? letter.toUpperCase() : '?'
}

/** Rounded source mark — first letter on a soft blue wash (no remote favicons). */
export function SourceAvatar({ name, size = 22, shape = 'rounded' }: Props) {
  const glyph = initialFor(name)
  const corner = shape === 'circle' ? size / 2 : Math.max(radius.xs, size * 0.28)
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: corner,
        },
      ]}
    >
      <Text
        fontSize={Math.round(size * 0.48)}
        lineHeight={Math.round(size * 0.52)}
        fontWeight="$bold"
        color={colors.accent}
      >
        {glyph}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    flexShrink: 0,
  },
})
