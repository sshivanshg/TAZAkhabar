import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { Image, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, media, radius, shadows, space, typography } from '../theme/tokens'
import { formatRelativeTime } from '../utils/relativeTime'
import { Badge } from './ui/Badge'
import { ImageBottomFade } from './ImageBottomFade'

const CARD_GAP = space.sm

export type HeroCardSize = 'default' | 'primary' | 'secondary'

type Props = {
  article: ArticleResponse
  index: number
  width: number
  onPress: (article: ArticleResponse) => void
  style?: ViewStyle
  /**
   * Visual weight within the shared media-forward card system.
   * `default` — mobile carousel (dominant full-bleed).
   * `primary` — desktop lead (~60% width).
   * `secondary` — desktop stacked companions.
   */
  size?: HeroCardSize
}

function heroMetrics(size: HeroCardSize) {
  switch (size) {
    case 'primary':
      return {
        height: media.heroPrimaryHeight,
        titleSize: typography.headline.fontSize,
        titleLine: typography.headline.lineHeight,
        titleWeight: '$bold' as const,
        titleLines: 3,
        fadePeak: 0.82,
        fadeRatio: 0.65,
      }
    case 'secondary':
      return {
        height: media.heroSecondaryHeight,
        titleSize: typography.meta.fontSize + 1,
        titleLine: typography.summary.lineHeight - 2,
        titleWeight: '$semibold' as const,
        titleLines: 2,
        fadePeak: 0.78,
        fadeRatio: 0.7,
      }
    default:
      return {
        height: media.heroHeight,
        titleSize: 19,
        titleLine: 24,
        titleWeight: '$bold' as const,
        titleLines: 2,
        fadePeak: 0.82,
        fadeRatio: 0.62,
      }
  }
}

/** Media-forward card — image + gradient + badge + title. Same radius/badge as list cards. */
export function BreakingHeroCard({
  article,
  index,
  width,
  onPress,
  style,
  size = 'default',
}: Props) {
  const headline = article.headline ?? 'Untitled'
  const source = article.sourceName ?? 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const category = article.category?.trim()
  const displayCategory = category?.toLowerCase() === 'local' ? undefined : category
  const imageUrl = article.imageUrl
  const metrics = heroMetrics(size)
  const fadeHeight = Math.round(metrics.height * metrics.fadeRatio)
  const showMeta = size !== 'secondary'

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 240, delay: Math.min(index * 40, 160) }}
      style={[{ width, marginRight: CARD_GAP }, style]}
    >
      <Pressable
        onPress={() => onPress(article)}
        accessibilityRole="button"
        accessibilityLabel={`Breaking: ${headline}. ${source}. ${relative}`}
        style={({ pressed }) => [styles.shadowHost, shadows.card, pressed ? styles.pressed : null]}
      >
        <View style={styles.card}>
          <View style={[styles.imageWrap, { height: metrics.height }]}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                alt=""
                w="$full"
                h={metrics.height}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
            <ImageBottomFade height={fadeHeight} peakOpacity={metrics.fadePeak} />
            {displayCategory ? (
              <View style={styles.pillWrap}>
                <Badge label={displayCategory} variant="filled" />
              </View>
            ) : null}
            <VStack style={styles.overlay} space="xs">
              {showMeta ? (
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
              ) : null}
              <Text
                fontSize={metrics.titleSize}
                lineHeight={metrics.titleLine}
                fontWeight={metrics.titleWeight}
                color={colors.textOnImage}
                numberOfLines={metrics.titleLines}
              >
                {headline}
              </Text>
              {!showMeta ? (
                <Text
                  fontSize={typography.label.fontSize - 1}
                  lineHeight={typography.label.lineHeight}
                  fontWeight="$medium"
                  color={colors.textOnImageMuted}
                  numberOfLines={1}
                >
                  {source}
                  {relative ? ` · ${relative}` : ''}
                </Text>
              ) : null}
            </VStack>
          </View>
        </View>
      </Pressable>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  shadowHost: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.94,
  },
  imageWrap: {
    width: '100%',
    position: 'relative',
    backgroundColor: colors.surfaceRaised,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    // Mid tone so gradient + title still read as media-forward without a photo
    backgroundColor: '#45506D',
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
})
