import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { ImageBottomFade } from './ImageBottomFade'
import { readerColors } from '../theme/readerTokens'
import { formatRelativeTime } from '../utils/relativeTime'
import { isHttpsUrl } from '../utils/shareToWhatsApp'
import {
  READING_LANGUAGES,
  type ReadingLanguageCode,
} from '../storage/languagePreference'
import { splitArticleBody } from '../utils/splitArticleBody'

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
  readingLanguage?: ReadingLanguageCode
  onSelectLanguage?: (code: ReadingLanguageCode) => void
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
  readingLanguage,
  onSelectLanguage,
}: Props) {
  const insets = useSafeAreaInsets()
  const imageUri = article.imageUrl && isHttpsUrl(article.imageUrl) ? article.imageUrl : null
  const category = article.category?.trim()
  const displayCategory = category?.toLowerCase() === 'local' ? undefined : category
  const eyebrow = [cityLabel, displayCategory].filter(Boolean).join(' · ')
  const time = article.publishedAt ? formatRelativeTime(article.publishedAt) : null
  const paragraphs = splitArticleBody(article.body)
  const hasBody = paragraphs.length > 0

  return (
    <View style={[styles.root, { height }]}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={12}
        >
          <Text style={styles.topAction}>← Back</Text>
        </Pressable>
        <View style={styles.topRight}>
          {onSelectLanguage
            ? READING_LANGUAGES.map((lang) => {
                const selected = readingLanguage === lang.code
                return (
                  <Pressable
                    key={lang.code}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Prefer ${lang.accessibilityLabel}`}
                    onPress={() => onSelectLanguage(lang.code)}
                    hitSlop={8}
                    style={[styles.langChip, selected ? styles.langChipSelected : null]}
                  >
                    <Text style={[styles.langChipText, selected ? styles.langChipTextSelected : null]}>
                      {lang.code === 'en' ? 'EN' : 'हि'}
                    </Text>
                  </Pressable>
                )
              })
            : null}
          <Text style={styles.topMeta}>
            {index + 1} / {total}
          </Text>
        </View>
      </View>

      <View style={[styles.hero, hasBody ? styles.heroCompact : null]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: readerColors.imageFallback }]} />
        )}
        <ImageBottomFade height={120} />
      </View>

      <View style={styles.storyHeader}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headline}>{article.headline}</Text>
        <Text style={styles.storyMeta}>
          {[article.sourceName, time].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <View style={styles.readerPanel}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          nestedScrollEnabled
        >
          {hasBody
            ? paragraphs.map((paragraph, paragraphIndex) => (
                <Text key={paragraphIndex} style={styles.summary}>
                  {paragraph}
                </Text>
              ))
            : <Text style={styles.summary}>{article.summary}</Text>}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={[styles.actionBtn, styles.caughtUpBtn]}
      >
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
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langChip: {
    minWidth: 36,
    minHeight: 32,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: readerColors.sheetBorder,
    backgroundColor: readerColors.sheet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipSelected: {
    backgroundColor: readerColors.accent,
    borderColor: readerColors.accent,
  },
  langChipText: {
    color: readerColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  langChipTextSelected: {
    color: '#FFFFFF',
  },
  topMeta: {
    color: readerColors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  hero: {
    height: '38%',
    backgroundColor: readerColors.imageFallback,
    justifyContent: 'flex-end',
  },
  heroCompact: {
    height: '30%',
  },
  storyHeader: {
    marginHorizontal: 16,
    marginTop: -20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 18,
    backgroundColor: readerColors.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: readerColors.sheetBorder,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  eyebrow: {
    color: readerColors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headline: {
    color: readerColors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  storyMeta: {
    color: readerColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  readerPanel: {
    flex: 1,
    minHeight: 0,
    marginTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: readerColors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: readerColors.sheetBorder,
    overflow: 'hidden',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 4,
  },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 16,
  },
  summary: {
    color: readerColors.textSecondary,
    fontSize: 16,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 8,
    backgroundColor: readerColors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: readerColors.sheetBorder,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: readerColors.sheetBorder,
    backgroundColor: readerColors.sheet,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionText: {
    color: readerColors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  nextCue: {
    textAlign: 'center',
    color: readerColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 2,
  },
  caughtUp: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  caughtUpBtn: {
    flex: 0,
    alignSelf: 'stretch',
    maxWidth: 280,
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
