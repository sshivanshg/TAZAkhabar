import { Platform, Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native'
import { Box, Image, Text } from '@gluestack-ui/themed'
import Ellipsis from 'lucide-react-native/icons/ellipsis'
import { MotiView } from 'moti'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, HIT_TARGET, media, radius, space, typography } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { formatRelativeTime } from '../utils/relativeTime'

type Density = 'default' | 'compact'

type Props = {
  article: ArticleResponse
  index: number
  onPress: (article: ArticleResponse) => void
  onLongPress?: (article: ArticleResponse) => void
  onMorePress?: (article: ArticleResponse) => void
  density?: Density
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
}

/**
 * Google News–inspired list row: source → headline + thumb (right) → time + more.
 * Light theme + single blue accent preserved.
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
  const source = article.sourceName?.trim() || 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const imageUrl = article.imageUrl
  const showMore = Boolean(onMorePress ?? onLongPress)
  const openMore = onMorePress ?? onLongPress
  const titleSize = compact ? 15 : 17
  const titleLine = compact ? 20 : 23

  return (
    <MotiView
      from={{ opacity: 0, translateY: 4 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200, delay: Math.min(index * 24, 144) }}
      style={[styles.wrap, compact ? styles.wrapCompact : null]}
    >
      <Pressable
        onPress={() => onPress(article)}
        onLongPress={onLongPress ? () => onLongPress(article) : undefined}
        delayLongPress={380}
        accessibilityRole="button"
        accessibilityLabel={`${[headline, source, relative].filter(Boolean).join('. ')}.${
          showMore ? ' Open options for more actions.' : ''
        }`}
        style={(state) => {
          const { pressed, hovered } = state as WebPressableState
          return [
            styles.row,
            compact ? styles.rowCompact : null,
            hovered && Platform.OS === 'web' ? styles.rowHover : null,
            pressed ? styles.rowPressed : null,
          ]
        }}
      >
        <View style={styles.textCol}>
          <Text
            fontSize={typography.label.fontSize}
            lineHeight={typography.label.lineHeight}
            fontWeight="$medium"
            color={colors.textMuted}
            numberOfLines={1}
          >
            {source}
          </Text>
          <Text
            fontSize={titleSize}
            lineHeight={titleLine}
            fontWeight="$semibold"
            color={colors.text}
            numberOfLines={compact ? 3 : 4}
            letterSpacing={-0.2}
            style={styles.headline}
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
                numberOfLines={1}
                style={styles.metaTime}
              >
                {relative}
              </Text>
            ) : (
              <View style={styles.metaTime} />
            )}
            {showMore && openMore ? (
              <Pressable
                onPress={() => openMore(article)}
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
        <View style={[styles.thumbWrap, { width: thumb, height: thumb }]}>
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
      </Pressable>
      <View style={styles.divider} />
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
      transition={{ type: 'timing', duration: 780, loop: true, delay: index * 80 }}
      style={[styles.wrap, compact ? styles.wrapCompact : null]}
    >
      <View style={[styles.row, compact ? styles.rowCompact : null]}>
        <View style={styles.textCol}>
          <Box h={12} w={88} bg={colors.skeleton} borderRadius={radius.xs} />
          <Box h={compact ? 14 : 16} w="96%" bg={colors.skeleton} borderRadius={radius.xs} mt="$2" />
          <Box h={compact ? 14 : 16} w="78%" bg={colors.skeleton} borderRadius={radius.xs} mt="$1" />
          <Box h={12} w={48} bg={colors.skeleton} borderRadius={radius.xs} mt="$3" />
        </View>
        <View
          style={[
            styles.thumbWrap,
            { width: thumb, height: thumb, backgroundColor: colors.skeleton },
          ]}
        />
      </View>
      <View style={styles.divider} />
    </MotiView>
  )
}

const styles = StyleSheet.create({
  wrap: {},
  wrapCompact: {},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingVertical: space.md,
    minHeight: HIT_TARGET,
  },
  rowCompact: {
    paddingVertical: space.sm + 2,
    gap: space.sm,
  },
  rowHover: {
    backgroundColor: colors.accentSoft,
  },
  rowPressed: {
    opacity: 0.92,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  headline: {
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    minHeight: 28,
  },
  metaTime: {
    flex: 1,
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  morePressed: {
    backgroundColor: colors.surfaceRaised,
  },
  thumbWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
})
