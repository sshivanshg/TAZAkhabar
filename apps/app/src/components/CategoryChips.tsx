import { useMemo } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { isExpandedLayout, useBreakpoint } from '../hooks/useBreakpoint'
import {
  FEED_CATEGORIES,
  FEED_CATEGORY_LABELS,
  HIT_TARGET,
  type FeedCategory,
  space,
  typography,
  type AppColors,
} from '../theme/tokens'

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
 * Shared category filter row — text tabs with accent underline on the active item.
 * Home and Discover use the same component so style cannot drift.
 */
export function CategoryChipRow({
  selected,
  onSelect,
  onLongPressCategory,
  categories = FEED_CATEGORIES,
}: Props) {
  const expanded = isExpandedLayout(useBreakpoint())
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, expanded), [colors, expanded])

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
                color={isActive ? colors.text : colors.textMuted}
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

function createStyles(c: AppColors, expanded: boolean) {
  return StyleSheet.create({
    wrap: {
      flexGrow: 0,
      flexShrink: 0,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: space.screen,
      alignItems: 'center',
      gap: expanded ? space.lg : space.md,
      minHeight: HIT_TARGET,
    },
    tab: {
      minHeight: HIT_TARGET,
      paddingTop: 6,
      paddingBottom: 8,
      paddingHorizontal: 2,
      justifyContent: 'center',
      position: 'relative',
    },
    tabHover: {
      opacity: 0.88,
    },
    tabPressed: {
      opacity: 0.72,
    },
    underline: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      borderRadius: 2,
      backgroundColor: c.accentFill,
    },
    rule: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginHorizontal: space.screen,
    },
  })
}
