import { Platform, Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native'
import { Box, HStack, Image, Text, VStack } from '@gluestack-ui/themed'
import { Ellipsis } from 'lucide-react-native'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, HIT_TARGET, media, radius, space, typography } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { formatRelativeTime } from '../utils/relativeTime'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'

type Density = 'default' | 'compact'

type Props = {
  article: ArticleResponse
  index: number
  onPress: (article: ArticleResponse) => void
  onLongPress?: (article: ArticleResponse) => void
  /** Explicit overflow/actions control — preferred on web where long-press is awkward. */
  onMorePress?: (article: ArticleResponse) => void
  /**
   * `default` — mobile/tablet (touch ≥44).
   * `compact` — denser desktop rows; same structure, tighter padding/type.
   */
  density?: Density
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
}

/** Compact horizontal list card — thumbnail + badge + title + meta. */
export function CompactArticleCard({
  article,
  index,
  onPress,
  onLongPress,
  onMorePress,
  density = 'default',
}: Props) {
  const compact = density === 'compact'
  const thumb = compact ? media.thumbDense : media.thumb
  const headline = article.headline ?? 'Untitled'
  const source = article.sourceName ?? 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const category = article.category ?? 'Local'
  const imageUrl = article.imageUrl
  const showMore = Boolean(onMorePress ?? onLongPress)
  const openMore = onMorePress ?? onLongPress
  const titleSize = compact ? 14 : typography.bodySemibold.fontSize
  const titleLine = compact ? 18 : typography.bodySemibold.lineHeight
  const metaSize = compact ? 11 : typography.label.fontSize
  const metaLine = compact ? 14 : typography.label.lineHeight
  const textPadH = compact ? space.sm : space.sm
  const textPadV = compact ? space.xs : space.xs + 2

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 200, delay: Math.min(index * 30, 180) }}
      style={[styles.wrap, compact ? styles.wrapCompact : null]}
    >
      <Card clipped>
        <View style={[styles.card, compact ? styles.cardCompact : null]}>
          <Pressable
            onPress={() => onPress(article)}
            onLongPress={onLongPress ? () => onLongPress(article) : undefined}
            delayLongPress={380}
            accessibilityRole="button"
            accessibilityLabel={`${headline}. ${category}. ${source}. ${relative}.${
              showMore ? ' Open options for more actions.' : ''
            }`}
            style={(state) => {
              const { pressed, hovered } = state as WebPressableState
              return [
                styles.cardMain,
                compact ? styles.cardMainCompact : null,
                { minHeight: Math.max(HIT_TARGET, thumb + (compact ? space.xs : space.md)) },
                hovered && Platform.OS === 'web' ? styles.cardHover : null,
                pressed ? styles.cardPressed : null,
              ]
            }}
          >
            <View
              style={[
                styles.thumbWrap,
                {
                  width: thumb,
                  height: thumb,
                  marginLeft: compact ? space.xs + 2 : space.sm,
                },
              ]}
            >
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
            <VStack
              flex={1}
              justifyContent="center"
              space="xs"
              style={{
                paddingHorizontal: textPadH,
                paddingVertical: textPadV,
                gap: compact ? 2 : undefined,
              }}
            >
              <Badge label={category} variant="soft" />
              <Text
                fontSize={titleSize}
                lineHeight={titleLine}
                fontWeight="$semibold"
                color={colors.text}
                numberOfLines={2}
              >
                {headline}
              </Text>
              <HStack space="sm" alignItems="center" flexWrap="wrap">
                <Text
                  fontSize={metaSize}
                  lineHeight={metaLine}
                  fontWeight="$medium"
                  color={colors.textMuted}
                  numberOfLines={1}
                >
                  {source}
                </Text>
                {relative ? (
                  <Text fontSize={metaSize} lineHeight={metaLine} color={colors.textMuted}>
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
              style={({ pressed }) => [
                styles.moreBtn,
                compact ? styles.moreBtnCompact : null,
                pressed ? styles.morePressed : null,
              ]}
            >
              <Ellipsis
                size={compact ? 18 : 20}
                strokeWidth={iconStroke}
                color={colors.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
      </Card>
    </MotiView>
  )
}

export function CompactArticleCardSkeleton({
  index = 0,
  density = 'default',
}: {
  index?: number
  density?: Density
}) {
  const compact = density === 'compact'
  const thumb = compact ? media.thumbDense : media.thumb
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
      style={[styles.wrap, compact ? styles.wrapCompact : null]}
    >
      <Card clipped>
        <View style={[styles.card, compact ? styles.cardCompact : null]}>
          <View
            style={[
              styles.thumbWrap,
              {
                width: thumb,
                height: thumb,
                marginLeft: compact ? space.xs + 2 : space.sm,
                backgroundColor: colors.skeleton,
              },
            ]}
          />
          <VStack
            flex={1}
            space={compact ? 'xs' : 'sm'}
            justifyContent="center"
            style={{
              paddingHorizontal: compact ? space.sm : space.sm + 4,
              paddingVertical: compact ? space.xs : space.sm,
            }}
          >
            <Box h={compact ? 14 : 18} w={64} bg={colors.skeleton} borderRadius={radius.full} />
            <Box h={compact ? 14 : 16} w="92%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={compact ? 12 : 16} w="70%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={compact ? 10 : 12} w="40%" bg={colors.skeleton} borderRadius={radius.xs} />
          </VStack>
        </View>
      </Card>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.xs + 2,
  },
  wrapCompact: {
    marginBottom: space.xs,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    minHeight: HIT_TARGET,
    alignItems: 'center',
  },
  cardCompact: {
    minHeight: media.thumbDense + space.xs,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HIT_TARGET,
  },
  cardMainCompact: {
    minHeight: media.thumbDense + space.xs,
  },
  cardHover: {
    backgroundColor: colors.accentSoft,
  },
  cardPressed: {
    opacity: 0.92,
  },
  thumbWrap: {
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
  moreBtnCompact: {
    width: 40,
    height: 40,
  },
  morePressed: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.full,
  },
})
