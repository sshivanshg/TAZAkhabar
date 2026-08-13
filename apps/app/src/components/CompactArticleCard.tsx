import { Pressable, StyleSheet, View } from 'react-native'
import { Box, HStack, Image, Text, VStack } from '@gluestack-ui/themed'
import { Ellipsis } from 'lucide-react-native'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, HIT_TARGET, media, radius, space, typography } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { formatRelativeTime } from '../utils/relativeTime'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'

type Props = {
  article: ArticleResponse
  index: number
  onPress: (article: ArticleResponse) => void
  onLongPress?: (article: ArticleResponse) => void
  /** Explicit overflow/actions control — preferred on web where long-press is awkward. */
  onMorePress?: (article: ArticleResponse) => void
}

/** Compact horizontal card — thumbnail left, meta + headline right. */
export function CompactArticleCard({
  article,
  index,
  onPress,
  onLongPress,
  onMorePress,
}: Props) {
  const headline = article.headline ?? 'Untitled'
  const source = article.sourceName ?? 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const category = article.category ?? 'Local'
  const imageUrl = article.imageUrl
  const showMore = Boolean(onMorePress ?? onLongPress)
  const openMore = onMorePress ?? onLongPress

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 200, delay: Math.min(index * 30, 180) }}
      style={styles.wrap}
    >
      <Card clipped>
        <View style={styles.card}>
          <Pressable
            onPress={() => onPress(article)}
            onLongPress={onLongPress ? () => onLongPress(article) : undefined}
            delayLongPress={380}
            accessibilityRole="button"
            accessibilityLabel={`${headline}. ${category}. ${source}. ${relative}.${
              showMore ? ' Open options for more actions.' : ''
            }`}
            style={({ pressed }) => [styles.cardMain, pressed ? styles.cardPressed : null]}
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
              <Badge label={category} variant="soft" />
              <Text
                fontSize={typography.bodySemibold.fontSize}
                lineHeight={typography.bodySemibold.lineHeight}
                fontWeight="$semibold"
                color={colors.text}
                numberOfLines={2}
              >
                {headline}
              </Text>
              <HStack space="sm" alignItems="center" flexWrap="wrap">
                <Text
                  fontSize={typography.label.fontSize}
                  lineHeight={typography.label.lineHeight}
                  fontWeight="$medium"
                  color={colors.textMuted}
                  numberOfLines={1}
                >
                  {source}
                </Text>
                {relative ? (
                  <Text
                    fontSize={typography.label.fontSize}
                    lineHeight={typography.label.lineHeight}
                    color={colors.textMuted}
                  >
                    · {relative}
                  </Text>
                ) : null}
              </HStack>
            </VStack>
          </Pressable>
          {showMore && openMore ? (
            <Pressable
              onPress={() => openMore(article)}
              accessibilityRole="button"
              accessibilityLabel={`More options for ${headline}`}
              hitSlop={8}
              style={({ pressed }) => [styles.moreBtn, pressed ? styles.morePressed : null]}
            >
              <Ellipsis size={20} strokeWidth={iconStroke} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </Card>
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
      <Card clipped>
        <View style={styles.card}>
          <View style={[styles.thumbWrap, { backgroundColor: colors.skeleton }]} />
          <VStack flex={1} px="$3" py="$3" space="sm" justifyContent="center">
            <Box h={18} w={64} bg={colors.skeleton} borderRadius={radius.full} />
            <Box h={16} w="92%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={16} w="70%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={12} w="40%" bg={colors.skeleton} borderRadius={radius.xs} />
          </VStack>
        </View>
      </Card>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    minHeight: media.thumb + space.md,
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: media.thumb + space.md,
  },
  cardPressed: {
    opacity: 0.94,
  },
  thumbWrap: {
    width: media.thumb,
    height: media.thumb,
    marginLeft: space.sm,
    borderRadius: radius.sm,
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
  moreBtn: {
    width: HIT_TARGET,
    height: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.xxs,
  },
  morePressed: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.full,
  },
})
