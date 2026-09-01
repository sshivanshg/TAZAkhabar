import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Box, HStack, Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { ArticleResponse, CityResponse, FeedSection } from '@tazakhabar/shared-types'
import { apiClient } from '../../src/api/client'
import { useAsyncResource } from '../../src/api/useAsyncResource'
import { BreakingHeroCard } from '../../src/components/BreakingHeroCard'
import { buildStorySections } from '../../src/components/buildStorySections'
import {
  BottomSheet,
  type BottomSheetSection,
} from '../../src/components/ui/BottomSheet'
import { BreakingNewsCarousel } from '../../src/components/BreakingNewsCarousel'
import { CategoryChipRow } from '../../src/components/CategoryChips'
import {
  CompactArticleCard,
  CompactArticleCardSkeleton,
} from '../../src/components/CompactArticleCard'
import { RelatedStoriesStrip } from '../../src/components/RelatedStoriesStrip'
import { ConfirmModal } from '../../src/components/ConfirmModal'
import { AddToHomeBanner } from '../../src/components/AddToHomeBanner'
import { NotificationOptInBanner } from '../../src/components/NotificationOptInBanner'
import { BriefingHeader } from '../../src/components/desktop/BriefingHeader'
import { CategoryNavBar } from '../../src/components/desktop/CategoryNavBar'
import { ExpandedTopBar } from '../../src/components/desktop/ExpandedTopBar'
import { LocalNewsRail } from '../../src/components/desktop/LocalNewsRail'
import { TopStoriesCluster } from '../../src/components/desktop/TopStoriesCluster'
import {
  StoryOptionsPopover,
  captureMoreButtonAnchor,
  type StoryOptionsAnchor,
} from '../../src/components/desktop/StoryOptionsPopover'
import { HomeTopBar } from '../../src/components/HomeTopBar'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { ErrorState } from '../../src/components/ui/ErrorState'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import { useLanguagePreference } from '../../src/preferences/LanguagePreferenceContext'
import { useTheme } from '../../src/preferences/ThemePreferenceContext'
import {
  articleToBookmark,
  getBookmarks,
  removeBookmark,
  addBookmark,
} from '../../src/storage/bookmarks'
import { getStoredCitySlug, setStoredCitySlug } from '../../src/storage/cityPreference'
import { getPersonalizationId } from '../../src/storage/personalizationId'
import {
  feedCacheKey,
  isFeedCacheFresh,
  readFeedCache,
  writeFeedCache,
} from '../../src/storage/feedCache'
import {
  BREAKING_NEWS_COUNT,
  FEED_CATEGORIES,
  FEED_CATEGORY_LABELS,
  type FeedCategory,
  PAGE_SIZE,
  ERROR_COLUMN_MAX,
  isFeedCategory,
  media,
  radius,
  space,
  typography,
  type AppColors,
} from '../../src/theme/tokens'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isDesktopLayout, isExpandedLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { articleRouteParams } from '../../src/utils/articleRouteParams'
import { buildMobileFeedRows } from '../../src/utils/feedLayout'
import {
  buildExpandedFeedRows,
  buildExpandedFeedSlices,
} from '../../src/utils/expandedFeedLayout'
import { openArticleSource } from '../../src/utils/openArticleSource'
import { shareArticle } from '../../src/utils/shareArticle'

type ListRow =
  | { kind: 'breaking'; key: 'breaking' }
  | { kind: 'picks-section'; key: 'picks-section' }
  | { kind: 'for-you-section'; key: 'for-you-section' }
  | { kind: 'trending'; key: 'trending' }
  | { kind: 'section'; key: string; title: string; showAction?: boolean }
  | { kind: 'empty'; key: 'empty' }
  | { kind: 'featured'; key: string; article: ArticleResponse; index: number }
  | { kind: 'related'; key: string; articles: ArticleResponse[] }
  | { kind: 'article'; key: string; article: ArticleResponse; index: number }
  | {
      kind: 'article-row'
      key: string
      left: ArticleResponse
      right?: ArticleResponse
      index: number
    }

type WebHoverHandlers = {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const EMPTY_CITIES: CityResponse[] = []
const EMPTY_ARTICLES: ArticleResponse[] = []

function ArticleCardSlot({
  desktop,
  padStyle,
  hostRef,
  children,
}: {
  desktop: boolean
  padStyle: StyleProp<ViewStyle>
  hostRef?: (node: View | null) => void
  children: ReactNode
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [hovered, setHovered] = useState(false)
  const webHover: WebHoverHandlers =
    desktop && Platform.OS === 'web'
      ? {
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
        }
      : {}

  return (
    <View
      ref={hostRef}
      collapsable={desktop ? false : undefined}
      style={[padStyle, desktop && hovered ? styles.cardHover : null]}
      {...webHover}
    >
      {children}
    </View>
  )
}

export default function HomeFeedScreen() {
  return (
    <ScreenErrorBoundary name="home">
      <TabScreenShell>
        <HomeFeedBody />
      </TabScreenShell>
    </ScreenErrorBoundary>
  )
}

function HomeFeedBody() {
  const router = useRouter()
  const params = useLocalSearchParams<{ city?: string; category?: string }>()
  const prefs = useFeedPreferences()
  const { preferredLanguage, setPreferredLanguage, ready: languageReady } =
    useLanguagePreference()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const tabClearance = useTabBarClearance()
  const bp = useBreakpoint()
  const desktop = isDesktopLayout(bp)
  const expanded = isExpandedLayout(bp)
  const mobile = bp === 'mobile'
  const { width: windowWidth } = useWindowDimensions()
  const [citySlug, setCitySlug] = useState<string | null>(params.city ?? null)
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [category, setCategory] = useState<FeedCategory>(() =>
    isFeedCategory(params.category) ? params.category : 'All',
  )
  const [trendingEpoch, setTrendingEpoch] = useState(0)
  const [articles, setArticles] = useState<ArticleResponse[]>([])
  // Sectioned For-you partition from getFeedSections; null = flat list mode
  // (category drill-down, fallback, or cached entry without sections).
  const [sections, setSections] = useState<FeedSection[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [appendError, setAppendError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showContent, setShowContent] = useState(false)
  const [actionArticle, setActionArticle] = useState<ArticleResponse | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<StoryOptionsAnchor | null>(null)
  const cardHosts = useRef(new Map<string, View | null>())
  const [blockSourceName, setBlockSourceName] = useState<string | null>(null)
  const [blockCategoryName, setBlockCategoryName] = useState<string | null>(null)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set())
  const offsetRef = useRef(0)
  const loadingMoreLock = useRef(false)
  const loadGenRef = useRef(0)

  const refreshBookmarks = useCallback(async () => {
    const list = await getBookmarks()
    setBookmarkedIds(new Set(list.map((b) => b.id)))
  }, [])

  useFocusEffect(
    useCallback(() => {
      void refreshBookmarks()
    }, [refreshBookmarks]),
  )

  useEffect(() => {
    if (isFeedCategory(params.category) && params.category !== category) {
      setCategory(params.category)
    }
  }, [params.category, category])

  useEffect(() => {
    let cancelled = false
    async function resolveCity() {
      const fromParams = params.city
      if (fromParams) {
        if (!cancelled) {
          if (citySlug !== fromParams) {
            setCitySlug(fromParams)
          }
          await setStoredCitySlug(fromParams)
        }
        return
      }
      const stored = await getStoredCitySlug()
      if (!cancelled) {
        if (stored) {
          setCitySlug(stored)
        } else {
          router.replace('/city')
        }
      }
    }
    void resolveCity()
    return () => {
      cancelled = true
    }
  }, [citySlug, params.city, router])

  const cityList = useAsyncResource(
    () => apiClient.getCities(),
    [citySlug],
    {
      enabled: Boolean(citySlug),
      initialData: EMPTY_CITIES,
      onSuccess: (cities) => {
        setCityMeta(cities.find((c) => c.slug === citySlug) ?? null)
      },
      onError: () => setCityMeta(null),
    },
  )
  const cityMetaFromQuery = cityList.data.find((c) => c.slug === citySlug) ?? null

  useEffect(() => {
    setCityMeta(cityMetaFromQuery)
  }, [cityMetaFromQuery])

  const trendingResource = useAsyncResource(
    async () => {
      if (!citySlug) {
        return EMPTY_ARTICLES
      }
      const res = await apiClient.getTrendingArticles({
        city: citySlug,
        lang: preferredLanguage,
        limit: 5,
      })
      return res.items ?? EMPTY_ARTICLES
    },
    [citySlug, preferredLanguage, languageReady, trendingEpoch],
    {
      enabled: Boolean(citySlug && languageReady && !mobile),
      initialData: EMPTY_ARTICLES,
    },
  )

  const loadPage = useCallback(
    async (mode: 'replace' | 'append' | 'refresh') => {
      if (!citySlug) {
        return
      }

      const gen = mode === 'append' ? loadGenRef.current : ++loadGenRef.current
      const cacheKey = feedCacheKey({
        city: citySlug,
        category: category === 'All' ? undefined : category,
        lang: preferredLanguage,
      })
      let paintedFromCache = false

      if (mode === 'replace') {
        setError(null)
        setAppendError(false)
        offsetRef.current = 0

        const cached = await readFeedCache(cacheKey)
        if (gen !== loadGenRef.current) {
          return
        }
        if (cached && isFeedCacheFresh(cached)) {
          setSections(cached.sections ?? null)
          setArticles(cached.items)
          setTotal(cached.total)
          offsetRef.current = cached.items.length
          setError(null)
          setLoading(false)
          setRefreshing(false)
          requestAnimationFrame(() => setShowContent(true))
          return
        }
        if (cached) {
          // Stale-while-revalidate: paint last feed while we refresh in the background.
          paintedFromCache = true
          setSections(cached.sections ?? null)
          setArticles(cached.items)
          setTotal(cached.total)
          offsetRef.current = cached.items.length
          setLoading(false)
          requestAnimationFrame(() => setShowContent(true))
        } else {
          setSections(null)
          setLoading(true)
          setShowContent(false)
        }
      } else if (mode === 'refresh') {
        setRefreshing(true)
        setError(null)
        setAppendError(false)
        offsetRef.current = 0
      } else {
        if (loadingMoreLock.current) {
          return
        }
        loadingMoreLock.current = true
        setLoadingMore(true)
        setAppendError(false)
      }

      try {
        const offset = mode === 'append' ? offsetRef.current : 0
        const base = { city: citySlug, lang: preferredLanguage, offset, limit: PAGE_SIZE }
        let result
        let nextSections: FeedSection[] | null = null
        if (category === 'All') {
          if (mode === 'append') {
            try {
              // "For you" is personalized per anonymous device profile; explicit
              // category chips stay a predictable newest-first drill-down.
              const sessionId = await getPersonalizationId()
              result = await apiClient.getPersonalizedArticles({ ...base, sessionId })
            } catch {
              // Personalization is an enhancement — never block the feed on it.
              result = await apiClient.getArticles(base)
            }
          } else {
            try {
              // First screen is the sectioned For-you partition (Top stories,
              // one section per content-analyzed category, More stories).
              const sessionId = await getPersonalizationId()
              const sectionsRes = await apiClient.getFeedSections({
                city: citySlug,
                sessionId,
                lang: preferredLanguage,
              })
              const list = sectionsRes.sections ?? []
              nextSections = list
              result = {
                items: list.flatMap((section) => section.items ?? []),
                total: sectionsRes.total ?? 0,
                offset: 0,
                limit: PAGE_SIZE,
              }
            } catch {
              // Sections are an enhancement — never block the feed on them.
              result = await apiClient.getArticles(base)
            }
          }
        } else {
          result = await apiClient.getArticles({ ...base, category })
        }
        if (gen !== loadGenRef.current) {
          return
        }
        const items = result.items ?? []
        const nextTotal = result.total ?? items.length
        setTotal(nextTotal)
        setArticles((prev) => (mode === 'append' ? [...prev, ...items] : items))
        if (mode !== 'append') {
          setSections(nextSections)
        }
        offsetRef.current = offset + items.length
        setError(null)
        setAppendError(false)
        if (mode === 'replace' || mode === 'refresh') {
          void writeFeedCache(cacheKey, items, nextTotal, Date.now(), nextSections ?? undefined)
          setTrendingEpoch((n) => n + 1)
        }
        requestAnimationFrame(() => setShowContent(true))
      } catch (err) {
        if (gen !== loadGenRef.current) {
          return
        }
        if (mode === 'append') {
          setAppendError(true)
        } else {
          setError(err instanceof Error ? err.message : 'Could not load articles')
        }
        // Keep prior items on refresh/append/stale-cache failure; clear only when replace had nothing.
        if (mode === 'replace' && !paintedFromCache) {
          setArticles([])
          setSections(null)
        }
        if (mode === 'replace' || mode === 'refresh') {
          setShowContent(true)
        }
      } finally {
        if (gen === loadGenRef.current || mode === 'append') {
          setLoading(false)
          setRefreshing(false)
          setLoadingMore(false)
          loadingMoreLock.current = false
        }
      }
    },
    [citySlug, category, preferredLanguage],
  )

  useEffect(() => {
    if (citySlug && languageReady) {
      void loadPage('replace')
    }
  }, [citySlug, category, preferredLanguage, languageReady, loadPage])

  const cityTitle = cityMeta?.name ?? citySlug ?? 'Your city'
  const visibleArticles = useMemo(
    () => prefs.filterArticles(articles),
    [articles, prefs],
  )
  // Preference filters (hidden stories, blocked sources/categories) apply
  // inside each section; sections that filter to nothing are dropped.
  const visibleSections = useMemo(
    () =>
      sections
        ?.map((section) => ({
          ...section,
          items: prefs.filterArticles(section.items ?? []),
        }))
        .filter((section) => section.items.length > 0) ?? null,
    [sections, prefs],
  )
  const visibleTrending = useMemo(
    () => prefs.filterArticles(trendingResource.data),
    [trendingResource.data, prefs],
  )
  const trendingIds = useMemo(
    () => new Set(visibleTrending.map((a) => a.id).filter((id): id is number => id != null)),
    [visibleTrending],
  )

  const visibleCategories = useMemo(
    () =>
      FEED_CATEGORIES.filter(
        (c) => c === 'All' || !prefs.isCategoryBlocked(c),
      ) as FeedCategory[],
    [prefs],
  )

  // In sections mode the hero/carousel shows the "top" section; otherwise the
  // flat feed's first stories as before.
  const breaking = useMemo(() => {
    if (visibleSections) {
      return visibleSections.find((s) => s.key === 'top')?.items ?? []
    }
    return visibleArticles.slice(0, BREAKING_NEWS_COUNT)
  }, [visibleSections, visibleArticles])

  const feedSlices = useMemo(
    () =>
      buildExpandedFeedSlices(visibleArticles, visibleTrending, {
        category,
        desktop,
        categoryLabel: FEED_CATEGORY_LABELS[category],
      }),
    [visibleArticles, visibleTrending, category, desktop],
  )

  const recommendations = useMemo(
    () =>
      expanded
        ? feedSlices.forYou
        : visibleArticles
            .slice(BREAKING_NEWS_COUNT)
            .filter((a) => a.id == null || !trendingIds.has(a.id)),
    [expanded, feedSlices.forYou, visibleArticles, trendingIds],
  )
  // Sections already partition the whole ranked pool — no further pages.
  const hasMore = sections ? false : articles.length < total

  const listData: ListRow[] = useMemo(() => {
    if (mobile) {
      if (visibleSections) {
        const rows: ListRow[] = []
        for (const section of visibleSections) {
          rows.push({
            kind: 'section',
            key: `section-${section.key ?? 'general'}`,
            title: section.title ?? '',
          })
          for (const row of buildMobileFeedRows(section.items)) {
            if (row.kind !== 'empty') {
              rows.push(row)
            }
          }
        }
        if (rows.length === 0) {
          rows.push({ kind: 'empty', key: 'empty' })
        }
        return rows
      }
      return buildMobileFeedRows(visibleArticles)
    }
    if (expanded) {
      return buildExpandedFeedRows(feedSlices, loading)
    }
    const rows: ListRow[] = []
    if (breaking.length > 0) {
      rows.push({ kind: 'breaking', key: 'breaking' })
    }
    if (visibleTrending.length > 0) {
      rows.push({ kind: 'trending', key: 'trending' })
    }
    if (recommendations.length > 0) {
      rows.push({ kind: 'section', key: 'section', title: 'For you', showAction: true })
      for (let i = 0; i < recommendations.length; i += 2) {
        const left = recommendations[i]
        if (!left) {
          continue
        }
        const right = recommendations[i + 1]
        rows.push({
          kind: 'article-row',
          key: `row-${left.id ?? i}-${right?.id ?? 'end'}`,
          left,
          right,
          index: i,
        })
      }
    } else if (!loading && breaking.length === 0 && visibleTrending.length === 0) {
      rows.push({ kind: 'empty', key: 'empty' })
    }
    return rows
  }, [breaking, recommendations, loading, mobile, expanded, feedSlices, visibleArticles, visibleSections, visibleTrending])

  const openArticle = useCallback(
    (article: ArticleResponse) => {
      const params = articleRouteParams(article, {
        city: citySlug ?? undefined,
        feedCategory: category === 'All' ? undefined : category,
        lang: preferredLanguage,
      })
      if (!params) {
        return
      }
      router.push({
        pathname: '/article/[id]',
        params,
      })
    },
    [router, citySlug, category, preferredLanguage],
  )

  const goDiscover = useCallback(() => {
    router.push({
      pathname: '/(tabs)/search',
      params: {
        from: 'home',
        ...(category === 'All' ? {} : { category }),
      },
    })
  }, [router, category])

  const goSeeMore = useCallback(
    (article: ArticleResponse) => {
      const q = article.sourceName?.trim()
      router.push({
        pathname: '/(tabs)/search',
        params: {
          from: 'home',
          ...(q ? { q } : {}),
        },
      })
    },
    [router],
  )

  const openStoryActions = useCallback((article: ArticleResponse) => {
    setActionArticle(article)
    const key = article.id != null ? String(article.id) : ''
    captureMoreButtonAnchor(cardHosts.current.get(key) ?? null, setPopoverAnchor)
  }, [])

  const closeStoryActions = useCallback(() => {
    setActionArticle(null)
    setPopoverAnchor(null)
  }, [])

  const bindCardHost = useCallback(
    (article: ArticleResponse, fallbackKey: string) =>
      expanded
        ? (node: View | null) => {
            const key = article.id != null ? String(article.id) : fallbackKey
            if (node) {
              cardHosts.current.set(key, node)
            } else {
              cardHosts.current.delete(key)
            }
          }
        : undefined,
    [expanded],
  )

  const renderArticleCard = (
    article: ArticleResponse,
    index: number,
    padStyle: StyleProp<ViewStyle>,
  ) => (
    <ArticleCardSlot
      desktop={expanded}
      padStyle={padStyle}
      hostRef={bindCardHost(article, String(article.id ?? index))}
    >
      <CompactArticleCard
        article={article}
        index={index}
        density={mobile ? 'default' : 'compact'}
        onPress={openArticle}
        onLongPress={expanded ? openStoryActions : setActionArticle}
        onMorePress={expanded ? openStoryActions : setActionArticle}
        onSeeMorePress={goSeeMore}
        saved={article.id != null && bookmarkedIds.has(article.id)}
      />
    </ArticleCardSlot>
  )

  const storySections: BottomSheetSection[] = useMemo(() => {
    if (!actionArticle) {
      return []
    }
    const cat = actionArticle.category ?? ''
    const source = actionArticle.sourceName ?? 'this source'
    const saved =
      actionArticle.id != null && bookmarkedIds.has(actionArticle.id)
    return buildStorySections({
      article: actionArticle,
      saved,
      onSave: () => {
        void (async () => {
          if (actionArticle.id == null) {
            return
          }
          if (saved) {
            await removeBookmark(actionArticle.id)
          } else {
            const snap = articleToBookmark(actionArticle, citySlug ?? undefined)
            if (snap) {
              await addBookmark(snap)
            }
          }
          await refreshBookmarks()
        })()
      },
      onShare: () => {
        void shareArticle({
          headline: actionArticle.headline,
          summary: actionArticle.summary,
          sourceUrl: actionArticle.sourceUrl,
        })
      },
      onOpenSource: () => {
        void openArticleSource(actionArticle.sourceUrl, {
          articleId: actionArticle.id,
          publisher: actionArticle.sourceName,
        })
      },
      onLike: () => prefs.showMoreLikeThis(cat),
      onDislike: () => prefs.showLessLikeThis(cat),
      onHide: () => {
        if (actionArticle.id != null) {
          prefs.hideStory(actionArticle.id)
        }
      },
      onBlockSource: () => setBlockSourceName(source),
      onFewerAboutTopic: cat
        ? () => setBlockCategoryName(cat)
        : undefined,
    })
  }, [actionArticle, bookmarkedIds, citySlug, prefs, refreshBookmarks])

  const onEndReached = () => {
    if (!loading && !refreshing && !loadingMore && hasMore) {
      void loadPage('append')
    }
  }

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 220 }}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Box flex={1} bg={colors.background}>
        {expanded ? (
          <ExpandedTopBar
            cityTitle={cityTitle}
            onCityPress={() => router.push('/city')}
            readingLanguage={preferredLanguage}
            onSelectLanguage={setPreferredLanguage}
          />
        ) : (
          <HomeTopBar
            cityTitle={cityTitle}
            onCityPress={() => router.push('/city')}
            onSearchPress={goDiscover}
            readingLanguage={preferredLanguage}
            onSelectLanguage={setPreferredLanguage}
          />
        )}
        {Platform.OS === 'web' ? <AddToHomeBanner /> : null}
        <NotificationOptInBanner />
        {expanded ? (
          <CategoryNavBar
            selected={category}
            onSelect={setCategory}
            categories={visibleCategories}
            onLongPressCategory={(chip) => {
              if (chip !== 'All') {
                setBlockCategoryName(chip)
              }
            }}
          />
        ) : (
          <CategoryChipRow
            selected={category}
            onSelect={setCategory}
            categories={visibleCategories}
            onLongPressCategory={(chip) => {
              if (chip !== 'All') {
                setBlockCategoryName(chip)
              }
            }}
          />
        )}
        {expanded ? (
          <BriefingHeader
            title={feedSlices.showBriefing ? undefined : feedSlices.pageTitle}
            subtitle={
              feedSlices.showBriefing
                ? undefined
                : 'Stories in this section'
            }
          />
        ) : null}

        {(loading && !showContent) || !prefs.ready ? (
          <Box pt="$2" px="$4">
            {!mobile ? <Box h={media.heroHeight} bg={colors.skeleton} borderRadius={radius.lg} mb="$4" /> : null}
            {[0, 1, 2].map((i) => (
              <CompactArticleCardSkeleton
                key={i}
                index={i}
                density={mobile ? 'default' : 'compact'}
              />
            ))}
          </Box>
        ) : null}

        {showContent && prefs.ready ? (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 220 }}
            style={{ flex: 1 }}
          >
            {error && articles.length === 0 ? (
              <View
                testID={expanded ? 'error-column' : undefined}
                style={expanded ? styles.errorColumn : undefined}
              >
                <ErrorState
                  title="Something went wrong"
                  message={error}
                  onRetry={() => void loadPage('replace')}
                  retryLabel="Try again"
                />
              </View>
            ) : (
            <View style={desktop ? styles.feedRow : styles.feedSingle}>
            <FlatList
              style={styles.listFlex}
              data={listData}
              keyExtractor={(item) => item.key}
              contentContainerStyle={[styles.listContent, { paddingBottom: tabClearance }]}
                renderItem={({ item }) => {
                  if (item.kind === 'breaking') {
                    return (
                      <View style={styles.sectionBlock}>
                        <SectionHeader
                          title="Top stories"
                          actionLabel="View all"
                          onAction={goDiscover}
                          expanded={expanded}
                        />
                        {expanded ? (
                          <TopStoriesCluster
                            articles={feedSlices.topStories}
                            onPress={openArticle}
                            onSeeAll={goDiscover}
                          />
                        ) : (
                          <BreakingNewsCarousel
                            articles={breaking}
                            onPress={openArticle}
                            onMorePress={setActionArticle}
                          />
                        )}
                      </View>
                    )
                  }
                  if (item.kind === 'picks-section') {
                    return (
                      <View style={styles.sectionBlock}>
                        <SectionHeader
                          title="Picks for you"
                          subtitle="Recommended based on your interests"
                          expanded={expanded}
                        />
                      </View>
                    )
                  }
                  if (item.kind === 'for-you-section') {
                    return (
                      <View style={styles.sectionPad}>
                        <SectionHeader
                          title="For you"
                          actionLabel="View all"
                          onAction={goDiscover}
                          expanded={expanded}
                        />
                      </View>
                    )
                  }
                  if (item.kind === 'trending') {
                    return (
                      <View style={styles.sectionBlock}>
                        <SectionHeader title="Picks for you" />
                        {visibleTrending.map((article, index) => (
                          <View key={String(article.id ?? index)} style={styles.trendingRow}>
                            <Text
                              fontSize={typography.meta.fontSize}
                              lineHeight={typography.meta.lineHeight}
                              fontWeight="$semibold"
                              color={colors.textMuted}
                              style={styles.trendingRank}
                              accessibilityLabel={`Rank ${index + 1}`}
                            >
                              {index + 1}
                            </Text>
                            <View style={styles.trendingCard}>
                              {renderArticleCard(article, index, styles.trendingCardPad)}
                            </View>
                          </View>
                        ))}
                      </View>
                    )
                  }
                  if (item.kind === 'section') {
                    return (
                      <View style={styles.sectionPad}>
                        <SectionHeader
                          title={item.title}
                          actionLabel={item.showAction ? 'View all' : undefined}
                          onAction={item.showAction ? goDiscover : undefined}
                          expanded={expanded}
                        />
                      </View>
                    )
                  }
                  if (item.kind === 'empty') {
                    const filteredAway =
                      articles.length > 0 && visibleArticles.length === 0
                    const title = filteredAway
                      ? 'Stories hidden by your filters'
                      : 'No stories yet'
                    const message = filteredAway
                      ? 'Unblock sources or categories in Profile, then pull to refresh.'
                      : `We do not have articles for ${cityTitle}${
                          category !== 'All' ? ` in ${category}` : ''
                        } right now. Pull down to refresh, or try another city.`
                    const primaryLabel = filteredAway
                      ? 'Open Profile'
                      : 'Change city'
                    const secondaryLabel = filteredAway
                      ? 'Change city'
                      : undefined
                    return (
                      <EmptyState
                        title={title}
                        message={message}
                        primaryLabel={primaryLabel}
                        onPrimary={
                          filteredAway
                            ? () => router.push('/(tabs)/profile')
                            : () => router.push('/city')
                        }
                        primaryAccessibilityLabel={primaryLabel}
                        secondaryLabel={secondaryLabel}
                        onSecondary={
                          filteredAway ? () => router.push('/city') : undefined
                        }
                        secondaryAccessibilityLabel={secondaryLabel}
                      />
                    )
                  }
                  if (item.kind === 'article-row') {
                    return (
                      <View testID="article-row" style={styles.articleRow}>
                        {renderArticleCard(item.left, item.index, styles.articleCell)}
                        {item.right ? (
                          renderArticleCard(item.right, item.index + 1, styles.articleCell)
                        ) : (
                          <View style={styles.articleCell} />
                        )}
                      </View>
                    )
                  }
                  if (item.kind === 'featured') {
                    return (
                      <View style={styles.featuredPad}>
                        <BreakingHeroCard
                          article={item.article}
                          index={item.index}
                          width={windowWidth - space.screen * 2}
                          onPress={openArticle}
                          onMorePress={setActionArticle}
                        />
                      </View>
                    )
                  }
                  if (item.kind === 'related') {
                    return (
                      <RelatedStoriesStrip
                        articles={item.articles}
                        onPress={openArticle}
                        onMorePress={setActionArticle}
                      />
                    )
                  }
                  return renderArticleCard(item.article, item.index, styles.cardPad)
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => void loadPage('refresh')}
                    tintColor={colors.accent}
                    colors={[colors.accent]}
                    progressBackgroundColor={
                      Platform.OS === 'android' ? colors.surface : undefined
                    }
                    title=""
                  />
                }
                onEndReached={onEndReached}
                onEndReachedThreshold={0.4}
                ListFooterComponent={
                  loadingMore ? (
                    <Box px="$4" py="$2">
                      <CompactArticleCardSkeleton index={0} density={mobile ? 'default' : 'compact'} />
                    </Box>
                  ) : appendError ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Retry loading more articles"
                      onPress={() => void loadPage('append')}
                      style={{ paddingVertical: space.md, paddingHorizontal: space.lg }}
                    >
                      <Text
                        color={colors.accent}
                        fontSize={typography.meta.fontSize}
                        textAlign="center"
                      >
                        Couldn’t load more · Tap to retry
                      </Text>
                    </Pressable>
                  ) : !hasMore && articles.length > 0 ? (
                    <Text
                      accessibilityRole="text"
                      color={colors.textMuted}
                      fontSize={typography.meta.fontSize}
                      textAlign="center"
                      py="$4"
                    >
                      You’re caught up
                    </Text>
                  ) : null
                }
              />
              {feedSlices.showLocalRail ? (
                <LocalNewsRail
                  articles={feedSlices.localRail}
                  onPress={openArticle}
                  onFilterPress={() => setCategory('Local')}
                />
              ) : null}
            </View>
            )}
          </MotiView>
        ) : null}
      </Box>

      {expanded ? (
        <StoryOptionsPopover
          visible={actionArticle != null}
          anchor={popoverAnchor}
          sections={storySections}
          onClose={closeStoryActions}
        />
      ) : (
        <BottomSheet
          visible={actionArticle != null}
          sections={storySections}
          onClose={() => setActionArticle(null)}
        />
      )}

      <ConfirmModal
        visible={blockSourceName != null}
        title="Block this source?"
        message={`If you block ${blockSourceName ?? 'this source'}, you won't see stories from them again. You can change this later.`}
        confirmLabel="Block source"
        onCancel={() => setBlockSourceName(null)}
        onConfirm={() => {
          if (blockSourceName) {
            prefs.blockSource(blockSourceName)
          }
          setBlockSourceName(null)
        }}
      />

      <ConfirmModal
        visible={blockCategoryName != null}
        title="Block this category?"
        message={`If you block ${blockCategoryName ?? 'this category'}, you won't see stories in it again. You can change this later.`}
        confirmLabel="Block category"
        onCancel={() => setBlockCategoryName(null)}
        onConfirm={() => {
          if (blockCategoryName) {
            prefs.blockCategory(blockCategoryName)
            if (category === blockCategoryName) {
              setCategory('All')
            }
          }
          setBlockCategoryName(null)
        }}
      />
    </MotiView>
  )
}

function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  expanded = false,
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  expanded?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.sectionHeaderWrap}>
    <HStack
      px="$4"
      mt={expanded ? '$1' : '$3'}
      mb={subtitle ? '$1' : '$2'}
      alignItems="center"
      justifyContent="space-between"
      minHeight={36}
    >
      <Text
        fontSize={expanded ? typography.headlineSm.fontSize : 18}
        lineHeight={expanded ? typography.headlineSm.lineHeight : 24}
        fontWeight="$semibold"
        letterSpacing={-0.2}
        color={colors.text}
        flex={1}
      >
        {title}
        {expanded ? ' ›' : ''}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={({ pressed }) => [
            styles.sectionAction,
            pressed ? { opacity: 0.7 } : null,
          ]}
        >
          <Text
            fontSize={typography.label.fontSize}
            lineHeight={typography.label.lineHeight}
            fontWeight="$semibold"
            color={colors.accent}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </HStack>
    {subtitle ? (
      <Text
        px="$4"
        mb="$2"
        fontSize={typography.meta.fontSize}
        lineHeight={typography.meta.lineHeight}
        color={colors.textMuted}
      >
        {subtitle}
      </Text>
    ) : null}
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
  listFlex: {
    flex: 1,
  },
  feedRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  feedSingle: {
    flex: 1,
  },
  listContent: {
    paddingTop: space.xs,
    flexGrow: 1,
  },
  sectionBlock: {
    marginBottom: space.md,
  },
  sectionHeaderWrap: {
    marginBottom: space.xs,
  },
  sectionPad: {
    marginBottom: space.xs,
  },
  cardPad: {
    paddingHorizontal: space.screen,
  },
  featuredPad: {
    paddingHorizontal: space.screen,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: space.screen,
    gap: space.sm,
  },
  articleCell: {
    flex: 1,
    minWidth: 0,
  },
  cardHover: {
    padding: 4,
    margin: -4,
    borderRadius: radius.md,
    backgroundColor: c.accentSoft,
  },
  errorColumn: {
    flex: 1,
    width: '100%',
    maxWidth: ERROR_COLUMN_MAX,
    alignSelf: 'center',
  },
  emptyBlock: {
    paddingHorizontal: space.screen,
    paddingVertical: space.xl,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: space.screen,
  },
  trendingRank: {
    width: 22,
    marginTop: space.md,
    textAlign: 'center',
  },
  trendingCard: {
    flex: 1,
    minWidth: 0,
  },
  trendingCardPad: {
    paddingRight: space.screen,
    paddingLeft: space.xs,
  },
  sectionAction: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  })
}
