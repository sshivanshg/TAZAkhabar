import { useCallback, useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { Image, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, media, radius, shadows, space, typography } from '../theme/tokens'
import { formatRelativeTime } from '../utils/relativeTime'
import { CategoryPill } from './CategoryPill'
import { ImageBottomFade } from './ImageBottomFade'

type Props = {
  articles: ArticleResponse[]
  onPress: (article: ArticleResponse) => void
}

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_GAP = space.sm
const SIDE_PAD = space.screen
const CARD_WIDTH = SCREEN_WIDTH - SIDE_PAD * 2

export function BreakingNewsCarousel({ articles, onPress }: Props) {
  const [page, setPage] = useState(0)
  const listRef = useRef<FlatList<ArticleResponse>>(null)

  const onScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x
    const next = Math.round(x / (CARD_WIDTH + CARD_GAP))
    setPage(Math.max(0, Math.min(next, articles.length - 1)))
  }, [articles.length])

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
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item, index }) => (
          <HeroCard
            article={item}
            index={index}
            width={CARD_WIDTH}
            onPress={onPress}
          />
        )}
      />
      {articles.length > 1 ? (
        <View style={styles.dots} accessibilityRole="adjustable">
          {articles.map((item, index) => (
            <MotiView
              key={String(item.id)}
              animate={{
                width: page === index ? 18 : 7,
                opacity: page === index ? 1 : 0.35,
              }}
              transition={{ type: 'timing', duration: 180 }}
              style={[styles.dot, page === index ? styles.dotActive : null]}
            />
          ))}
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
            <ImageBottomFade height={120} />
            <View style={styles.pillWrap}>
              <CategoryPill label={category} variant="filled" />
            </View>
            <VStack style={styles.overlay} space="xs">
              <Text
                fontSize={typography.meta.fontSize}
                lineHeight={typography.meta.lineHeight}
                fontWeight="$medium"
                color="rgba(255,255,255,0.85)"
                numberOfLines={1}
              >
                {source}
                {relative ? `  ·  ${relative}` : ''}
              </Text>
              <Text
                fontSize={typography.section.fontSize}
                lineHeight={typography.section.lineHeight}
                fontWeight="$bold"
                color="#FFFFFF"
                numberOfLines={3}
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
    top: space.sm + 2,
    left: space.sm + 2,
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    left: space.sm + 2,
    right: space.sm + 2,
    bottom: space.sm + 2,
    zIndex: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: space.sm + 2,
    marginBottom: space.xxs,
  },
  dot: {
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
})
