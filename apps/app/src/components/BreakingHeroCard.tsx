import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { Image, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, media, radius, shadows, space, typography } from '../theme/tokens'
import { formatRelativeTime } from '../utils/relativeTime'
import { Badge } from './ui/Badge'
import { ImageBottomFade } from './ImageBottomFade'

const CARD_GAP = space.sm

type Props = {
  article: ArticleResponse
  index: number
  width: number
  onPress: (article: ArticleResponse) => void
  style?: ViewStyle
}

export function BreakingHeroCard({ article, index, width, onPress, style }: Props) {
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
      style={[{ width, marginRight: CARD_GAP }, style]}
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
})
