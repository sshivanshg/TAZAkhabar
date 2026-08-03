import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Box, Button, ButtonText, HStack, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { ArticleResponse, CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../../src/api/client'
import { ActionSheet, type ActionSheetItem } from '../../src/components/ActionSheet'
import { BreakingNewsCarousel } from '../../src/components/BreakingNewsCarousel'
import { CategoryChipRow } from '../../src/components/CategoryChips'
import {
  CompactArticleCard,
  CompactArticleCardSkeleton,
} from '../../src/components/CompactArticleCard'
import { ConfirmModal } from '../../src/components/ConfirmModal'
import { FeedRefreshIndicator } from '../../src/components/FeedRefreshIndicator'
import { HomeTopBar } from '../../src/components/HomeTopBar'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [actionArticle, setActionArticle] = useState<ArticleResponse | null>(null)
  const [blockSourceName, setBlockSourceName] = useState<string | null>(null)
  const [blockCategoryName, setBlockCategoryName] = useState<string | null>(null)
  const offsetRef = useRef(0)
  const loadingMoreLock = useRef(false)

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
        const items = result.items ?? []
        setTotal(result.total ?? items.length)
        setArticles((prev) => (mode === 'append' ? [...prev, ...items] : items))
        offsetRef.current = offset + items.length
        setError(null)
        requestAnimationFrame(() => setShowContent(true))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load articles')
        if (mode !== 'append') {
          setArticles([])
          setShowContent(true)
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
        setLoadingMore(false)
        loadingMoreLock.current = false
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
    rows.push({ kind: 'section', key: 'section' })
    if (recommendations.length === 0 && !loading && breaking.length === 0) {
      rows.push({ kind: 'empty', key: 'empty' })
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
    return rows
  }, [breaking, recommendations, loading])

  const openArticle = useCallback(
    (article: ArticleResponse) => {
      router.push({
        pathname: '/article/[id]',
        params: {
          id: String(article.id),
          headline: article.headline ?? '',
          summary: article.summary ?? '',
          sourceName: article.sourceName ?? '',
          sourceUrl: article.sourceUrl ?? '',
          imageUrl: article.imageUrl ?? '',
          publishedAt: article.publishedAt ?? '',
          category: article.category ?? '',
        },
      })
    },
    [router],
  )

  const goDiscover = useCallback(() => {
    router.push({
      pathname: '/(tabs)/search',
      params: category === 'All' ? {} : { category },
    })
  }, [router, category])

  const menuItems: ActionSheetItem[] = useMemo(
    () => [
      {
        key: 'city',
        label: 'Change city',
        onPress: () => router.push('/city'),
      },
      {
        key: 'profile',
        label: 'Profile',
        onPress: () => router.push('/(tabs)/profile'),
      },
      {
        key: 'discover',
        label: 'Discover',
        onPress: goDiscover,
      },
    ],
    [router, goDiscover],
  )

  const sheetItems: ActionSheetItem[] = useMemo(() => {
    if (!actionArticle) {
      return []
    }
    const cat = actionArticle.category ?? ''
    const source = actionArticle.sourceName ?? 'this source'
    return [
      {
        key: 'more',
        label: 'Show more like this',
        onPress: () => prefs.showMoreLikeThis(cat),
      },
      {
        key: 'less',
        label: 'Show less like this',
        onPress: () => prefs.showLessLikeThis(cat),
      },
      {
        key: 'hide',
        label: 'Hide this story',
        onPress: () => {
          if (actionArticle.id != null) {
            prefs.hideStory(actionArticle.id)
          }
        },
      },
      {
        key: 'block',
        label: 'Block this source',
        destructive: true,
        onPress: () => setBlockSourceName(source),
      },
    ]
  }, [actionArticle, prefs])

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
        <HomeTopBar
          onMenuPress={() => setMenuOpen(true)}
          onSearchPress={goDiscover}
          onNotificationPress={() => undefined}
        />
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
        <FeedRefreshIndicator visible={refreshing} />

        {loading && !showContent ? (
          <Box pt="$2" px="$4">
            <Box h={media.heroHeight} bg={colors.skeleton} borderRadius={radius.lg} mb="$4" />
            {[0, 1, 2].map((i) => (
              <CompactArticleCardSkeleton key={i} index={i} />
            ))}
          </Box>
        ) : null}

        {showContent ? (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 220 }}
            style={{ flex: 1 }}
          >
            {error && articles.length === 0 ? (
              <VStack px="$4" py="$8" space="md">
                <Text fontSize={18} lineHeight={28} fontWeight="$bold" color={colors.text}>
                  Something went wrong
                </Text>
                <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
                  {error}
                </Text>
                <Button
                  onPress={() => void loadPage('replace')}
                  bg={colors.accent}
                  minHeight={48}
                  alignSelf="flex-start"
                  px="$5"
                  borderRadius={radius.full}
                  accessibilityLabel="Retry loading articles"
                >
                  <ButtonText color={colors.textOnAccent} fontSize={16}>
                    Try again
                  </ButtonText>
                </Button>
              </VStack>
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
                        <BreakingNewsCarousel articles={breaking} onPress={openArticle} />
                      </View>
                    )
                  }
                  if (item.kind === 'section') {
                    return (
                      <View style={styles.sectionPad}>
                        <SectionHeader
                          title="Recommendation"
                          actionLabel="View all"
                          onAction={goDiscover}
                        />
                      </View>
                    )
                  }
                  if (item.kind === 'empty') {
                    return (
                      <Box py="$8" px="$4">
                        <Text fontSize={18} lineHeight={28} fontWeight="$bold" color={colors.text}>
                          No stories yet
                        </Text>
                        <Text
                          fontSize={16}
                          lineHeight={26}
                          color={colors.textSecondary}
                          mt="$2"
                        >
                          We do not have articles for {cityTitle}
                          {category !== 'All' ? ` in ${category}` : ''} right now. Pull down to
                          refresh, or browse Discover.
                        </Text>
                      </Box>
                    )
                  }
                  return (
                    <View style={styles.cardPad}>
                      <CompactArticleCard
                        article={item.article}
                        index={item.index}
                        onPress={openArticle}
                        onLongPress={setActionArticle}
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

      <ActionSheet
        visible={menuOpen}
        title="Menu"
        items={menuItems}
        onClose={() => setMenuOpen(false)}
      />

      <ActionSheet
        visible={actionArticle != null}
        title="Story options"
        items={sheetItems}
        onClose={() => setActionArticle(null)}
      />

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
      minHeight={36}
    >
      <Text
        fontSize={typography.section.fontSize}
        lineHeight={typography.section.lineHeight}
        fontWeight="$bold"
        color={colors.text}
      >
        {title}
      </Text>
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        hitSlop={8}
        style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
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
})
