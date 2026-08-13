import { useCallback, useState } from 'react'
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { CONTENT_RAIL_MAX, SIDEBAR_WIDTH, space } from '../../theme/tokens'
import { BreakingHeroCard } from '../BreakingHeroCard'

type Props = {
  articles: ArticleResponse[]
  onPress: (article: ArticleResponse) => void
}

/** Rail width at which a third hero card fits comfortably. */
const WIDE_ENOUGH = 640

export function estimateDesktopRailWidth(windowWidth: number): number {
  return Math.min(CONTENT_RAIL_MAX, Math.max(0, windowWidth - SIDEBAR_WIDTH))
}

/** Visible hero cards for a given rail width (2 below 640, otherwise 3). */
export function desktopHeroVisibleCount(railWidth: number): number {
  return railWidth >= WIDE_ENOUGH ? 3 : 2
}

function cardCount(articleCount: number, parentWidth: number): number {
  return Math.min(desktopHeroVisibleCount(parentWidth), articleCount)
}

/** 2–3 breaking cards in a horizontal row. Does not wrap the mobile carousel. */
export function DesktopHeroRow({ articles, onPress }: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null)
  const parentWidth = measuredWidth ?? estimateDesktopRailWidth(windowWidth)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width
    setMeasuredWidth((prev) => (prev === next ? prev : next))
  }, [])

  if (articles.length === 0) {
    return null
  }

  const count = cardCount(articles.length, parentWidth)
  const visible = articles.slice(0, count)
  const gaps = space.sm * Math.max(0, count - 1)
  const cardWidth = count > 0 ? Math.max(0, (parentWidth - gaps) / count) : 0

  return (
    <View style={styles.row} onLayout={onLayout}>
      {visible.map((article, index) => (
        <View key={String(article.id)} style={styles.cell}>
          <BreakingHeroCard
            article={article}
            index={index}
            width={cardWidth}
            onPress={onPress}
            style={styles.card}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    marginRight: 0,
    width: '100%',
  },
})
