import { ScrollView, StyleSheet, View } from 'react-native'
import {
  FEED_CATEGORIES,
  type FeedCategory,
  colors,
  space,
} from '../theme/tokens'
import { Chip } from './ui/Chip'

type Props = {
  selected: FeedCategory
  onSelect: (category: FeedCategory) => void
  onLongPressCategory?: (category: FeedCategory) => void
  categories?: readonly FeedCategory[]
}

/**
 * Shared category filter row — Home and Discover must both use this
 * so chip style, order, and selected state cannot drift apart.
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
            <Chip
              key={category}
              label={category}
              selected={isActive}
              onPress={() => onSelect(category)}
              onLongPress={
                onLongPressCategory && category !== 'All'
                  ? () => onLongPressCategory(category)
                  : undefined
              }
              accessibilityLabel={
                category === 'All'
                  ? `Filter ${category}`
                  : `Filter ${category}. Long press to block.`
              }
            />
          )
        })}
      </ScrollView>
    </View>
  )
}

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
    paddingVertical: 6,
    alignItems: 'center',
    gap: 8,
  },
})
