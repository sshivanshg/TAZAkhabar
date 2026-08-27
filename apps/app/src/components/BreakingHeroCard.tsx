import { useMemo } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { Image, Text } from '@gluestack-ui/themed'
import Ellipsis from 'lucide-react-native/icons/ellipsis'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { media, radius, space, typography, type AppColors } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { formatRelativeTime } from '../utils/relativeTime'
import { SourceAvatar } from './SourceAvatar'

const CARD_GAP = space.sm

export type HeroCardSize = 'default' | 'primary' | 'secondary'

type Props = {
  article: ArticleResponse
  index: number
  width: number
  onPress: (article: ArticleResponse) => void
  onMorePress?: (article: ArticleResponse) => void
  style?: ViewStyle
  size?: HeroCardSize
}

function heroMetrics(size: HeroCardSize) {
  switch (size) {
    case 'primary':
      return {
        imageHeight: media.heroPrimaryHeight,
        titleSize: typography.headline.fontSize,
        titleLine: typography.headline.lineHeight,
        titleLines: 3,
      }
    case 'secondary':
      return {
        imageHeight: media.heroSecondaryHeight,
        titleSize: 14,
        titleLine: 18,
        titleLines: 3,
      }
    default:
      return {
        imageHeight: media.heroHeight,
        titleSize: 20,
        titleLine: 26,
        titleLines: 3,
      }
  }
}

/**
 * Featured story — Google News style: large rounded image, then source / headline / time.
 * Light surfaces; no text overlay on the photo.
 */
export function BreakingHeroCard({
  article,
  index,
  width,
  onPress,
  onMorePress,
  style,
  size = 'default',
}: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const headline = article.headline ?? 'Untitled'
  const source = article.sourceName ?? 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const imageUrl = article.imageUrl
  const metrics = heroMetrics(size)
  const compact = size === 'secondary'

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
        accessibilityLabel={`Top story: ${headline}. ${source}. ${relative}`}
        style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      >
        <View style={[styles.imageWrap, { height: metrics.imageHeight }]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              alt=""
              w="$full"
              h={metrics.imageHeight}
              resizeMode="cover"
              style={styles.image}
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
          {!compact ? (
            <View style={styles.logoOverlay} pointerEvents="none">
              <SourceAvatar name={source} size={28} shape="circle" />
            </View>
          ) : null}
        </View>
        <View style={[styles.body, compact ? styles.bodyCompact : null]}>
          <View style={styles.sourceRow}>
            {compact ? <SourceAvatar name={source} size={16} /> : null}
            <Text
              fontSize={typography.label.fontSize}
              lineHeight={typography.label.lineHeight}
              fontWeight="$medium"
              color={colors.textMuted}
              numberOfLines={1}
              style={styles.sourceName}
            >
              {source}
            </Text>
          </View>
          <Text
            fontSize={metrics.titleSize}
            lineHeight={metrics.titleLine}
            fontWeight="$bold"
            color={colors.text}
            numberOfLines={metrics.titleLines}
            letterSpacing={-0.25}
          >
            {headline}
          </Text>
          <View style={styles.metaRow}>
            {relative ? (
              <Text
                fontSize={typography.label.fontSize}
                lineHeight={typography.label.lineHeight}
                fontWeight="$medium"
                color={colors.textMuted}
              >
                {relative}
              </Text>
            ) : (
              <View />
            )}
            {onMorePress ? (
              <Pressable
                onPress={() => onMorePress(article)}
                accessibilityRole="button"
                accessibilityLabel={`More options for ${headline}`}
                hitSlop={10}
                style={({ pressed }) => [styles.moreBtn, pressed ? styles.morePressed : null]}
              >
                <Ellipsis size={18} strokeWidth={iconStroke} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    </MotiView>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.background,
    },
    pressed: {
      opacity: 0.94,
    },
    imageWrap: {
      width: '100%',
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: c.surfaceRaised,
    },
    logoOverlay: {
      position: 'absolute',
      top: space.sm,
      right: space.sm,
      borderWidth: 2,
      borderColor: c.surface,
      borderRadius: radius.full,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sourceName: {
      flex: 1,
      minWidth: 0,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.skeleton,
    },
    body: {
      paddingTop: space.sm + 2,
      gap: 6,
    },
    bodyCompact: {
      paddingTop: space.xs + 2,
      gap: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
      minHeight: 28,
    },
    moreBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
    },
    morePressed: {
      backgroundColor: c.surfaceRaised,
    },
  })
}
