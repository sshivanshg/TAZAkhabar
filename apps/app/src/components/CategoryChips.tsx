import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import {
  FEED_CATEGORIES,
  type FeedCategory,
  colors,
  radius,
  space,
  typography,
} from '../theme/tokens'

type Props = {
  selected: FeedCategory
  onSelect: (category: FeedCategory) => void
  onLongPressCategory?: (category: FeedCategory) => void
  categories?: readonly FeedCategory[]
}

const CHIP_HEIGHT = 40

/**
 * Shared category filter row — Home and Discover must both use this
 * so chip style, order, and selected state cannot drift apart.
 *
 * Uses RN ScrollView (not Gluestack) so the row cannot flex-grow and
 * open a giant vertical gap above the feed.
 */
export function CategoryChipRow({
  selected,
  onSelect,
  onLongPressCategory,
  categories = FEED_CATEGORIES,
}: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        accessibilityRole="tablist"
      >
        {categories.map((category) => {
          const isActive = category === selected
          return (
            <Pressable
              key={category}
              onPress={() => onSelect(category)}
              onLongPress={
                onLongPressCategory && category !== 'All'
                  ? () => onLongPressCategory(category)
                  : undefined
              }
              delayLongPress={380}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={
                category === 'All'
                  ? `Filter ${category}`
                  : `Filter ${category}. Long press to block.`
              }
              style={({ pressed }) => [
                styles.chip,
                isActive ? styles.chipActive : styles.chipInactive,
                pressed ? styles.chipPressed : null,
              ]}
            >
              <Text
                fontSize={typography.chip.fontSize}
                lineHeight={typography.chip.lineHeight}
                fontWeight="$semibold"
                color={isActive ? colors.chipSelectedText : colors.chipInactiveText}
              >
                {category}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

/** @deprecated Use CategoryChipRow — kept as alias for existing imports. */
export const CategoryChips = CategoryChipRow

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    paddingHorizontal: space.screen,
    paddingVertical: space.xs,
    alignItems: 'center',
    gap: space.xs,
  },
  chip: {
    height: CHIP_HEIGHT,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  chipInactive: {
    borderColor: colors.chipInactiveBorder,
    backgroundColor: colors.surface,
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
})
