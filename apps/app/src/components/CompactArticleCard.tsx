import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native'
import { Box, Image, Text } from '@gluestack-ui/themed'
import Bookmark from 'lucide-react-native/icons/bookmark'
import BookmarkCheck from 'lucide-react-native/icons/bookmark-check'
import Ellipsis from 'lucide-react-native/icons/ellipsis'
import ExternalLink from 'lucide-react-native/icons/external-link'
import Share2 from 'lucide-react-native/icons/share-2'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { colors, HIT_TARGET, media, radius, space, typography } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { formatRelativeTime } from '../utils/relativeTime'
import { isHttpsUrl } from '../utils/shareToWhatsApp'

type Density = 'default' | 'compact'

type Props = {
  article: ArticleResponse
  index: number
  onPress: (article: ArticleResponse) => void
  onLongPress?: (article: ArticleResponse) => void
  onMorePress?: (article: ArticleResponse) => void
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

function focusRing(focused?: boolean): ViewStyle | undefined {
  if (!focused || Platform.OS !== 'web') return undefined
  return {
    outlineWidth: 2,
    outlineColor: colors.accent,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as ViewStyle
}

/**
 * Mobile is a complete editorial card. Compact mode remains a thumb-right row
 * for tablet and desktop rails where a full-width image would be wasteful.
 */
export function CompactArticleCard({
  article,
  onPress,
  onLongPress,
  onMorePress,
  onSavePress,
  onSharePress,
  onSourcePress,
  saved = false,
  density = 'default',
}: Props) {
  const compact = density === 'compact'
  const headline = article.headline?.trim() || 'Untitled'
  const summary = article.summary?.trim()
  const source = article.sourceName?.trim() || 'Unknown source'
  const category = article.category?.trim()
  const relative = formatRelativeTime(article.publishedAt)
  const imageUrl = article.imageUrl
  const showMore = Boolean(onMorePress ?? onLongPress)
  const openMore = onMorePress ?? onLongPress

  if (compact) {
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
              styles.compactRow,
              hovered && Platform.OS === 'web' ? styles.rowHover : null,
              pressed ? styles.pressed : null,
              focusRing(focused),
            ]
          }}
        >
          <View style={styles.compactText}>
            <Text style={styles.eyebrowText} numberOfLines={1}>
              {[source, relative].filter(Boolean).join('  ·  ')}
            </Text>
            <Text accessibilityRole="header" style={styles.compactHeadline} numberOfLines={3}>
              {headline}
            </Text>
            {showMore && openMore ? (
              <Pressable
                onPress={() => openMore(article)}
                accessibilityRole="button"
                accessibilityLabel={`More options for ${headline}`}
                style={(state) => {
                  const { pressed, focused } = state as WebPressableState
                  return [styles.moreButton, pressed ? styles.actionPressed : null, focusRing(focused)]
                }}
              >
                <Ellipsis size={18} strokeWidth={iconStroke} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.thumbWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} alt={headline} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
          </View>
        </Pressable>
        <View style={styles.divider} />
      </View>
    )
  }

  return (
    <View style={styles.wrap} {...webArticleProps}>
      <Pressable
        onPress={() => onPress(article)}
        onLongPress={onLongPress ? () => onLongPress(article) : undefined}
        delayLongPress={380}
        accessibilityRole="button"
        accessibilityLabel={`${headline}. ${source}. ${relative}`}
        style={(state) => {
          const { pressed, focused } = state as WebPressableState
          return [styles.mobileCard, pressed ? styles.pressed : null, focusRing(focused)]
        }}
      >
        <View style={styles.metaHeader}>
          <Text style={styles.sourceText} numberOfLines={1}>{source}</Text>
          <Text style={styles.timeText} numberOfLines={1}>
            {[category, relative].filter(Boolean).join('  ·  ')}
          </Text>
        </View>

        <Text accessibilityRole="header" style={styles.mobileHeadline} numberOfLines={3}>{headline}</Text>
        {summary ? <Text style={styles.summary} numberOfLines={3}>{summary}</Text> : null}

        {imageUrl ? (
          <View style={styles.mobileImageWrap}>
            <Image source={{ uri: imageUrl }} alt={headline} style={styles.image} resizeMode="cover" />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        {onSavePress ? (
          <CardAction
            label={saved ? 'Saved' : 'Save'}
            accessibilityLabel={saved ? `Remove saved story ${headline}` : `Save story ${headline}`}
            onPress={() => onSavePress(article)}
            Icon={saved ? BookmarkCheck : Bookmark}
            active={saved}
          />
        ) : null}
        {onSharePress ? (
          <CardAction label="Share" accessibilityLabel={`Share ${headline}`} onPress={() => onSharePress(article)} Icon={Share2} />
        ) : null}
        {onSourcePress && isHttpsUrl(article.sourceUrl) ? (
          <CardAction
            label="Read original"
            accessibilityLabel={`Read original article from ${source}`}
            onPress={() => onSourcePress(article)}
            Icon={ExternalLink}
            alignEnd
          />
        ) : null}
        {showMore && openMore ? (
          <Pressable
            onPress={() => openMore(article)}
            accessibilityRole="button"
            accessibilityLabel={`More options for ${headline}`}
            style={(state) => {
              const { pressed, focused } = state as WebPressableState
              return [styles.moreButton, pressed ? styles.actionPressed : null, focusRing(focused)]
            }}
          >
            <Ellipsis size={18} strokeWidth={iconStroke} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.mobileDivider} />
    </View>
  )
}

type ActionIcon = typeof Bookmark

function CardAction({ label, accessibilityLabel, onPress, Icon, active = false, alignEnd = false }: {
  label: string
  accessibilityLabel: string
  onPress: () => void
  Icon: ActionIcon
  active?: boolean
  alignEnd?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={(state) => {
        const { pressed, focused } = state as WebPressableState
        return [
          styles.action,
          alignEnd ? styles.actionEnd : null,
          pressed ? styles.actionPressed : null,
          focusRing(focused),
        ]
      }}
    >
      <Icon size={17} strokeWidth={iconStroke} color={active ? colors.accent : colors.textSecondary} />
      <Text style={[styles.actionLabel, active ? styles.actionLabelActive : null]}>{label}</Text>
    </Pressable>
  )
}

export function CompactArticleCardSkeleton({ density = 'default' }: { index?: number; density?: Density }) {
  const compact = density === 'compact'
  if (compact) {
    return (
      <View style={styles.wrap}>
        <View style={styles.compactRow}>
          <View style={styles.compactText}>
            <Box h={12} w={96} bg={colors.skeleton} borderRadius={radius.xs} />
            <Box h={15} w="96%" bg={colors.skeleton} borderRadius={radius.xs} mt="$2" />
            <Box h={15} w="76%" bg={colors.skeleton} borderRadius={radius.xs} mt="$1" />
          </View>
          <View style={[styles.thumbWrap, styles.skeleton]} />
        </View>
        <View style={styles.divider} />
      </View>
    )
  }

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.metaHeader}>
        <Box h={12} w={92} bg={colors.skeleton} borderRadius={radius.xs} />
        <Box h={12} w={72} bg={colors.skeleton} borderRadius={radius.xs} />
      </View>
      <Box h={18} w="94%" bg={colors.skeleton} borderRadius={radius.xs} mt="$3" />
      <Box h={18} w="82%" bg={colors.skeleton} borderRadius={radius.xs} mt="$1" />
      <Box h={14} w="96%" bg={colors.skeleton} borderRadius={radius.xs} mt="$3" />
      <Box h={14} w="72%" bg={colors.skeleton} borderRadius={radius.xs} mt="$1" />
      <View style={[styles.mobileImageWrap, styles.skeleton, styles.skeletonImage]} />
      <View style={styles.skeletonActions}>
        <Box h={12} w={54} bg={colors.skeleton} borderRadius={radius.xs} />
        <Box h={12} w={54} bg={colors.skeleton} borderRadius={radius.xs} />
        <Box h={12} w={92} bg={colors.skeleton} borderRadius={radius.xs} />
      </View>
      <View style={styles.mobileDivider} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.background },
  mobileCard: { paddingTop: space.md },
  metaHeader: { minHeight: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  sourceText: { flex: 1, minWidth: 0, color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  timeText: { flexShrink: 1, color: colors.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '500', textAlign: 'right' },
  mobileHeadline: { marginTop: space.sm, color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3 },
  summary: { marginTop: space.xs, color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  mobileImageWrap: { width: '100%', aspectRatio: 16 / 9, marginTop: space.sm, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.skeleton },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.skeleton },
  actions: { minHeight: HIT_TARGET, flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  action: { minHeight: HIT_TARGET, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: space.xs, borderRadius: radius.xs },
  actionEnd: { marginLeft: 'auto' },
  actionPressed: { backgroundColor: colors.accentSoft },
  actionLabel: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  actionLabelActive: { color: colors.accent },
  moreButton: { width: HIT_TARGET, height: HIT_TARGET, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  mobileDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSolid },
  compactRow: { minHeight: 124, flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, paddingVertical: space.sm },
  compactText: { flex: 1, minWidth: 0, gap: 6 },
  eyebrowText: { color: colors.textMuted, fontSize: typography.label.fontSize, lineHeight: typography.label.lineHeight, fontWeight: '500' },
  compactHeadline: { color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: '600', letterSpacing: -0.2 },
  thumbWrap: { width: media.thumb, height: media.thumb, flexShrink: 0, overflow: 'hidden', borderRadius: radius.sm, backgroundColor: colors.skeleton },
  rowHover: { backgroundColor: colors.accentSoft },
  pressed: { opacity: 0.82 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  skeleton: { backgroundColor: colors.skeleton },
  skeletonCard: { paddingTop: space.md },
  skeletonImage: { marginBottom: space.xs },
  skeletonActions: { minHeight: HIT_TARGET, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xs },
})
