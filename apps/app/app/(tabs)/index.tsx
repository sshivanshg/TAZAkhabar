import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Box, HStack, Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { ArticleResponse, CityResponse } from '@tazakhabar/shared-types'
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
import {
  DesktopHeroRow,
  desktopHeroVisibleCount,
  estimateDesktopRailWidth,
} from '../../src/components/desktop/DesktopHeroRow'
import {
  StoryOptionsPopover,
  captureMoreButtonAnchor,
  type StoryOptionsAnchor,
} from '../../src/components/desktop/StoryOptionsPopover'
import { DesktopTopBar } from '../../src/components/desktop/DesktopTopBar'
import { HomeTopBar } from '../../src/components/HomeTopBar'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { ErrorState } from '../../src/components/ui/ErrorState'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import { useLanguagePreference } from '../../src/preferences/LanguagePreferenceContext'
import {
  articleToBookmark,
  getBookmarks,
  removeBookmark,
  addBookmark,
} from '../../src/storage/bookmarks'
import { getStoredCitySlug, setStoredCitySlug } from '../../src/storage/cityPreference'
import {
  BREAKING_NEWS_COUNT,
  FEED_CATEGORIES,
  type FeedCategory,
  PAGE_SIZE,
  colors,
  ERROR_COLUMN_MAX,
  isFeedCategory,
  media,
  radius,
  space,
  typography,
} from '../../src/theme/tokens'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isDesktopLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { articleRouteParams } from '../../src/utils/articleRouteParams'
import { buildMobileFeedRows } from '../../src/utils/feedLayout'
import { openArticleSource } from '../../src/utils/openArticleSource'
import { shareArticle } from '../../src/utils/shareArticle'

type ListRow =
  | { kind: 'breaking'; key: 'breaking' }
  | { kind: 'trending'; key: 'trending' }
  | { kind: 'section'; key: 'section' }
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
  const tabClearance = useTabBarClearance()
  const bp = useBreakpoint()
  const desktop = isDesktopLayout(bp)
  const tablet = bp === 'tablet'
  const mobile = bp === 'mobile'
  const { width: windowWidth } = useWindowDimensions()
  const [citySlug, setCitySlug] = useState<string | null>(params.city ?? null)
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [category, setCategory] = useState<FeedCategory>(() =>
    isFeedCategory(params.category) ? params.category : 'All',
  )
  const [trendingEpoch, setTrendingEpoch] = useState(0)
  const [articles, setArticles] = useState<ArticleResponse[]>([])
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

      if (mode === 'replace') {
        setLoading(true)
        setShowContent(false)
        setError(null)
        setAppendError(false)
        offsetRef.current = 0
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
        const result = await apiClient.getArticles({
          city: citySlug,
          category: category === 'All' ? undefined : category,
          lang: preferredLanguage,
          offset,
          limit: PAGE_SIZE,
        })
        if (gen !== loadGenRef.current) {
          return
        }
        const items = result.items ?? []
        setTotal(result.total ?? items.length)
        setArticles((prev) => (mode === 'append' ? [...prev, ...items] : items))
        offsetRef.current = offset + items.length
        setError(null)
        setAppendError(false)
        if (mode === 'replace' || mode === 'refresh') {
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
        // Keep prior items on refresh/append failure; only clear on initial replace.
        if (mode === 'replace') {
          setArticles([])
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

  const breaking = useMemo(
    () => visibleArticles.slice(0, BREAKING_NEWS_COUNT),
    [visibleArticles],
  )
  const listStart = desktop
    ? desktopHeroVisibleCount(estimateDesktopRailWidth(windowWidth))
    : BREAKING_NEWS_COUNT
  const recommendations = useMemo(
    () =>
      visibleArticles
        .slice(listStart)
        .filter((a) => a.id == null || !trendingIds.has(a.id)),
    [visibleArticles, listStart, trendingIds],
  )
  const hasMore = articles.length < total

  const listData: ListRow[] = useMemo(() => {
    if (mobile) {
      return buildMobileFeedRows(visibleArticles)
    }
    const rows: ListRow[] = []
    if (breaking.length > 0) {
      rows.push({ kind: 'breaking', key: 'breaking' })
    }
    if (visibleTrending.length > 0) {
      rows.push({ kind: 'trending', key: 'trending' })
    }
    if (recommendations.length > 0) {
      rows.push({ kind: 'section', key: 'section' })
      if (tablet) {
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
      } else {
        for (const [index, article] of recommendations.entries()) {
          rows.push({
            kind: 'article',
            key: String(article.id),
            article,
            index,
          })
        }
      }
    } else if (!loading && breaking.length === 0 && visibleTrending.length === 0) {
      rows.push({ kind: 'empty', key: 'empty' })
    }
    return rows
  }, [breaking, recommendations, loading, mobile, tablet, visibleArticles, visibleTrending])

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
      desktop
        ? (node: View | null) => {
            const key = article.id != null ? String(article.id) : fallbackKey
            if (node) {
              cardHosts.current.set(key, node)
            } else {
              cardHosts.current.delete(key)
            }
          }
        : undefined,
    [desktop],
  )

  const renderArticleCard = (
    article: ArticleResponse,
    index: number,
    padStyle: StyleProp<ViewStyle>,
  ) => (
    <ArticleCardSlot
      desktop={desktop}
      padStyle={padStyle}
      hostRef={bindCardHost(article, String(article.id ?? index))}
    >
      <CompactArticleCard
        article={article}
        index={index}
        density={mobile ? 'default' : 'compact'}
        onPress={openArticle}
        onLongPress={desktop ? openStoryActions : setActionArticle}
        onMorePress={desktop ? openStoryActions : setActionArticle}
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
        {desktop ? (
          <DesktopTopBar
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
                testID={desktop ? 'error-column' : undefined}
                style={desktop ? styles.errorColumn : undefined}
              >
                <ErrorState
                  title="Something went wrong"
                  message={error}
                  onRetry={() => void loadPage('replace')}
                  retryLabel="Try again"
                />
              </View>
            ) : (
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
                        />
                        {desktop ? (
                          <DesktopHeroRow articles={breaking} onPress={openArticle} />
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
                          title="For you"
                          actionLabel="View all"
                          onAction={goDiscover}
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
            )}
          </MotiView>
        ) : null}
      </Box>

      {desktop ? (
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
  actionLabel,
  onAction,
}: {
  title: string
  actionLabel?: string
  onAction?: () => void
}) {
  // Soft accent section label (Google News “Top stories” rhythm).
  return (
    <HStack
      px="$4"
      mt="$3"
      mb="$2"
      alignItems="center"
      justifyContent="space-between"
      minHeight={36}
    >
      <Text
        fontSize={18}
        lineHeight={24}
        fontWeight="$semibold"
        letterSpacing={-0.2}
        color={colors.accent}
        flex={1}
      >
        {title}
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
  )
}

const styles = StyleSheet.create({
  listFlex: {
    flex: 1,
  },
  listContent: {
    paddingTop: space.xs,
    flexGrow: 1,
  },
  sectionBlock: {
    marginBottom: space.md,
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
    backgroundColor: colors.accentSoft,
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
