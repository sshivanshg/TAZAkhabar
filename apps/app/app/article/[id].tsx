import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image, Text } from '@gluestack-ui/themed'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { apiClient } from '../../src/api/client'
import { useLanguagePreference } from '../../src/preferences/LanguagePreferenceContext'
import { isArticleTranslated } from '../../src/utils/articleLanguage'
import { ImageBottomFade } from '../../src/components/ImageBottomFade'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import {
  addBookmark,
  articleToBookmark,
  isBookmarked,
  removeBookmark,
} from '../../src/storage/bookmarks'
import { getViewSessionId } from '../../src/storage/viewSession'
import {
  colors,
  media,
  radius,
  space,
  typography,
} from '../../src/theme/tokens'
import { formatRelativeTime } from '../../src/utils/relativeTime'
import {
  isHttpsUrl,
  openHttpsSource,
  shareArticleToWhatsApp,
} from '../../src/utils/shareToWhatsApp'

export default function ArticleScreen() {
  return (
    <ScreenErrorBoundary name="article">
      <ArticleBody />
    </ScreenErrorBoundary>
  )
}

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
}

function paramsLookComplete(params: {
  headline?: string
  summary?: string
  sourceName?: string
}): boolean {
  return Boolean(params.headline?.trim() && params.summary?.trim())
}

function ArticleBody() {
  const router = useRouter()
  const { width: windowWidth } = useWindowDimensions()
  const raw = useLocalSearchParams<{
    id?: string
    headline?: string
    summary?: string
    sourceName?: string
    sourceUrl?: string
    imageUrl?: string
    publishedAt?: string
    category?: string
  }>()

  const id = paramString(raw.id)
  const initialFromParams: ArticleResponse | null = useMemo(() => {
    if (!id || !paramsLookComplete({
      headline: paramString(raw.headline),
      summary: paramString(raw.summary),
      sourceName: paramString(raw.sourceName),
    })) {
      return null
    }
    const image = paramString(raw.imageUrl)
    return {
      id: Number(id) || undefined,
      headline: paramString(raw.headline),
      summary: paramString(raw.summary),
      sourceName: paramString(raw.sourceName),
      sourceUrl: paramString(raw.sourceUrl) || undefined,
      imageUrl: image || undefined,
      publishedAt: paramString(raw.publishedAt) || undefined,
      category: paramString(raw.category) || undefined,
    }
  }, [id, raw.headline, raw.summary, raw.sourceName, raw.sourceUrl, raw.imageUrl, raw.publishedAt, raw.category])

  const { preferredLanguage } = useLanguagePreference()
  const [article, setArticle] = useState<ArticleResponse | null>(initialFromParams)
  const [loading, setLoading] = useState(!initialFromParams && Boolean(id))
  const [error, setError] = useState<string | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const shareLabel = Platform.OS === 'web' ? 'Share on WhatsApp' : 'Share'

  const scrollY = useRef(new Animated.Value(0)).current
  const [contentHeight, setContentHeight] = useState(1)
  const [layoutHeight, setLayoutHeight] = useState(1)
  const [trackWidth, setTrackWidth] = useState(windowWidth)

  const loadArticle = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!id) {
      setError('Article not found')
      setLoading(false)
      return
    }
    // Keep optimistic placeholder visible; only show spinner when we have nothing yet.
    if (!initialFromParams) {
      setLoading(true)
    }
    setError(null)
    try {
      const result = await apiClient.getArticle(id, preferredLanguage)
      if (signal?.cancelled) {
        return
      }
      setArticle(result)
      setError(null)
    } catch (err) {
      if (signal?.cancelled) {
        return
      }
      // Keep optimistic placeholder if present; only surface errors when we have nothing to show.
      if (!initialFromParams) {
        setError(err instanceof Error ? err.message : 'Could not load article')
        setArticle(null)
      }
    } finally {
      if (!signal?.cancelled) {
        setLoading(false)
      }
    }
  }, [id, initialFromParams, preferredLanguage])

  useEffect(() => {
    // Params are an optimistic placeholder only; always reconcile from the API when id is present.
    if (initialFromParams) {
      setArticle(initialFromParams)
      setLoading(false)
      setError(null)
    } else if (!id) {
      setArticle(null)
      setError('Article not found')
      setLoading(false)
      return
    } else {
      setArticle(null)
      setLoading(true)
    }

    const signal = { cancelled: false }
    void loadArticle(signal)
    return () => {
      signal.cancelled = true
    }
  }, [id, initialFromParams, loadArticle])

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false
    void (async () => {
      const sessionId = await getViewSessionId()
      if (cancelled) {
        return
      }
      await apiClient.recordArticleView(id, sessionId)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    const articleId = article?.id ?? id
    if (!articleId) {
      setBookmarked(false)
      return
    }
    let cancelled = false
    void isBookmarked(articleId).then((value) => {
      if (!cancelled) {
        setBookmarked(value)
      }
    })
    return () => {
      cancelled = true
    }
  }, [article?.id, id])

  const progressWidth = useMemo(() => {
    const maxScroll = Math.max(contentHeight - layoutHeight, 1)
    return scrollY.interpolate({
      inputRange: [0, maxScroll],
      outputRange: [0, trackWidth],
      extrapolate: 'clamp',
    })
  }, [scrollY, contentHeight, layoutHeight, trackWidth])

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      }),
    [scrollY],
  )

  const headline = article?.headline || 'Article'
  const summary = article?.summary || ''
  const sourceName = article?.sourceName || 'Source'
  const sourceUrl = article?.sourceUrl
  const imageUrl = article?.imageUrl
  const relative = formatRelativeTime(article?.publishedAt)
  const canOpenSource = isHttpsUrl(sourceUrl)

  const onToggleBookmark = async () => {
    if (!article?.id) {
      return
    }
    const snap = articleToBookmark(article)
    if (!snap) {
      return
    }
    if (bookmarked) {
      await removeBookmark(snap.id)
      setBookmarked(false)
    } else {
      await addBookmark(snap)
      setBookmarked(true)
    }
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text fontSize={16} lineHeight={24} color={colors.textSecondary} mt="$3">
          Loading article…
        </Text>
      </View>
    )
  }

  if (!article) {
    return (
      <View style={[styles.root, styles.centeredPad]}>
        <Text fontSize={18} lineHeight={28} fontWeight="$bold" color={colors.text}>
          Something went wrong
        </Text>
        <Text fontSize={16} lineHeight={24} color={colors.textSecondary} mt="$2" mb="$4">
          {error ?? 'Article not found'}
        </Text>
        <Pressable
          onPress={() => void loadArticle()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading article"
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed ? styles.primaryPressed : null,
          ]}
        >
          <Text
            fontSize={typography.button.fontSize}
            lineHeight={typography.button.lineHeight}
            fontWeight="$semibold"
            color={colors.textOnAccent}
          >
            Try again
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to feed"
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed ? styles.secondaryPressed : null,
          ]}
        >
          <Text
            fontSize={typography.button.fontSize}
            lineHeight={typography.button.lineHeight}
            fontWeight="$semibold"
            color={colors.textSecondary}
          >
            Back to feed
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View
        style={styles.progressTrack}
        accessibilityLabel="Reading progress"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_w, h) => setContentHeight(h)}
      >
        {imageUrl ? (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: imageUrl }}
              alt=""
              w="$full"
              h={media.articleHeroHeight}
              resizeMode="cover"
            />
            <ImageBottomFade height={96} />
          </View>
        ) : null}

        <View style={[styles.body, !imageUrl ? styles.bodyNoImage : null]}>
          {isArticleTranslated(article) ? (
            <Text
              fontSize={typography.label.fontSize}
              lineHeight={typography.label.lineHeight}
              fontWeight="$medium"
              color={colors.textMuted}
              mb="$2"
              accessibilityLabel="Machine translated"
            >
              Translated
            </Text>
          ) : null}
          <Text
            fontSize={26}
            lineHeight={34}
            fontWeight="$bold"
            color={colors.text}
            letterSpacing={-0.3}
          >
            {headline}
          </Text>

          <Text
            fontSize={typography.meta.fontSize}
            lineHeight={typography.meta.lineHeight}
            letterSpacing={typography.meta.letterSpacing}
            fontWeight="$medium"
            color={colors.textMuted}
            textTransform="uppercase"
            style={styles.meta}
          >
            {sourceName}
            {relative ? `  ·  ${relative}` : ''}
          </Text>

          {summary ? (
            <Text
              fontSize={typography.summary.fontSize}
              lineHeight={Math.round(typography.summary.lineHeight * 1.05)}
              color={colors.textSecondary}
              style={styles.summary}
            >
              {summary}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() => void shareArticleToWhatsApp({
                headline: article.headline,
                summary: article.summary,
                sourceUrl: article.sourceUrl,
              })}
              accessibilityRole="button"
              accessibilityLabel={shareLabel}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed ? styles.primaryPressed : null,
              ]}
            >
              <Text
                fontSize={typography.button.fontSize}
                lineHeight={typography.button.lineHeight}
                fontWeight="$semibold"
                color={colors.textOnAccent}
              >
                {shareLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void onToggleBookmark()}
              accessibilityRole="button"
              accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Save bookmark'}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed ? styles.secondaryPressed : null,
              ]}
            >
              <Text
                fontSize={typography.button.fontSize}
                lineHeight={typography.button.lineHeight}
                fontWeight="$semibold"
                color={colors.text}
              >
                {bookmarked ? 'Remove bookmark' : 'Save'}
              </Text>
            </Pressable>

            {canOpenSource ? (
              <Pressable
                onPress={() => void openHttpsSource(sourceUrl)}
                accessibilityRole="button"
                accessibilityLabel="Open original source"
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed ? styles.secondaryPressed : null,
                ]}
              >
                <Text
                  fontSize={typography.button.fontSize}
                  lineHeight={typography.button.lineHeight}
                  fontWeight="$semibold"
                  color={colors.textSecondary}
                >
                  Open original source
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to feed"
              style={({ pressed }) => [
                styles.ghostBtn,
                pressed ? styles.secondaryPressed : null,
              ]}
            >
              <Text
                fontSize={typography.button.fontSize}
                lineHeight={typography.button.lineHeight}
                fontWeight="$semibold"
                color={colors.textSecondary}
              >
                Back to feed
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredPad: {
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: space.xxl,
  },
  heroWrap: {
    width: '100%',
    height: media.articleHeroHeight,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
  },
  bodyNoImage: {
    paddingTop: space.xl,
  },
  meta: {
    marginTop: space.xs,
  },
  summary: {
    marginTop: space.md,
  },
  actions: {
    marginTop: space.xl,
    gap: space.sm,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  secondaryBtn: {
    minHeight: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.chipInactiveBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  secondaryPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  ghostBtn: {
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
})
