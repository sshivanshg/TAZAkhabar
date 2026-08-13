import { useCallback, useState } from 'react'
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { CONTENT_RAIL_MAX, media, SIDEBAR_WIDTH, space } from '../../theme/tokens'
import { BreakingHeroCard } from '../BreakingHeroCard'

type Props = {
  articles: ArticleResponse[]
  onPress: (article: ArticleResponse) => void
}

/** Always show up to 3: one lead + up to two secondaries. */
const MAX_HERO = 3

export function estimateDesktopRailWidth(windowWidth: number): number {
  return Math.min(CONTENT_RAIL_MAX, Math.max(0, windowWidth - SIDEBAR_WIDTH))
}

/** Visible hero cards for a given rail width (always up to 3 in lead+secondary layout). */
export function desktopHeroVisibleCount(_railWidth: number): number {
  return MAX_HERO
}

/**
 * Lead + secondary breaking layout — one dominant primary (~60%) with up to two
 * stacked companions. Not an equal-weight 3-up grid.
 */
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

  const lead = articles[0]!
  const secondaries = articles.slice(1, MAX_HERO)
  const hasSide = secondaries.length > 0
  const gap = space.sm
  const primaryWidth = hasSide
    ? Math.max(0, Math.round(parentWidth * 0.6) - gap / 2)
    : parentWidth
  const sideWidth = hasSide ? Math.max(0, parentWidth - primaryWidth - gap) : 0

  return (
    <View style={styles.row} onLayout={onLayout}>
      <View style={[styles.lead, hasSide ? { width: primaryWidth } : styles.leadSolo]}>
        <BreakingHeroCard
          article={lead}
          index={0}
          width={primaryWidth}
          size="primary"
          onPress={onPress}
          style={styles.cardFlush}
        />
      </View>
      {hasSide ? (
        <View style={[styles.side, { width: sideWidth }]}>
          {secondaries.map((article, index) => (
            <View
              key={String(article.id)}
              style={[
                styles.sideSlot,
                {
                  // Keep stacked pair aligned to primary height
                  height:
                    secondaries.length === 1
                      ? media.heroPrimaryHeight
                      : media.heroSecondaryHeight,
                },
              ]}
            >
              <BreakingHeroCard
                article={article}
                index={index + 1}
                width={sideWidth}
                size={secondaries.length === 1 ? 'primary' : 'secondary'}
                onPress={onPress}
                style={styles.cardFlush}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.sm,
  },
  lead: {
    flexShrink: 0,
    minWidth: 0,
  },
  leadSolo: {
    flex: 1,
    width: '100%',
  },
  side: {
    flexShrink: 0,
    minWidth: 0,
    justifyContent: 'flex-start',
    gap: space.sm,
  },
  sideSlot: {
    overflow: 'hidden',
    borderRadius: 0,
  },
  cardFlush: {
    marginRight: 0,
    width: '100%',
  },
})
