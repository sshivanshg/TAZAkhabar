import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useTheme } from '../preferences/ThemePreferenceContext'
import {
  FEED_CATEGORIES,
  FEED_CATEGORY_LABELS,
  type FeedCategory,
  space,
  type AppColors,
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
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

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
          const label = FEED_CATEGORY_LABELS[category]
          return (
            <Chip
              key={category}
              label={label}
              selected={isActive}
              onPress={() => onSelect(category)}
              onLongPress={
                onLongPressCategory && category !== 'All'
                  ? () => onLongPressCategory(category)
                  : undefined
              }
              accessibilityLabel={
                category === 'All'
                  ? `Filter ${label}`
                  : `Filter ${label}. Long press to block.`
              }
            />
          )
        })}
      </ScrollView>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexGrow: 0,
      flexShrink: 0,
      backgroundColor: c.background,
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
}
