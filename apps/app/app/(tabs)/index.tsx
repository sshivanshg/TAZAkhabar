import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native'
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
import { DateStrip } from '../../src/components/DateStrip'
import {
  CompactArticleCard,
  CompactArticleCardSkeleton,
} from '../../src/components/CompactArticleCard'
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
import { PrimaryButton } from '../../src/components/ui/PrimaryButton'
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
import { todayCityIso } from '../../src/utils/cityCalendar'
import { shareArticleToWhatsApp } from '../../src/utils/shareToWhatsApp'

type ListRow =
  | { kind: 'breaking'; key: 'breaking' }
  | { kind: 'section'; key: 'section' }
  | { kind: 'empty'; key: 'empty' }
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
  const { preferredLanguage, ready: languageReady } = useLanguagePreference()
  const tabClearance = useTabBarClearance()
  const bp = useBreakpoint()
  const desktop = isDesktopLayout(bp)
  const tablet = bp === 'tablet'
  const { width: windowWidth } = useWindowDimensions()
  const [citySlug, setCitySlug] = useState<string | null>(params.city ?? null)
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [category, setCategory] = useState<FeedCategory>(() =>
    isFeedCategory(params.category) ? params.category : 'All',
  )
  /** Session-only edition date (city-local YYYY-MM-DD). Fresh launch always starts on today. */
  const [selectedDate, setSelectedDate] = useState(() => todayCityIso())
  const [availableDates, setAvailableDates] = useState<string[]>([])
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

  useEffect(() => {
    if (!citySlug) {
      return
    }
    let cancelled = false
    apiClient
      .getArticleDates({
        city: citySlug,
        category: category === 'All' ? undefined : category,
      })
      .then((res) => {
        if (!cancelled) {
          setAvailableDates(res.dates ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableDates([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [citySlug, category])

  const viewingToday = selectedDate === todayCityIso()

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
        const isToday = selectedDate === todayCityIso()
        const result = await apiClient.getArticles({
          city: citySlug,
          category: category === 'All' ? undefined : category,
          lang: preferredLanguage,
          // Past editions filter by city-local day; "Today" keeps newest-first default.
          date: isToday ? undefined : selectedDate,
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
    [citySlug, category, preferredLanguage, selectedDate],
  )

  useEffect(() => {
    if (citySlug && languageReady) {
      void loadPage('replace')
    }
  }, [citySlug, category, preferredLanguage, languageReady, selectedDate, loadPage])

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
    () => (viewingToday ? visibleArticles.slice(0, BREAKING_NEWS_COUNT) : []),
    [visibleArticles, viewingToday],
  )
  const listStart = viewingToday
    ? desktop
      ? desktopHeroVisibleCount(estimateDesktopRailWidth(windowWidth))
      : BREAKING_NEWS_COUNT
    : 0
  const recommendations = useMemo(
    () => visibleArticles.slice(listStart),
    [visibleArticles, listStart],
  )
  const hasMore = articles.length < total

  const listData: ListRow[] = useMemo(() => {
    const rows: ListRow[] = []
    if (breaking.length > 0) {
      rows.push({ kind: 'breaking', key: 'breaking' })
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
    } else if (!loading && breaking.length === 0) {
      rows.push({ kind: 'empty', key: 'empty' })
    }
    return rows
  }, [breaking, recommendations, loading, tablet])

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
        density={desktop ? 'compact' : 'default'}
        onPress={openArticle}
        onLongPress={desktop ? openStoryActions : setActionArticle}
        onMorePress={desktop ? openStoryActions : setActionArticle}
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
        <DateStrip
          selectedDate={selectedDate}
          availableDates={availableDates}
          onSelectDate={setSelectedDate}
        />

        {(loading && !showContent) || !prefs.ready ? (
          <Box pt="$2" px="$4">
            <Box h={media.heroHeight} bg={colors.skeleton} borderRadius={radius.lg} mb="$4" />
            {[0, 1, 2].map((i) => (
              <CompactArticleCardSkeleton
                key={i}
                index={i}
                density={desktop ? 'compact' : 'default'}
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
                          title={viewingToday ? 'Latest for you' : 'Stories that day'}
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
                          {filteredAway
                            ? 'Stories hidden by your filters'
                            : viewingToday
                              ? 'No stories yet'
                              : `No stories for this date in ${cityTitle}`}
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
                            : viewingToday
                              ? `We do not have articles for ${cityTitle}${
                                  category !== 'All' ? ` in ${category}` : ''
                                } right now. Pull down to refresh, or browse Discover.`
                              : `Try another date, or switch category. Pull down to refresh.`}
                        </Text>
                        <PrimaryButton
                          label={viewingToday ? 'Browse Discover' : 'Back to today'}
                          onPress={
                            viewingToday ? goDiscover : () => setSelectedDate(todayCityIso())
                          }
                          accessibilityLabel={
                            viewingToday ? 'Browse Discover' : 'Back to today'
                          }
                        />
                      </View>
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
                      <CompactArticleCardSkeleton
                        index={0}
                        density={desktop ? 'compact' : 'default'}
                      />
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
  // Quieter than hero/list titles so the lead story stays the dominant type above the fold.
  return (
    <HStack
      px="$4"
      mb="$2"
      alignItems="center"
      justifyContent="space-between"
      minHeight={36}
    >
      <Text
        fontSize={typography.meta.fontSize}
        lineHeight={typography.meta.lineHeight}
        fontWeight="$semibold"
        letterSpacing={0.6}
        color={colors.textSecondary}
        flex={1}
        textTransform="uppercase"
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
        <Text
          fontSize={typography.label.fontSize}
          lineHeight={typography.label.lineHeight}
          fontWeight="$semibold"
          color={colors.accent}
        >
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
  sectionAction: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
