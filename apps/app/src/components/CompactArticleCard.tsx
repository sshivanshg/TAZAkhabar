import { Pressable, StyleSheet, View } from 'react-native'
import { Box, HStack, Image, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, media, radius, shadows, space, typography } from '../theme/tokens'
import { formatRelativeTime } from '../utils/relativeTime'
import { CategoryPill } from './CategoryPill'

type Props = {
  article: ArticleResponse
  index: number
  onPress: (article: ArticleResponse) => void
  onLongPress?: (article: ArticleResponse) => void
}

/** Compact horizontal card — thumbnail left, meta + headline right. */
export function CompactArticleCard({ article, index, onPress, onLongPress }: Props) {
  const headline = article.headline ?? 'Untitled'
  const source = article.sourceName ?? 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const category = article.category ?? 'Local'
  const imageUrl = article.imageUrl

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 200, delay: Math.min(index * 30, 180) }}
      style={styles.wrap}
    >
      {/* Shadow on outer; overflow+radius on inner — RN Web cannot do both on one node. */}
      <View style={[styles.shadowHost, shadows.card]}>
        <Pressable
          onPress={() => onPress(article)}
          onLongPress={onLongPress ? () => onLongPress(article) : undefined}
          delayLongPress={380}
          accessibilityRole="button"
          accessibilityLabel={`${headline}. ${category}. ${source}. ${relative}. Long press for options.`}
          style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
        >
          <View style={styles.thumbWrap}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                alt=""
                w="$full"
                h="$full"
                resizeMode="cover"
                style={styles.thumbImage}
              />
            ) : (
              <View style={styles.thumbPlaceholder} />
            )}
          </View>
          <VStack flex={1} px="$3" py="$3" justifyContent="center" space="xs">
            <CategoryPill label={category} variant="soft" />
            <Text
              fontSize={typography.headlineSm.fontSize}
              lineHeight={typography.headlineSm.lineHeight}
              fontWeight="$bold"
              color={colors.text}
              numberOfLines={2}
            >
              {headline}
            </Text>
            <HStack space="sm" alignItems="center" flexWrap="wrap">
              <Text
                fontSize={typography.meta.fontSize}
                lineHeight={typography.meta.lineHeight}
                fontWeight="$medium"
                color={colors.textMuted}
                numberOfLines={1}
              >
                {source}
              </Text>
              {relative ? (
                <Text
                  fontSize={typography.meta.fontSize}
                  lineHeight={typography.meta.lineHeight}
                  color={colors.textMuted}
                >
                  · {relative}
                </Text>
              ) : null}
            </HStack>
          </VStack>
        </Pressable>
      </View>
    </MotiView>
  )
}

export function CompactArticleCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 0.85 }}
      transition={{
        type: 'timing',
        duration: 780,
        loop: true,
        delay: index * 80,
      }}
      style={styles.wrap}
    >
      <View style={[styles.shadowHost, shadows.card]}>
        <View style={styles.card}>
          <View style={[styles.thumbWrap, { backgroundColor: colors.skeleton }]} />
          <VStack flex={1} px="$3" py="$3" space="sm" justifyContent="center">
            <Box h={18} w={64} bg={colors.skeleton} borderRadius={radius.full} />
            <Box h={16} w="92%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={16} w="70%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={12} w="40%" bg={colors.skeleton} borderRadius={radius.xs} />
          </VStack>
        </View>
      </View>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.sm,
  },
  shadowHost: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: media.thumb,
  },
  cardPressed: {
    opacity: 0.94,
  },
  thumbWrap: {
    width: media.thumb,
    height: media.thumb,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.skeleton,
  },
})
