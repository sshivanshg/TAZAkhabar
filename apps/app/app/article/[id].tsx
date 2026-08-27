import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Copy from 'lucide-react-native/icons/copy'
import MessageCircle from 'lucide-react-native/icons/message-circle'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { apiClient } from '../../src/api/client'
import {
  ArticleBottomBar,
  ArticleSkeleton,
  ArticleStory,
  ArticleTopBar,
  CaughtUpFooter,
  FeedSentinel,
  StoryDivider,
} from '../../src/components/article'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { BottomSheet } from '../../src/components/ui/BottomSheet'
import { isCompactNav, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { useLanguagePreference } from '../../src/preferences/LanguagePreferenceContext'
import {
  addBookmark,
  articleToBookmark,
  isBookmarked,
  removeBookmark,
} from '../../src/storage/bookmarks'
import { getStoredCitySlug } from '../../src/storage/cityPreference'
import { getViewSessionId } from '../../src/storage/viewSession'
import { PAGE_SIZE } from '../../src/theme/tokens'
import {
  ARTICLE_BOTTOM_BAR_HEIGHT,
  readerColors,
} from '../../src/theme/readerTokens'
import { todayCityIso } from '../../src/utils/cityCalendar'
import { formatLocationLabel } from '../../src/utils/formatLocationLabel'
import { openArticleSource } from '../../src/utils/openArticleSource'
import {
  articleShareUrl,
  copyTextToClipboard,
  shareArticle,
} from '../../src/utils/shareArticle'
import { shareArticleToWhatsApp, isHttpsUrl } from '../../src/utils/shareToWhatsApp'
import { replaceArticlePathId } from '../../src/utils/syncArticleUrl'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ArticleScreen() {
  return (
    <ScreenErrorBoundary name="article">
      <ArticleFeedBody />
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

const HERO_ELEVATE_AFTER = 120
const BOTTOM_BAR_AFTER = 240

function ArticleFeedBody() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const breakpoint = useBreakpoint()
  const compact = isCompactNav(breakpoint)
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
  const { preferredLanguage, setPreferredLanguage } = useLanguagePreference()
  const lang = preferredLanguage

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
  const [feedStart, setFeedStart] = useState(0)
  const [activeLocalIndex, setActiveLocalIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [headerElevated, setHeaderElevated] = useState(false)
  const [showBottomBar, setShowBottomBar] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [shareTarget, setShareTarget] = useState<ArticleResponse | null>(null)
  const offsetRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const hydratedIdsRef = useRef(new Set<number>())
  const listRef = useRef<FlatList<ArticleResponse>>(null)
  const activeIndexRef = useRef(0)
  const headerElevatedRef = useRef(false)
  const showBottomBarRef = useRef(false)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    setLoadMoreError(false)
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

      const safeStart = Math.max(0, startIndex)
      offsetRef.current = items.length
      hydratedIdsRef.current = new Set()
      setStack(items)
      setFeedStart(safeStart)
      setTotal(Math.max(pageTotal, items.length))
      setHasMore(items.length < pageTotal)
      setActiveLocalIndex(0)
      activeIndexRef.current = 0
      setHeaderElevated(false)
      headerElevatedRef.current = false
      setShowBottomBar(false)
      showBottomBarRef.current = false
      setLoading(false)
    } catch (err) {
      if (initialFromParams) {
        setStack([initialFromParams])
        setFeedStart(0)
        setTotal(1)
        setHasMore(false)
        setActiveLocalIndex(0)
        activeIndexRef.current = 0
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
    setLoadMoreError(false)
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
      setLoadMoreError(true)
    } finally {
      loadingMoreRef.current = false
    }
  }, [citySlug, feedCategory, lang, routeDate, hasMore])

  const visibleStack = useMemo(() => stack.slice(feedStart), [stack, feedStart])

  useEffect(() => {
    hydratedIdsRef.current = new Set()
  }, [lang])

  useEffect(() => {
    const nearby = [
      visibleStack[activeLocalIndex],
      visibleStack[activeLocalIndex + 1],
      visibleStack[activeLocalIndex + 2],
    ]
    for (const article of nearby) {
      if (article?.id == null) {
        continue
      }
      if (hydratedIdsRef.current.has(article.id)) {
        continue
      }
      if (article.body) {
        hydratedIdsRef.current.add(article.id)
        continue
      }
      hydratedIdsRef.current.add(article.id)
      void apiClient
        .getArticle(String(article.id), lang)
        .then((full) => {
          setStack((prev) => prev.map((item) => (item.id === full.id ? { ...item, ...full } : item)))
        })
        .catch(() => {
          hydratedIdsRef.current.delete(article.id!)
        })
    }
  }, [activeLocalIndex, visibleStack, lang])

  useEffect(() => {
    if (activeLocalIndex >= visibleStack.length - 2 && hasMore) {
      void loadMore()
    }
  }, [activeLocalIndex, visibleStack.length, hasMore, loadMore])

  useEffect(() => {
    const next = visibleStack[activeLocalIndex + 1]
    if (next?.imageUrl && isHttpsUrl(next.imageUrl)) {
      void Image.prefetch(next.imageUrl)
    }
  }, [activeLocalIndex, visibleStack])

  const recordView = useCallback(async (articleId: number | string | undefined) => {
    if (articleId == null) {
      return
    }
    const sessionId = await getViewSessionId()
    await apiClient.recordArticleView(String(articleId), sessionId)
  }, [])

  const activeArticle = visibleStack[activeLocalIndex] ?? visibleStack[0] ?? null

  useEffect(() => {
    if (activeArticle?.id == null) {
      return
    }
    void recordView(activeArticle.id)
    void isBookmarked(activeArticle.id).then((value) => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        if (value) {
          next.add(activeArticle.id!)
        } else {
          next.delete(activeArticle.id!)
        }
        return next
      })
    })
    replaceArticlePathId(activeArticle.id)
  }, [activeArticle, recordView])

  const onBack = useCallback(() => {
    router.back()
  }, [router])

  const flashNotice = useCallback((message: string) => {
    setNotice(message)
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current)
    }
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2200)
  }, [])

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current)
      }
    }
  }, [])

  const onShare = useCallback(
    async (article: ArticleResponse) => {
      const result = await shareArticle(article)
      if (result === 'copied') {
        flashNotice('Link copied')
        return
      }
      if (result === 'unavailable') {
        setShareTarget(article)
      }
    },
    [flashNotice],
  )

  const onToggleBookmark = useCallback(
    async (article: ArticleResponse) => {
      if (article.id == null) {
        return
      }
      const snapshot = articleToBookmark(article, citySlug || undefined)
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
    },
    [bookmarkedIds, citySlug],
  )

  const onReadSource = useCallback(
    (article: ArticleResponse, storyIndex: number) => {
      void openArticleSource(article.sourceUrl, {
        articleId: article.id,
        publisher: article.sourceName,
        storyIndex,
      })
    },
    [],
  )

  const retryArticle = useCallback(
    async (article: ArticleResponse) => {
      if (article.id == null) {
        return
      }
      hydratedIdsRef.current.delete(article.id)
      try {
        const full = await apiClient.getArticle(String(article.id), lang)
        hydratedIdsRef.current.add(full.id!)
        setStack((prev) => prev.map((item) => (item.id === full.id ? { ...item, ...full } : item)))
      } catch {
        hydratedIdsRef.current.delete(article.id)
      }
    },
    [lang],
  )

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y
    const elevated = y > HERO_ELEVATE_AFTER
    if (elevated !== headerElevatedRef.current) {
      headerElevatedRef.current = elevated
      setHeaderElevated(elevated)
    }
    const bar = y > BOTTOM_BAR_AFTER
    if (bar !== showBottomBarRef.current) {
      showBottomBarRef.current = bar
      setShowBottomBar(bar)
    }
  }, [])

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visible = viewableItems.filter((token) => token.isViewable && token.index != null)
      if (visible.length === 0) {
        return
      }
      const top = visible.reduce((best, token) =>
        (token.index ?? 0) < (best.index ?? 0) ? token : best,
      )
      if (top.index != null && top.index !== activeIndexRef.current) {
        activeIndexRef.current = top.index
        setActiveLocalIndex(top.index)
      }
    },
  ).current

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 45,
    minimumViewTime: 160,
  }).current

  const storyTotal = Math.max(total, stack.length)
  const storyPosition = Math.min(storyTotal, feedStart + activeLocalIndex + 1)
  const cityLabel = formatLocationLabel(citySlug)
  const listBottomPad =
    (compact ? ARTICLE_BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 8) : 24) + 28

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={styles.errorBtn}
        >
          <Text style={styles.errorBtnText}>Back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View
      style={styles.root}
      {...(Platform.OS === 'web' ? ({ role: 'main' } as object) : null)}
    >
      <StatusBar style="dark" />
      <FlatList
        ref={listRef}
        testID="article-feed"
        data={visibleStack}
        keyExtractor={(item) => String(item.id ?? item.headline)}
        extraData={{ activeLocalIndex, bookmarkedIds, lang }}
        renderItem={({ item, index: itemIndex }) => {
          const globalIndex = feedStart + itemIndex
          return (
            <View>
              {itemIndex > 0 ? <StoryDivider /> : null}
              <ArticleStory
                article={item}
                cityLabel={cityLabel}
                bookmarked={item.id != null && bookmarkedIds.has(item.id)}
                priorityImage={itemIndex <= 1}
                onShare={() => void onShare(item)}
                onSave={() => void onToggleBookmark(item)}
                onReadSource={() => onReadSource(item, globalIndex)}
                onRetry={() => void retryArticle(item)}
              />
            </View>
          )
        }}
        ListFooterComponent={
          <View>
            {hasMore ? (
              <>
                <StoryDivider />
                <ArticleSkeleton />
                {loadMoreError ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading the next story"
                    onPress={() => void loadMore()}
                    style={styles.retryMore}
                  >
                    <Text style={styles.retryMoreText}>Couldn’t load the next story. Retry</Text>
                  </Pressable>
                ) : null}
                <FeedSentinel disabled={!hasMore} onVisible={() => void loadMore()} />
              </>
            ) : (
              <CaughtUpFooter onBack={onBack} />
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.7}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={5}
        maxToRenderPerBatch={2}
        initialNumToRender={2}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: listBottomPad }}
      />

      <ArticleTopBar
        elevated={headerElevated}
        position={storyPosition}
        total={storyTotal}
        readingLanguage={preferredLanguage}
        onSelectLanguage={setPreferredLanguage}
        onBack={onBack}
      />

      {compact ? (
        <ArticleBottomBar
          visible={showBottomBar}
          bookmarked={activeArticle?.id != null && bookmarkedIds.has(activeArticle.id)}
          onShare={() => {
            if (activeArticle) {
              void onShare(activeArticle)
            }
          }}
          onSave={() => {
            if (activeArticle) {
              void onToggleBookmark(activeArticle)
            }
          }}
        />
      ) : null}

      {notice ? (
        <View
          style={[styles.notice, { bottom: compact && showBottomBar ? listBottomPad : 24 }]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <BottomSheet
        visible={shareTarget != null}
        title="Share story"
        onClose={() => setShareTarget(null)}
        items={
          shareTarget
            ? [
                {
                  key: 'copy',
                  label: 'Copy link',
                  Icon: Copy,
                  onPress: () => {
                    const url = articleShareUrl(shareTarget)
                    if (url) {
                      void copyTextToClipboard(url).then((ok) => {
                        if (ok) {
                          flashNotice('Link copied')
                        }
                      })
                    }
                  },
                },
                {
                  key: 'whatsapp',
                  label: 'WhatsApp',
                  Icon: MessageCircle,
                  onPress: () => {
                    void shareArticleToWhatsApp(shareTarget)
                  },
                },
              ]
            : []
        }
      />
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
  retryMore: {
    alignSelf: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryMoreText: {
    color: readerColors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  notice: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 30,
  },
  noticeText: {
    backgroundColor: readerColors.text,
    color: '#FFFFFF',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
})
