import { memo, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { cleanHeadline, isRedundantSummary } from '../../lib/headline'
import { ARTICLE_COLUMN_MAX, type ReaderColors } from '../../theme/readerTokens'
import { formatRelativeTime } from '../../utils/relativeTime'
import { buildArticleDisplayContent, estimateArticleReadableText } from '../../utils/articleContent'
import { estimateReadingMinutes, formatReadingTime } from '../../utils/readingTime'
import { isHttpsUrl } from '../../utils/shareToWhatsApp'
import { normalizeArticleSourceUrl } from '../../utils/normalizeArticleSourceUrl'
import type { ArticleBlock } from '../../utils/splitArticleBody'
import { pressableState, webFocusRing } from './focusStyle'
import { storyEyebrow } from './eyebrow'
import { ARTICLE_COPY } from './copy'

type Props = {
  article: ArticleResponse
  /** Reader's city slug; `global` falls back to the story category. */
  citySlug?: string
  /** Show the calm "Next story ↓" cue at the end of the story. */
  showNextCue?: boolean
  priorityImage?: boolean
  bodyLoading?: boolean
  /** True only when fetching the full story failed (not when the API has no body). */
  bodyFailed?: boolean
  onReadSource: () => void
  onRetry?: () => void
}

function publisherName(article: ArticleResponse): string | undefined {
  const name = article.sourceName?.trim()
  return name || undefined
}

function ArticleHero({
  uri,
  headline,
  priority,
  styles,
}: {
  uri: string | null
  headline: string
  priority: boolean
  styles: ReturnType<typeof createStyles>
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const showImage = Boolean(uri) && !failed
  // Fix 4: no image (or a broken one) means no hero block at all.
  if (!showImage) return null

  return (
    <View style={styles.hero} accessibilityRole="image" accessibilityLabel={headline}>
      <Image
        source={{ uri: uri! }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        {...(Platform.OS === 'web' ? ({ loading: priority ? 'eager' : 'lazy' } as object) : null)}
      />
      {!loaded ? <View style={styles.heroPlaceholder} /> : null}
    </View>
  )
}

function ArticleStoryBase({
  article,
  citySlug,
  showNextCue = false,
  priorityImage = false,
  bodyLoading = false,
  onReadSource,
  onRetry,
  bodyFailed = false,
}: Props) {
  const { readerColors } = useTheme()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])
  const { width } = useWindowDimensions()
  const imageUri = article.imageUrl && isHttpsUrl(article.imageUrl) ? article.imageUrl : null
  const location = storyEyebrow(citySlug, article.category)
  const publisher = publisherName(article)
  const sourceUrl = (() => {
    const normalized = normalizeArticleSourceUrl(article.sourceUrl)
    return isHttpsUrl(normalized) ? normalized : undefined
  })()
  const time = article.publishedAt ? formatRelativeTime(article.publishedAt) : null
  const displayContent = useMemo(
    () =>
      buildArticleDisplayContent(
        article.body,
        isRedundantSummary(article.headline, article.summary) ? null : article.summary,
      ),
    [article.body, article.summary, article.headline],
  )
  const readingTime = formatReadingTime(
    estimateReadingMinutes(estimateArticleReadableText(displayContent)),
  )
  const metaParts = [publisher, time, readingTime].filter(Boolean)
  const headline = cleanHeadline(article.headline ?? '', publisher) || 'Untitled story'
  const headlineSize = width >= 768 ? 36 : 30
  const headlineLine = width >= 768 ? 40 : 34
  const hasContent = displayContent.hasReadableContent
  const showLoadError = bodyFailed && !hasContent && !bodyLoading
  const showBodyLoading = bodyLoading && !hasContent

  const renderBlocks = (blocks: ArticleBlock[], keyPrefix: string) =>
    blocks.map((block, index) => {
      if (block.type === 'ul') {
        return (
          <View key={`${keyPrefix}-ul-${index}`} style={styles.list}>
            {block.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.paragraph}>{item}</Text>
              </View>
            ))}
          </View>
        )
      }
      if (block.type === 'quote') {
        return (
          <View key={`${keyPrefix}-q-${index}`} style={styles.quote}>
            <Text style={styles.quoteText}>{block.text}</Text>
          </View>
        )
      }
      const paragraphStyle =
        keyPrefix === 'lede' ? [styles.paragraph, styles.lede] : styles.paragraph
      return (
        <Text key={`${keyPrefix}-p-${index}`} style={paragraphStyle}>
          {block.text}
        </Text>
      )
    })

  return (
    <View {...(Platform.OS === 'web' ? ({ role: 'article' } as object) : null)} style={styles.root}>
      <ArticleHero key={imageUri} uri={imageUri} headline={headline} priority={priorityImage} styles={styles} />

      <View style={styles.column}>
        <View
          accessibilityRole="header"
          {...(Platform.OS === 'web' ? ({ role: 'header' } as object) : null)}
          style={styles.header}
        >
          {location ? <Text style={styles.eyebrow}>{location}</Text> : null}
          <Text style={[styles.headline, { fontSize: headlineSize, lineHeight: headlineLine }]}>
            {headline}
          </Text>
          {metaParts.length > 0 ? <Text style={styles.meta}>{metaParts.join(' · ')}</Text> : null}
        </View>

        {hasContent || showBodyLoading || showLoadError ? (
          <View style={styles.body}>
            {hasContent ? (
              <>
                {displayContent.ledeBlocks.length > 0 ? (
                  <View style={styles.ledeWrap}>
                    {renderBlocks(displayContent.ledeBlocks, 'lede')}
                  </View>
                ) : null}
                {renderBlocks(displayContent.bodyBlocks, 'body')}
              </>
            ) : showBodyLoading ? (
              <View style={styles.loadingBody} accessibilityLabel="Loading full story">
                <ActivityIndicator color={readerColors.accent} />
                <Text style={styles.loadingLabel}>Loading full story…</Text>
              </View>
            ) : (
              <View style={styles.emptyBody}>
                <Text style={styles.emptyTitle}>Unable to load this story.</Text>
                {onRetry ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading this story"
                    onPress={onRetry}
                    style={(state) => {
                      const { pressed, focused } = pressableState(state)
                      return [
                        styles.retry,
                        pressed ? styles.pressed : null,
                        webFocusRing(Boolean(focused), readerColors),
                      ]
                    }}
                  >
                    <Text style={styles.retryLabel}>Retry</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        ) : null}

        {sourceUrl ? (
          <Pressable
            testID="read-original"
            accessibilityRole="link"
            accessibilityLabel={`Read original article from ${publisher ?? 'the publisher'}`}
            onPress={onReadSource}
            style={(state) => {
              const { pressed, focused } = pressableState(state)
              return [
                styles.originalCta,
                pressed ? styles.pressed : null,
                webFocusRing(Boolean(focused), readerColors),
              ]
            }}
          >
            <Text style={styles.originalCtaText}>Read original article ↗</Text>
          </Pressable>
        ) : null}

        {publisher || sourceUrl ? (
          <View style={styles.attribution}>
            <Text style={styles.attributionKicker}>Original reporting</Text>
            <Text style={styles.attributionBody}>
              {publisher
                ? `This story is based on reporting published by ${publisher}.`
                : 'This story is based on the original publisher’s reporting.'}
            </Text>
          </View>
        ) : null}

        {showNextCue ? (
          <View
            testID="next-story-cue"
            style={styles.nextCue}
            accessible
            accessibilityLabel={ARTICLE_COPY.nextStoryA11y}
          >
            <Text style={styles.nextCueText}>{ARTICLE_COPY.nextStory}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export const ArticleStory = memo(ArticleStoryBase)

function createStyles(c: ReaderColors) {
  return StyleSheet.create({
    root: {
      width: '100%',
      flexGrow: 1,
      backgroundColor: c.card,
    },
    hero: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: c.imageFallback,
      overflow: 'hidden',
    },
    heroPlaceholder: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.imageFallback,
    },
    column: {
      width: '100%',
      maxWidth: ARTICLE_COLUMN_MAX,
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 18,
    },
    header: {
      gap: 10,
    },
    eyebrow: {
      color: c.accent,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '700',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    headline: {
      color: c.text,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
    meta: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 2,
    },
    originalCta: {
      alignSelf: 'flex-start',
      marginTop: 22,
      marginBottom: 2,
      minHeight: 44,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    originalCtaText: {
      color: c.accent,
      fontSize: 15,
      fontWeight: '700',
    },
    body: {
      marginTop: 18,
      gap: 16,
    },
    ledeWrap: {
      gap: 14,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.sheetBorder,
      marginBottom: 2,
    },
    lede: {
      color: c.textSecondary,
      fontSize: 19,
      lineHeight: 30,
      fontWeight: '500',
    },
    loadingBody: {
      minHeight: 120,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingLabel: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    paragraph: {
      color: c.text,
      fontSize: 18,
      lineHeight: 29,
    },
    list: {
      gap: 8,
    },
    listItem: {
      flexDirection: 'row',
      gap: 10,
      paddingRight: 8,
    },
    bullet: {
      color: c.text,
      fontSize: 18,
      lineHeight: 29,
      width: 14,
    },
    quote: {
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
      paddingLeft: 14,
      paddingVertical: 4,
    },
    quoteText: {
      color: c.textSecondary,
      fontSize: 18,
      lineHeight: 28,
      fontStyle: 'italic',
    },
    emptyBody: {
      gap: 12,
    },
    emptyTitle: {
      color: c.textSecondary,
      fontSize: 16,
      lineHeight: 24,
    },
    retry: {
      alignSelf: 'flex-start',
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.sheetBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryLabel: {
      color: c.accent,
      fontSize: 15,
      fontWeight: '600',
    },
    attribution: {
      marginTop: 28,
      marginBottom: 8,
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.sheet,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.sheetBorder,
      gap: 6,
    },
    attributionKicker: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    attributionBody: {
      color: c.textSecondary,
      fontSize: 16,
      lineHeight: 24,
    },
    pressed: {
      opacity: 0.78,
    },
    nextCue: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 8,
    },
    nextCueText: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
    },
  })
}
