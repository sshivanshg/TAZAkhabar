import { useMemo } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, View, type PressableStateCallbackType } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import {
  FEED_CATEGORIES,
  FEED_CATEGORY_LABELS,
  type FeedCategory,
  space,
  typography,
  type AppColors,
} from '../../theme/tokens'

type Props = {
  selected: FeedCategory
  onSelect: (category: FeedCategory) => void
  onLongPressCategory?: (category: FeedCategory) => void
  categories?: readonly FeedCategory[]
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
}

/**
 * Google News–style horizontal category nav — text links with an accent underline
 * on the active item (replaces chip row on tablet/desktop).
 */
export function CategoryNavBar({
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
        contentContainerStyle={styles.content}
        accessibilityRole="tablist"
      >
        {categories.map((category) => {
          const isActive = category === selected
          const label = FEED_CATEGORY_LABELS[category]
          return (
            <Pressable
              key={category}
              onPress={() => onSelect(category)}
              onLongPress={
                onLongPressCategory && category !== 'All'
                  ? () => onLongPressCategory(category)
                  : undefined
              }
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={
                category === 'All'
                  ? `Filter ${label}`
                  : `Filter ${label}. Long press to block.`
              }
              style={(state) => {
                const { pressed, hovered } = state as WebPressableState
                return [
                  styles.tab,
                  Platform.OS === 'web' && hovered && !isActive ? styles.tabHover : null,
                  pressed ? styles.tabPressed : null,
                ]
              }}
            >
              <Text
                fontSize={typography.bodySemibold.fontSize}
                lineHeight={typography.bodySemibold.lineHeight}
                fontWeight={isActive ? '$semibold' : '$medium'}
                color={isActive ? colors.text : colors.textSecondary}
              >
                {label}
              </Text>
              {isActive ? <View style={styles.underline} /> : null}
            </Pressable>
          )
        })}
      </ScrollView>
      <View style={styles.rule} />
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
    content: {
      paddingHorizontal: space.screen,
      alignItems: 'flex-end',
      gap: space.lg,
      minHeight: 44,
    },
    tab: {
      paddingBottom: 10,
      paddingTop: 4,
      minHeight: 44,
      justifyContent: 'flex-end',
      position: 'relative',
    },
    tabHover: {
      opacity: 0.85,
    },
    tabPressed: {
      opacity: 0.7,
    },
    underline: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 3,
      borderRadius: 3,
      backgroundColor: c.accentFill,
    },
    rule: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginHorizontal: space.screen,
    },
  })
}
