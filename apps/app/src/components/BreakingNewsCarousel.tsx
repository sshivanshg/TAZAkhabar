import { useCallback, useRef, useState } from 'react'
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { colors, HIT_TARGET, radius, space } from '../theme/tokens'
import { BreakingHeroCard } from './BreakingHeroCard'

type Props = {
  articles: ArticleResponse[]
  onPress: (article: ArticleResponse) => void
  onMorePress?: (article: ArticleResponse) => void
}

const CARD_GAP = space.sm
const SIDE_PAD = space.screen
const DOT_INACTIVE = 5
const DOT_ACTIVE_W = 16
const DOT_H = 5

export function BreakingNewsCarousel({ articles, onPress, onMorePress }: Props) {
  const { width: screenWidth } = useWindowDimensions()
  const cardWidth = screenWidth - SIDE_PAD * 2
  const pageWidth = cardWidth + CARD_GAP
  const [page, setPage] = useState(0)
  const listRef = useRef<FlatList<ArticleResponse>>(null)

  const updatePageFromOffset = useCallback(
    (x: number) => {
      const next = Math.round(x / pageWidth)
      const clamped = Math.max(0, Math.min(next, articles.length - 1))
      setPage((prev) => (prev === clamped ? prev : clamped))
    },
    [articles.length, pageWidth],
  )

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      updatePageFromOffset(event.nativeEvent.contentOffset.x)
    },
    [updatePageFromOffset],
  )

  if (articles.length === 0) {
    return null
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={articles}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled={false}
        snapToInterval={pageWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollEndDrag={onScroll}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item, index }) => (
          <BreakingHeroCard
            article={item}
            index={index}
            width={cardWidth}
            onPress={onPress}
            onMorePress={onMorePress}
          />
        )}
      />
      {articles.length > 1 ? (
        <View style={styles.dots} accessibilityRole="tablist">
          {articles.map((item, index) => {
            const active = page === index
            return (
              <Pressable
                key={String(item.id)}
                onPress={() => {
                  listRef.current?.scrollToOffset({
                    offset: index * pageWidth,
                    animated: true,
                  })
                  setPage(index)
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Breaking story ${index + 1} of ${articles.length}`}
                hitSlop={8}
                style={styles.dotHit}
              >
                <MotiView
                  animate={{
                    width: active ? DOT_ACTIVE_W : DOT_INACTIVE,
                  }}
                  transition={{ type: 'timing', duration: 200 }}
                  style={[styles.dot, active ? styles.dotActive : styles.dotInactive]}
                />
              </Pressable>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: SIDE_PAD,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xxs,
    marginTop: space.sm,
    marginBottom: space.xxs,
  },
  dotHit: {
    minHeight: HIT_TARGET,
    minWidth: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: DOT_H,
    borderRadius: radius.full,
  },
  dotInactive: {
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
})
