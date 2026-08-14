import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { apiClient } from '../../src/api/client'
import { CaughtUpCard, SwipeStoryCard } from '../../src/components/SwipeStoryCard'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { useLanguagePreference } from '../../src/preferences/LanguagePreferenceContext'
import {
  addBookmark,
  articleToBookmark,
  isBookmarked,
  removeBookmark,
} from '../../src/storage/bookmarks'
import { getStoredCitySlug } from '../../src/storage/cityPreference'
import {
  hasCompletedSwipeCoach,
  markSwipeCoachCompleted,
} from '../../src/storage/swipeCoach'
import { getViewSessionId } from '../../src/storage/viewSession'
import { PAGE_SIZE } from '../../src/theme/tokens'
import { readerColors } from '../../src/theme/readerTokens'
import { todayCityIso } from '../../src/utils/cityCalendar'
import { shareArticleToWhatsApp } from '../../src/utils/shareToWhatsApp'

export default function ArticleScreen() {
  return (
    <ScreenErrorBoundary name="article">
      <ArticlePagerBody />
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

type PagerItem =
  | { kind: 'story'; article: ArticleResponse }
  | { kind: 'end'; key: string }

function ArticlePagerBody() {
  const router = useRouter()
  const { height: windowHeight } = useWindowDimensions()
  const raw = useLocalSearchParams<{
    id?: string
    headline?: string
    summary?: string
    sourceName?: string
    sourceUrl?: string
    imageUrl?: string
    publishedAt?: string
    category?: string
    city?: string
    feedCategory?: string
    date?: string
    lang?: string
  }>()

  const id = paramString(raw.id)
  const routeCity = paramString(raw.city)
  const feedCategory = paramString(raw.feedCategory)
  const routeDate = paramString(raw.date)
  const routeLang = paramString(raw.lang)
  const { preferredLanguage } = useLanguagePreference()
  const lang = routeLang || preferredLanguage

  const initialFromParams: ArticleResponse | null = useMemo(() => {
    if (
      !id ||
      !paramsLookComplete({
        headline: paramString(raw.headline),
        summary: paramString(raw.summary),
        sourceName: paramString(raw.sourceName),
      })
    ) {
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

  const [citySlug, setCitySlug] = useState(routeCity)
  const [stack, setStack] = useState<ArticleResponse[]>(
    initialFromParams ? [initialFromParams] : [],
  )
  const [total, setTotal] = useState(initialFromParams ? 1 : 0)
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCoach, setShowCoach] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const initialIndexRef = useRef(0)
  const coachCompletedRef = useRef(false)
  const listRef = useRef<FlatList<PagerItem>>(null)
  const shareLabel = Platform.OS === 'web' ? 'Share on WhatsApp' : 'Share'

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (routeCity) {
        setCitySlug(routeCity)
        return
      }
      const stored = await getStoredCitySlug()
      if (!cancelled && stored) {
        setCitySlug(stored)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [routeCity])

  useEffect(() => {
    let cancelled = false
    void hasCompletedSwipeCoach().then((done) => {
      if (!cancelled) {
        coachCompletedRef.current = done
        setShowCoach(!done)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const loadStack = useCallback(async () => {
    if (!citySlug) {
      if (!id) {
        setError('Article not found')
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)
    try {
      const isToday = !routeDate || routeDate === todayCityIso()
      const first = await apiClient.getArticles({
        city: citySlug,
        category: feedCategory || undefined,
        lang,
        date: isToday ? undefined : routeDate || undefined,
        offset: 0,
        limit: PAGE_SIZE,
      })
      let items = first.items ?? []
      const pageTotal = first.total ?? items.length
      let startIndex = items.findIndex((a) => String(a.id) === id)

      if (startIndex < 0 && id) {
        try {
          const single = await apiClient.getArticle(id, lang)
          items = [single, ...items.filter((a) => a.id !== single.id)]
          startIndex = 0
        } catch {
          if (!initialFromParams) {
            setError('Article not found')
            setStack([])
            setLoading(false)
            return
          }
          items = [initialFromParams]
          startIndex = 0
        }
      }

      if (items.length === 0) {
        setError('Article not found')
        setStack([])
        setLoading(false)
        return
      }

      offsetRef.current = items.length
      initialIndexRef.current = Math.max(0, startIndex)
      setStack(items)
      setTotal(Math.max(pageTotal, items.length))
      setHasMore(items.length < pageTotal)
      setIndex(Math.max(0, startIndex))
      setLoading(false)
    } catch (err) {
      if (initialFromParams) {
        setStack([initialFromParams])
        setTotal(1)
        setHasMore(false)
        setIndex(0)
        setLoading(false)
        return
      }
      setError(err instanceof Error ? err.message : 'Could not load article')
      setLoading(false)
    }
  }, [citySlug, feedCategory, lang, routeDate, id, initialFromParams])

  useEffect(() => {
    void loadStack()
  }, [loadStack])

  const loadMore = useCallback(async () => {
    if (!citySlug || loadingMoreRef.current || !hasMore) {
      return
    }
    loadingMoreRef.current = true
    try {
      const isToday = !routeDate || routeDate === todayCityIso()
      const result = await apiClient.getArticles({
        city: citySlug,
        category: feedCategory || undefined,
        lang,
        date: isToday ? undefined : routeDate || undefined,
        offset: offsetRef.current,
        limit: PAGE_SIZE,
      })
      const items = result.items ?? []
      if (items.length === 0) {
        setHasMore(false)
        return
      }
      setStack((prev) => {
        const seen = new Set(prev.map((a) => a.id))
        const merged = [...prev]
        for (const item of items) {
          if (item.id != null && !seen.has(item.id)) {
            merged.push(item)
          }
        }
        offsetRef.current = merged.length
        setHasMore(merged.length < (result.total ?? merged.length))
        return merged
      })
      setTotal(result.total ?? offsetRef.current)
    } catch {
      // Soft fail — stay on current cards.
    } finally {
      loadingMoreRef.current = false
    }
  }, [citySlug, feedCategory, lang, routeDate, hasMore])

  useEffect(() => {
    if (index >= stack.length - 3 && hasMore) {
      void loadMore()
    }
  }, [index, stack.length, hasMore, loadMore])

  const recordView = useCallback(async (articleId: number | string | undefined) => {
    if (articleId == null) {
      return
    }
    const sessionId = await getViewSessionId()
    await apiClient.recordArticleView(String(articleId), sessionId)
  }, [])

  useEffect(() => {
    const current = stack[index]
    if (current?.id != null) {
      void recordView(current.id)
      void isBookmarked(current.id).then((value) => {
        setBookmarkedIds((prev) => {
          const next = new Set(prev)
          if (value) {
            next.add(current.id!)
          } else {
            next.delete(current.id!)
          }
          return next
        })
      })
    }
  }, [index, stack, recordView])

  const dismissCoachIfNeeded = useCallback(async (nextIndex: number) => {
    if (coachCompletedRef.current) {
      return
    }
    if (nextIndex !== initialIndexRef.current) {
      coachCompletedRef.current = true
      setShowCoach(false)
      await markSwipeCoachCompleted()
    }
  }, [])

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.y / windowHeight)
      if (Number.isFinite(next) && next !== index) {
        setIndex(next)
        void dismissCoachIfNeeded(next)
      }
    },
    [windowHeight, index, dismissCoachIfNeeded],
  )

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]
      if (first?.index != null && first.index !== index) {
        setIndex(first.index)
        void dismissCoachIfNeeded(first.index)
      }
    },
  ).current

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current

  const pagerItems: PagerItem[] = useMemo(() => {
    const items: PagerItem[] = stack.map((article) => ({ kind: 'story', article }))
    if (!hasMore && stack.length > 0) {
      items.push({ kind: 'end', key: 'caught-up' })
    }
    return items
  }, [stack, hasMore])

  const storyTotal = Math.max(total, stack.length)

  const onBack = useCallback(() => {
    router.back()
  }, [router])

  const onShare = useCallback(async (article: ArticleResponse) => {
    await shareArticleToWhatsApp(article)
  }, [])

  const onToggleBookmark = useCallback(async (article: ArticleResponse) => {
    if (article.id == null) {
      return
    }
    const snapshot = articleToBookmark(article)
    if (!snapshot) {
      return
    }
    const currently = bookmarkedIds.has(article.id)
    if (currently) {
      await removeBookmark(article.id)
      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        next.delete(article.id!)
        return next
      })
    } else {
      await addBookmark(snapshot)
      setBookmarkedIds((prev) => new Set(prev).add(article.id!))
    }
  }, [bookmarkedIds])

  if (loading && stack.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={readerColors.accent} />
      </View>
    )
  }

  if (error && stack.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Story unavailable</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        testID="story-pager"
        data={pagerItems}
        keyExtractor={(item) =>
          item.kind === 'end' ? item.key : String(item.article.id ?? item.article.headline)
        }
        renderItem={({ item, index: itemIndex }) => {
          if (item.kind === 'end') {
            return <CaughtUpCard height={windowHeight} onBack={onBack} />
          }
          const article = item.article
          return (
            <SwipeStoryCard
              article={article}
              index={itemIndex}
              total={storyTotal}
              height={windowHeight}
              cityLabel={citySlug || undefined}
              bookmarked={article.id != null && bookmarkedIds.has(article.id)}
              shareLabel={shareLabel}
              onBack={onBack}
              onShare={() => void onShare(article)}
              onToggleBookmark={() => void onToggleBookmark(article)}
              showNextCue={hasMore || itemIndex < pagerItems.length - 2}
            />
          )
        }}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, i) => ({
          length: windowHeight,
          offset: windowHeight * i,
          index: i,
        })}
        initialScrollIndex={Math.min(initialIndexRef.current, Math.max(pagerItems.length - 1, 0))}
        onScrollToIndexFailed={() => {
          // ignore — FlatList will settle
        }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {showCoach ? (
        <View style={styles.coachOverlay} pointerEvents="box-none">
          <View style={styles.coachSheet}>
            <Text style={styles.coachArrow}>↑</Text>
            <Text style={styles.coachTitle}>Swipe up for the next story</Text>
            <Text style={styles.coachBody}>Shown until you swipe once</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: readerColors.canvas,
  },
  center: {
    flex: 1,
    backgroundColor: readerColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: readerColors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  errorBody: {
    color: readerColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  errorBtn: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: readerColors.sheet,
    borderWidth: 1,
    borderColor: readerColors.sheetBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBtnText: {
    color: readerColors.accent,
    fontWeight: '600',
  },
  coachOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: readerColors.overlay,
    justifyContent: 'flex-end',
    padding: 20,
  },
  coachSheet: {
    backgroundColor: readerColors.sheet,
    borderColor: readerColors.sheetBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  coachArrow: {
    color: readerColors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  coachTitle: {
    marginTop: 8,
    color: readerColors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  coachBody: {
    marginTop: 6,
    color: readerColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
})
