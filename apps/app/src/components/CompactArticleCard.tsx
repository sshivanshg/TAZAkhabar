import { useMemo } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native'
import { Box, Image, Text } from '@gluestack-ui/themed'
import Ellipsis from 'lucide-react-native/icons/ellipsis'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, media, radius, space, typography, type AppColors } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { formatRelativeTime } from '../utils/relativeTime'
import { isHttpsUrl } from '../utils/shareToWhatsApp'
import { SeeMorePill } from './SeeMorePill'
import { SourceAvatar } from './SourceAvatar'

type Density = 'default' | 'compact'

type Props = {
  article: ArticleResponse
  index: number
  onPress: (article: ArticleResponse) => void
  onLongPress?: (article: ArticleResponse) => void
  onMorePress?: (article: ArticleResponse) => void
  onSeeMorePress?: (article: ArticleResponse) => void
  /** Kept for callers; actions live in the overflow sheet for a cleaner feed. */
  onSavePress?: (article: ArticleResponse) => void
  onSharePress?: (article: ArticleResponse) => void
  onSourcePress?: (article: ArticleResponse) => void
  saved?: boolean
  density?: Density
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

const webArticleProps = Platform.OS === 'web'
  ? ({ role: 'article' } as const)
  : {}

function focusRing(accent: string, focused?: boolean): ViewStyle | undefined {
  if (!focused || Platform.OS !== 'web') return undefined
  return {
    outlineWidth: 2,
    outlineColor: accent,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as ViewStyle
}

/**
 * Google News–inspired list card:
 * - With a photo → headline + meta on the left, rounded thumb on the right
 * - Without a photo → text-only story (no empty image box)
 * - Footer: time · See more · overflow
 */
export function CompactArticleCard({
  article,
  onPress,
  onLongPress,
  onMorePress,
  onSeeMorePress,
  density = 'default',
}: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const dense = density === 'compact'
  const headline = article.headline?.trim() || 'Untitled'
  const summary = article.summary?.trim()
  const source = article.sourceName?.trim() || 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const imageUrl =
    article.imageUrl && isHttpsUrl(article.imageUrl) ? article.imageUrl.trim() : null
  const hasImage = Boolean(imageUrl)
  const showMore = Boolean(onMorePress ?? onLongPress)
  const openMore = onMorePress ?? onLongPress
  const thumbSize = dense ? media.thumbDense : media.thumb
  const seeMore = onSeeMorePress ?? onPress

  return (
    <View style={styles.wrap} {...webArticleProps}>
      <Pressable
        onPress={() => onPress(article)}
        onLongPress={onLongPress ? () => onLongPress(article) : undefined}
        delayLongPress={380}
        accessibilityRole="button"
        accessibilityLabel={`${[headline, source, relative].filter(Boolean).join('. ')}.${
          showMore ? ' Open options for more actions.' : ''
        }`}
        style={(state) => {
          const { pressed, hovered, focused } = state as WebPressableState
          return [
            styles.row,
            dense ? styles.rowDense : null,
            hovered && Platform.OS === 'web' ? styles.rowHover : null,
            pressed ? styles.pressed : null,
            focusRing(colors.accent, focused),
          ]
        }}
      >
        <View style={styles.textCol}>
          <View style={styles.sourceRow}>
            <SourceAvatar name={source} size={dense ? 18 : 20} />
            <Text style={styles.source} numberOfLines={1}>
              {source}
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            style={[styles.headline, dense ? styles.headlineDense : null]}
            numberOfLines={hasImage ? 3 : 4}
          >
            {headline}
          </Text>
          {!hasImage && summary ? (
            <Text style={styles.lede} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            {relative ? (
              <Text style={styles.meta} numberOfLines={1}>
                {relative}
              </Text>
            ) : (
              <View style={styles.metaSpacer} />
            )}
            <View style={styles.metaActions}>
              {!dense ? (
                <SeeMorePill
                  onPress={() => seeMore(article)}
                  accessibilityLabel={`See more from ${source}`}
                />
              ) : null}
              {showMore && openMore ? (
                <Pressable
                  onPress={() => openMore(article)}
                  accessibilityRole="button"
                  accessibilityLabel={`More options for ${headline}`}
                  hitSlop={8}
                  style={(state) => {
                    const { pressed, focused } = state as WebPressableState
                    return [
                      styles.moreButton,
                      pressed ? styles.morePressed : null,
                      focusRing(colors.accent, focused),
                    ]
                  }}
                >
                  <Ellipsis size={18} strokeWidth={iconStroke} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {hasImage ? (
          <View
            style={[
              styles.thumb,
              { width: thumbSize, height: thumbSize },
            ]}
          >
            <Image
              source={{ uri: imageUrl! }}
              alt={headline}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </Pressable>
      <View style={styles.divider} />
    </View>
  )
}

export function CompactArticleCardSkeleton({
  density = 'default',
  withImage = true,
}: {
  index?: number
  density?: Density
  withImage?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const dense = density === 'compact'
  const thumbSize = dense ? media.thumbDense : media.thumb

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, dense ? styles.rowDense : null]}>
        <View style={styles.textCol}>
          <View style={styles.sourceRow}>
            <Box h={20} w={20} bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={12} w={88} bg={colors.skeleton} borderRadius={radius.xs} />
          </View>
          <Box h={dense ? 15 : 17} w="94%" bg={colors.skeleton} borderRadius={radius.xs} mt="$2" />
          <Box h={dense ? 15 : 17} w="72%" bg={colors.skeleton} borderRadius={radius.xs} mt="$1" />
          {!withImage ? (
            <>
              <Box h={13} w="96%" bg={colors.skeleton} borderRadius={radius.xs} mt="$2" />
              <Box h={13} w="64%" bg={colors.skeleton} borderRadius={radius.xs} mt="$1" />
            </>
          ) : null}
          <Box h={12} w={72} bg={colors.skeleton} borderRadius={radius.xs} mt="$3" />
        </View>
        {withImage ? (
          <View
            style={[
              styles.thumb,
              styles.skeleton,
              { width: thumbSize, height: thumbSize },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.divider} />
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.background,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space.md,
      paddingTop: space.md,
      paddingBottom: space.sm,
    },
    rowDense: {
      gap: space.sm,
      paddingTop: space.sm,
      paddingBottom: space.sm,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    source: {
      flex: 1,
      minWidth: 0,
      color: c.textMuted,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    headline: {
      color: c.text,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: '700',
      letterSpacing: -0.25,
      marginTop: 2,
    },
    headlineDense: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      letterSpacing: -0.15,
    },
    lede: {
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      marginTop: 2,
    },
    metaRow: {
      marginTop: 8,
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.xs,
    },
    meta: {
      flexShrink: 1,
      minWidth: 0,
      color: c.textMuted,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: '500',
    },
    metaSpacer: {
      flex: 1,
    },
    metaActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
    },
    thumb: {
      flexShrink: 0,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: c.skeleton,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    moreButton: {
      width: HIT_TARGET * 0.72,
      height: HIT_TARGET * 0.72,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
    },
    morePressed: {
      backgroundColor: c.surfaceRaised,
    },
    rowHover: {
      backgroundColor: c.accentSoft,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.992 }],
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.borderSolid,
    },
    skeleton: {
      backgroundColor: c.skeleton,
    },
  })
}
