import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { ImageBottomFade } from './ImageBottomFade'
import { readerColors } from '../theme/readerTokens'
import { formatRelativeTime } from '../utils/relativeTime'
import { isHttpsUrl } from '../utils/shareToWhatsApp'

type Props = {
  article: ArticleResponse
  index: number
  total: number
  height: number
  cityLabel?: string
  bookmarked: boolean
  shareLabel: string
  onBack: () => void
  onShare: () => void
  onToggleBookmark: () => void
  showNextCue?: boolean
}

export function SwipeStoryCard({
  article,
  index,
  total,
  height,
  cityLabel,
  bookmarked,
  shareLabel,
  onBack,
  onShare,
  onToggleBookmark,
  showNextCue = true,
}: Props) {
  const insets = useSafeAreaInsets()
  const imageUri = article.imageUrl && isHttpsUrl(article.imageUrl) ? article.imageUrl : null
  const category = article.category?.trim() || 'Local'
  const eyebrow = cityLabel ? `${cityLabel} · ${category}` : category
  const time = article.publishedAt ? formatRelativeTime(article.publishedAt) : null

  return (
    <View style={[styles.root, { height, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={12}
        >
          <Text style={styles.topAction}>← Back</Text>
        </Pressable>
        <Text style={styles.topMeta}>
          {index + 1} / {total}
        </Text>
      </View>

      <View style={styles.hero}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: readerColors.imageFallback }]} />
        )}
        <ImageBottomFade height={120} />
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.headline}>{article.headline}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.summary}>{article.summary}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {[article.sourceName, time].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shareLabel}
            onPress={onShare}
            style={styles.actionBtn}
          >
            <Text style={styles.actionText}>{shareLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Save'}
            onPress={onToggleBookmark}
            style={styles.actionBtn}
          >
            <Text style={styles.actionText}>{bookmarked ? 'Saved' : 'Save'}</Text>
          </Pressable>
        </View>
        {showNextCue ? <Text style={styles.nextCue}>↑ Next story</Text> : null}
      </View>
    </View>
  )
}

export function CaughtUpCard({
  height,
  onBack,
}: {
  height: number
  onBack: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        styles.root,
        styles.caughtUp,
        { height, paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      <Text style={styles.caughtUpTitle}>You’re caught up</Text>
      <Text style={styles.caughtUpBody}>That’s all the latest for now.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.actionBtn}>
        <Text style={styles.actionText}>Back to feed</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: readerColors.canvas,
    flexDirection: 'column',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topAction: {
    color: readerColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  topMeta: {
    color: readerColors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  hero: {
    height: '52%',
    backgroundColor: readerColors.imageFallback,
    justifyContent: 'flex-end',
  },
  heroText: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1,
  },
  eyebrow: {
    color: readerColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headline: {
    color: readerColors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summary: {
    color: readerColors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  metaRow: {
    marginTop: 14,
  },
  meta: {
    color: readerColors.textMuted,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: readerColors.sheetBorder,
    backgroundColor: readerColors.sheet,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionText: {
    color: readerColors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  nextCue: {
    marginTop: 'auto',
    textAlign: 'center',
    color: readerColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 4,
  },
  caughtUp: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  caughtUpTitle: {
    color: readerColors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  caughtUpBody: {
    color: readerColors.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
})
