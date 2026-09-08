import { useCallback, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { goToGlobalHome } from '../navigation/goToGlobalHome'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../theme/tokens'
import { BrandMark } from './BrandMark'

type Props = {
  /** Mark size in px. */
  size?: number
  /** Show a compact wordmark beside the mark (desktop sidebar). */
  showWordmark?: boolean
}

export function BrandHomeButton({ size = 28, showWordmark = false }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const onPress = useCallback(() => {
    void goToGlobalHome()
  }, [])

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="All India home feed"
      hitSlop={6}
      style={({ pressed }) => [
        styles.hit,
        showWordmark ? styles.hitRow : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <BrandMark size={size} />
      {showWordmark ? (
        <View style={styles.wordmarkBlock}>
          <Text
            fontSize={typography.label.fontSize}
            lineHeight={typography.label.lineHeight}
            fontWeight="$bold"
            color={colors.text}
            numberOfLines={1}
          >
            TazaKhabar
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    hit: {
      minWidth: HIT_TARGET,
      minHeight: HIT_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    hitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: space.xxs,
    },
    wordmarkBlock: {
      flexShrink: 1,
    },
    pressed: {
      opacity: 0.8,
    },
  })
}
