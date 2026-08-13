import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Box, HStack, Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import {
  Bookmark,
  EyeOff,
  MessageCircle,
  Ban,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react-native'
import type { ArticleResponse, CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../../src/api/client'
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
import { ConfirmModal } from '../../src/components/ConfirmModal'
import { AddToHomeBanner } from '../../src/components/AddToHomeBanner'
import { DesktopHeroRow } from '../../src/components/desktop/DesktopHeroRow'
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
import { PrimaryButton } from '../../src/components/ui/PrimaryButton'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
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
  isFeedCategory,
  media,
  radius,
  space,
  typography,
} from '../../src/theme/tokens'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isDesktopLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { articleRouteParams } from '../../src/utils/articleRouteParams'
import { shareArticleToWhatsApp } from '../../src/utils/shareToWhatsApp'

type ListRow =
  | { kind: 'breaking'; key: 'breaking' }
  | { kind: 'section'; key: 'section' }
  | { kind: 'empty'; key: 'empty' }
  | { kind: 'article'; key: string; article: ArticleResponse; index: number }

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
  const tabClearance = useTabBarClearance()
  const bp = useBreakpoint()
  const desktop = isDesktopLayout(bp)
  const [citySlug, setCitySlug] = useState<string | null>(params.city ?? null)
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [category, setCategory] = useState<FeedCategory>(() =>
    isFeedCategory(params.category) ? params.category : 'All',
  )
  const [articles, setArticles] = useState<ArticleResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
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
          setCitySlug(fromParams)
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
  }, [params.city, router])

  useEffect(() => {
    if (!citySlug) {
      return
    }
    let cancelled = false
    apiClient
      .getCities()
      .then((cities) => {
        if (cancelled) {
          return
        }
        const match = cities.find((c) => c.slug === citySlug) ?? null
        setCityMeta(match)
      })
      .catch(() => {
        if (!cancelled) {
          setCityMeta(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [citySlug])

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
        offsetRef.current = 0
      } else if (mode === 'refresh') {
        setRefreshing(true)
        setError(null)
        offsetRef.current = 0
      } else {
        if (loadingMoreLock.current) {
          return
        }
        loadingMoreLock.current = true
        setLoadingMore(true)
      }

      try {
        const offset = mode === 'append' ? offsetRef.current : 0
        const result = await apiClient.getArticles({
          city: citySlug,
          category: category === 'All' ? undefined : category,
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
        requestAnimationFrame(() => setShowContent(true))
      } catch (err) {
        if (gen !== loadGenRef.current) {
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load articles')
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
    [citySlug, category],
  )

  useEffect(() => {
    if (citySlug) {
      void loadPage('replace')
    }
  }, [citySlug, category, loadPage])

  const cityTitle = cityMeta?.name ?? citySlug ?? 'Your city'
  const visibleArticles = useMemo(
    () => prefs.filterArticles(articles),
    [articles, prefs],
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
  const recommendations = useMemo(
    () => visibleArticles.slice(BREAKING_NEWS_COUNT),
    [visibleArticles],
  )
  const hasMore = articles.length < total

  const listData: ListRow[] = useMemo(() => {
    const rows: ListRow[] = []
    if (breaking.length > 0) {
      rows.push({ kind: 'breaking', key: 'breaking' })
    }
    if (recommendations.length > 0) {
      rows.push({ kind: 'section', key: 'section' })
      for (const [index, article] of recommendations.entries()) {
        rows.push({
          kind: 'article',
          key: String(article.id),
          article,
          index,
        })
      }
    } else if (!loading && breaking.length === 0) {
      rows.push({ kind: 'empty', key: 'empty' })
    }
    return rows
  }, [breaking, recommendations, loading])

  const openArticle = useCallback(
    (article: ArticleResponse) => {
      const params = articleRouteParams(article)
      if (!params) {
        return
      }
      router.push({
        pathname: '/article/[id]',
        params,
      })
    },
    [router],
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

  const shareLabel = Platform.OS === 'web' ? 'Share on WhatsApp' : 'Share'

  const openStoryActions = useCallback((article: ArticleResponse) => {
    setActionArticle(article)
    const key = article.id != null ? String(article.id) : ''
    captureMoreButtonAnchor(cardHosts.current.get(key) ?? null, setPopoverAnchor)
  }, [])

  const closeStoryActions = useCallback(() => {
    setActionArticle(null)
    setPopoverAnchor(null)
  }, [])

  const storySections: BottomSheetSection[] = useMemo(() => {
    if (!actionArticle) {
      return []
    }
    const cat = actionArticle.category ?? ''
    const source = actionArticle.sourceName ?? 'this source'
    const saved =
      actionArticle.id != null && bookmarkedIds.has(actionArticle.id)
    return [
      {
        key: 'share',
        items: [
          {
            key: 'share',
            label: shareLabel,
            Icon: MessageCircle,
            onPress: () => {
              void shareArticleToWhatsApp({
                headline: actionArticle.headline,
                summary: actionArticle.summary,
                sourceUrl: actionArticle.sourceUrl,
              })
            },
          },
        ],
      },
      {
        key: 'save',
        items: [
          {
            key: 'bookmark',
            label: saved ? 'Remove bookmark' : 'Save',
            Icon: Bookmark,
            onPress: () => {
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
          },
          {
            key: 'more',
            label: 'Show more like this',
            Icon: ThumbsUp,
            onPress: () => prefs.showMoreLikeThis(cat),
          },
          {
            key: 'less',
            label: 'Show less like this',
            Icon: ThumbsDown,
            onPress: () => prefs.showLessLikeThis(cat),
          },
          {
            key: 'hide',
            label: 'Hide this story',
            Icon: EyeOff,
            onPress: () => {
              if (actionArticle.id != null) {
                prefs.hideStory(actionArticle.id)
              }
            },
          },
        ],
      },
      {
        key: 'danger',
        items: [
          {
            key: 'block',
            label: 'Block this source',
            Icon: Ban,
            destructive: true,
            onPress: () => setBlockSourceName(source),
          },
        ],
      },
    ]
  }, [actionArticle, bookmarkedIds, citySlug, prefs, refreshBookmarks, shareLabel])

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
          />
        ) : (
          <HomeTopBar
            cityTitle={cityTitle}
            onCityPress={() => router.push('/city')}
            onSearchPress={goDiscover}
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
            <Box h={media.heroHeight} bg={colors.skeleton} borderRadius={radius.lg} mb="$4" />
            {[0, 1, 2].map((i) => (
              <CompactArticleCardSkeleton key={i} index={i} />
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
              <ErrorState
                title="Something went wrong"
                message={error}
                onRetry={() => void loadPage('replace')}
                retryLabel="Try again"
              />
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
                          title="Breaking News"
                          actionLabel="View all"
                          onAction={goDiscover}
                        />
                        {desktop ? (
                          <DesktopHeroRow articles={breaking} onPress={openArticle} />
                        ) : (
                          <BreakingNewsCarousel articles={breaking} onPress={openArticle} />
                        )}
                      </View>
                    )
                  }
                  if (item.kind === 'section') {
                    return (
                      <View style={styles.sectionPad}>
                        <SectionHeader
                          title="Latest for you"
                          actionLabel="View all"
                          onAction={goDiscover}
                        />
                      </View>
                    )
                  }
                  if (item.kind === 'empty') {
                    const filteredAway =
                      articles.length > 0 && visibleArticles.length === 0
                    return (
                      <View style={styles.emptyBlock}>
                        <Text
                          fontSize={typography.headlineSm.fontSize}
                          lineHeight={typography.headlineSm.lineHeight}
                          fontWeight="$semibold"
                          color={colors.text}
                        >
                          {filteredAway ? 'Stories hidden by your filters' : 'No stories yet'}
                        </Text>
                        <Text
                          fontSize={typography.summary.fontSize}
                          lineHeight={typography.summary.lineHeight}
                          color={colors.textSecondary}
                          mt="$2"
                          mb="$4"
                        >
                          {filteredAway
                            ? 'Unblock sources or categories in Profile, or pull down to refresh.'
                            : `We do not have articles for ${cityTitle}${
                                category !== 'All' ? ` in ${category}` : ''
                              } right now. Pull down to refresh, or browse Discover.`}
                        </Text>
                        <PrimaryButton
                          label="Browse Discover"
                          onPress={goDiscover}
                          accessibilityLabel="Browse Discover"
                        />
                      </View>
                    )
                  }
                  return (
                    <View
                      style={styles.cardPad}
                      collapsable={desktop ? false : undefined}
                      ref={
                        desktop
                          ? (node) => {
                              const key =
                                item.article.id != null
                                  ? String(item.article.id)
                                  : item.key
                              if (node) {
                                cardHosts.current.set(key, node)
                              } else {
                                cardHosts.current.delete(key)
                              }
                            }
                          : undefined
                      }
                    >
                      <CompactArticleCard
                        article={item.article}
                        index={item.index}
                        onPress={openArticle}
                        onLongPress={desktop ? openStoryActions : setActionArticle}
                        onMorePress={desktop ? openStoryActions : setActionArticle}
                      />
                    </View>
                  )
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
                      <CompactArticleCardSkeleton index={0} />
                    </Box>
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
          title="Story options"
          sections={storySections}
          onClose={closeStoryActions}
        />
      ) : (
        <BottomSheet
          visible={actionArticle != null}
          title="Story options"
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
  actionLabel: string
  onAction: () => void
}) {
  return (
    <HStack
      px="$4"
      mb="$3"
      alignItems="center"
      justifyContent="space-between"
      minHeight={44}
    >
      <Text
        fontSize={typography.section.fontSize}
        lineHeight={typography.section.lineHeight}
        fontWeight="$bold"
        color={colors.text}
        flex={1}
      >
        {title}
      </Text>
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
        <Text fontSize={15} lineHeight={20} fontWeight="$semibold" color={colors.accent}>
          {actionLabel}
        </Text>
      </Pressable>
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
  emptyBlock: {
    paddingHorizontal: space.screen,
    paddingVertical: space.xl,
  },
  sectionAction: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
