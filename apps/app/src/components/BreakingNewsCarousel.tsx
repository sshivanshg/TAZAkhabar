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
import { Image, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, HIT_TARGET, media, radius, shadows, space, typography } from '../theme/tokens'
import { formatRelativeTime } from '../utils/relativeTime'
import { Badge } from './ui/Badge'
import { ImageBottomFade } from './ImageBottomFade'

type Props = {
  articles: ArticleResponse[]
  onPress: (article: ArticleResponse) => void
}

const CARD_GAP = space.sm
const SIDE_PAD = space.screen
const DOT_INACTIVE = 5
const DOT_ACTIVE_W = 16
const DOT_H = 5

export function BreakingNewsCarousel({ articles, onPress }: Props) {
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
          <HeroCard article={item} index={index} width={cardWidth} onPress={onPress} />
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

function HeroCard({
  article,
  index,
  width,
  onPress,
}: {
  article: ArticleResponse
  index: number
  width: number
  onPress: (article: ArticleResponse) => void
}) {
  const headline = article.headline ?? 'Untitled'
  const source = article.sourceName ?? 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const category = article.category ?? 'Local'
  const imageUrl = article.imageUrl
  /** Fade covers ~60% of card so gradient starts ~40% from top */
  const fadeHeight = Math.round(media.heroHeight * 0.6)

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 240, delay: Math.min(index * 40, 160) }}
      style={{ width, marginRight: CARD_GAP }}
    >
      <Pressable
        onPress={() => onPress(article)}
        accessibilityRole="button"
        accessibilityLabel={`Breaking: ${headline}. ${source}. ${relative}`}
        style={({ pressed }) => [styles.shadowHost, shadows.card, pressed ? styles.pressed : null]}
      >
        <View style={styles.card}>
          <View style={styles.imageWrap}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                alt=""
                w="$full"
                h={media.heroHeight}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
            <ImageBottomFade height={fadeHeight} peakOpacity={0.75} />
            <View style={styles.pillWrap}>
              <Badge label={category} variant="filled" />
            </View>
            <VStack style={styles.overlay} space="xs">
              <Text
                fontSize={typography.label.fontSize}
                lineHeight={typography.label.lineHeight}
                fontWeight="$medium"
                color={colors.textOnImageMuted}
                numberOfLines={1}
              >
                {source}
                {relative ? `  ·  ${relative}` : ''}
              </Text>
              <Text
                fontSize={typography.headlineSm.fontSize}
                lineHeight={typography.headlineSm.lineHeight}
                fontWeight="$semibold"
                color={colors.textOnImage}
                numberOfLines={2}
              >
                {headline}
              </Text>
            </VStack>
          </View>
        </View>
      </Pressable>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: SIDE_PAD,
  },
  shadowHost: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.94,
  },
  imageWrap: {
    width: '100%',
    height: media.heroHeight,
    position: 'relative',
    backgroundColor: colors.surfaceRaised,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.skeleton,
  },
  pillWrap: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    left: space.sm,
    right: space.sm,
    bottom: space.sm,
    zIndex: 2,
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
