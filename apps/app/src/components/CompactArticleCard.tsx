import { Platform, Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native'
import { Box, HStack, Image, Text, VStack } from '@gluestack-ui/themed'
import Ellipsis from 'lucide-react-native/icons/ellipsis'
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

/**
 * Primary feed list card — thumbnail, category, headline, 2–3 line summary, source/time.
 * Matches PRD feed row: headline + short summary + source.
 */
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
  const headline = article.headline?.trim() || 'Untitled'
  const summary = article.summary?.trim() || ''
  const source = article.sourceName?.trim() || 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const category = article.category?.trim()
  const displayCategory = category?.toLowerCase() === 'local' ? undefined : category
  const imageUrl = article.imageUrl
  const showMore = Boolean(onMorePress ?? onLongPress)
  const openMore = onMorePress ?? onLongPress
  const titleSize = compact ? 15 : typography.bodySemibold.fontSize
  const titleLine = compact ? 20 : typography.bodySemibold.lineHeight
  const summarySize = compact ? 13 : typography.meta.fontSize
  const summaryLine = compact ? 18 : typography.meta.lineHeight
  const summaryLines = compact ? 2 : 3
  const metaSize = compact ? 11 : typography.label.fontSize
  const metaLine = compact ? 14 : typography.label.lineHeight

  const a11yBits = [headline, summary || undefined, displayCategory, source, relative].filter(Boolean)

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: Math.min(index * 28, 168) }}
      style={[styles.wrap, compact ? styles.wrapCompact : null]}
    >
      <Card clipped>
        <View style={[styles.card, compact ? styles.cardCompact : null]}>
          <Pressable
            onPress={() => onPress(article)}
            onLongPress={onLongPress ? () => onLongPress(article) : undefined}
            delayLongPress={380}
            accessibilityRole="button"
            accessibilityLabel={`${a11yBits.join('. ')}.${
              showMore ? ' Open options for more actions.' : ''
            }`}
            style={(state) => {
              const { pressed, hovered } = state as WebPressableState
              return [
                styles.cardMain,
                compact ? styles.cardMainCompact : null,
                { minHeight: Math.max(HIT_TARGET, thumb + (compact ? space.sm : space.md)) },
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
                  marginLeft: compact ? space.sm : space.md,
                  marginVertical: compact ? space.sm : space.md,
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
              style={{
                paddingRight: showMore ? space.xxs : space.md,
                paddingLeft: space.sm,
                paddingVertical: compact ? space.sm : space.md,
                gap: compact ? 3 : 5,
              }}
            >
              <HStack space="sm" alignItems="center" flexWrap="wrap">
                {displayCategory ? <Badge label={displayCategory} variant="soft" /> : null}
                {relative ? (
                  <Text
                    fontSize={metaSize}
                    lineHeight={metaLine}
                    fontWeight="$medium"
                    color={colors.textMuted}
                    numberOfLines={1}
                  >
                    {relative}
                  </Text>
                ) : null}
              </HStack>
              <Text
                fontSize={titleSize}
                lineHeight={titleLine}
                fontWeight="$semibold"
                color={colors.text}
                numberOfLines={2}
                letterSpacing={-0.15}
              >
                {headline}
              </Text>
              {summary ? (
                <Text
                  fontSize={summarySize}
                  lineHeight={summaryLine}
                  fontWeight="$normal"
                  color={colors.textSecondary}
                  numberOfLines={summaryLines}
                >
                  {summary}
                </Text>
              ) : null}
              <Text
                fontSize={metaSize}
                lineHeight={metaLine}
                fontWeight="$medium"
                color={colors.textMuted}
                numberOfLines={1}
              >
                {source}
              </Text>
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
        <View style={[styles.card, compact ? styles.cardCompact : null, styles.skeletonRow]}>
          <View
            style={[
              styles.thumbWrap,
              {
                width: thumb,
                height: thumb,
                marginLeft: compact ? space.sm : space.md,
                marginVertical: compact ? space.sm : space.md,
                backgroundColor: colors.skeleton,
              },
            ]}
          />
          <VStack
            flex={1}
            justifyContent="center"
            style={{
              paddingHorizontal: space.sm,
              paddingVertical: compact ? space.sm : space.md,
              gap: compact ? 4 : 6,
              paddingRight: space.md,
            }}
          >
            <Box h={compact ? 12 : 14} w={72} bg={colors.skeleton} borderRadius={radius.full} />
            <Box h={compact ? 14 : 16} w="94%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={compact ? 14 : 16} w="72%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={compact ? 10 : 12} w="100%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={compact ? 10 : 12} w="88%" bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={compact ? 10 : 12} w="36%" bg={colors.skeleton} borderRadius={radius.xs} />
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
  wrapCompact: {
    marginBottom: space.xs + 2,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    minHeight: HIT_TARGET,
    alignItems: 'stretch',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardCompact: {
    minHeight: media.thumbDense + space.md,
  },
  skeletonRow: {
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: HIT_TARGET,
  },
  cardMainCompact: {
    minHeight: media.thumbDense + space.md,
  },
  cardHover: {
    backgroundColor: '#F8FAFF',
  },
  cardPressed: {
    opacity: 0.94,
  },
  thumbWrap: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
    flexShrink: 0,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.xxs,
    alignSelf: 'stretch',
    borderRadius: radius.md,
  },
  moreBtnCompact: {
    width: 40,
  },
  morePressed: {
    backgroundColor: colors.surfaceRaised,
  },
})
