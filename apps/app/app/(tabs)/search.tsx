import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Box, Text, VStack } from '@gluestack-ui/themed'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import Search from 'lucide-react-native/icons/search'
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal'
import { MotiView } from 'moti'
import type { ArticleResponse, CityResponse } from '@tazakhabar/shared-types'
import { apiClient } from '../../src/api/client'
import { buildStorySections } from '../../src/components/buildStorySections'
import {
  ActionSheet,
  BottomSheet,
  type ActionSheetItem,
  type BottomSheetSection,
} from '../../src/components/ui/BottomSheet'
import { CategoryChipRow } from '../../src/components/CategoryChips'
import {
  CompactArticleCard,
  CompactArticleCardSkeleton,
} from '../../src/components/CompactArticleCard'
import { ConfirmModal } from '../../src/components/ConfirmModal'
import {
  StoryOptionsPopover,
  captureMoreButtonAnchor,
  type StoryOptionsAnchor,
} from '../../src/components/desktop/StoryOptionsPopover'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { ErrorState } from '../../src/components/ui/ErrorState'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import { useLanguagePreference } from '../../src/preferences/LanguagePreferenceContext'
import { useTheme } from '../../src/preferences/ThemePreferenceContext'
import {
  addBookmark,
  articleToBookmark,
  getBookmarks,
  removeBookmark,
} from '../../src/storage/bookmarks'
import {
  createGlobalCity,
  getCityDisplayLabel,
  getEffectiveCitySlug,
  isGlobalCitySlug,
} from '../../src/storage/cityPreference'
import {
  feedCacheKey,
  isFeedCacheFresh,
  readFeedCache,
  writeFeedCache,
} from '../../src/storage/feedCache'
import { iconStroke } from '../../src/theme/categoryIcons'
import {
  FEED_CATEGORIES,
  type FeedCategory,
  PAGE_SIZE,
  ERROR_COLUMN_MAX,
  isFeedCategory,
  radius,
  space,
  type AppColors,
} from '../../src/theme/tokens'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isDesktopLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { articleRouteParams } from '../../src/utils/articleRouteParams'
import { openArticleSource } from '../../src/utils/openArticleSource'
import { shareArticle } from '../../src/utils/shareArticle'
import { feedCategoryLabel, readableErrorMessage, translate, useT } from '../../src/i18n'

export default function DiscoverScreen() {
  return (
    <ScreenErrorBoundary name="discover">
      <TabScreenShell>
        <DiscoverBody />
      </TabScreenShell>
    </ScreenErrorBoundary>
  )
}

function DiscoverBody() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const params = useLocalSearchParams<{ category?: string; from?: string; q?: string }>()
  const prefs = useFeedPreferences()
  const { preferredLanguage } = useLanguagePreference()
  const t = useT()
  const tabClearance = useTabBarClearance()
  const desktop = isDesktopLayout(useBreakpoint())
  const [citySlug, setCitySlug] = useState<string | null>(null)
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const initialQ = typeof params.q === 'string' ? params.q : ''
  const [query, setQuery] = useState(initialQ)
  const [debounced, setDebounced] = useState(initialQ.trim())
  const [category, setCategory] = useState<FeedCategory>(() =>
    isFeedCategory(params.category) ? params.category : 'All',
  )
  const [articles, setArticles] = useState<ArticleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionArticle, setActionArticle] = useState<ArticleResponse | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<StoryOptionsAnchor | null>(null)
  const cardHosts = useRef(new Map<string, View | null>())
  const [blockSourceName, setBlockSourceName] = useState<string | null>(null)
  const [blockCategoryName, setBlockCategoryName] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set())
  const loadGenRef = useRef(0)
  // Only show back when Discover was opened from Home (not as the tab root).
  const showBack = params.from === 'home'

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
    if (typeof params.q === 'string' && params.q.length > 0) {
      setQuery(params.q)
    }
  }, [params.q])

  useEffect(() => {
    void getEffectiveCitySlug().then((slug) => {
      setCitySlug(slug)
    })
  }, [])

  useEffect(() => {
    if (!citySlug) {
      return
    }
    if (isGlobalCitySlug(citySlug)) {
      setCityMeta(createGlobalCity())
      return
    }
    let cancelled = false
    apiClient
      .getCities()
      .then((cities) => {
        if (!cancelled) {
          setCityMeta(cities.find((c) => c.slug === citySlug) ?? null)
        }
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
    const handle = setTimeout(() => setDebounced(query.trim()), 320)
    return () => clearTimeout(handle)
  }, [query])

  const load = useCallback(
    async (mode: 'replace' | 'refresh' = 'replace') => {
      if (!citySlug) {
        return
      }
      const gen = ++loadGenRef.current
      const cacheKey = feedCacheKey({
        city: citySlug,
        category: category === 'All' ? undefined : category,
        lang: preferredLanguage,
        q: debounced || undefined,
      })
      let paintedFromCache = false

      if (mode === 'refresh') {
        setRefreshing(true)
      } else {
        const cached = await readFeedCache(cacheKey)
        if (gen !== loadGenRef.current) {
          return
        }
        if (cached && isFeedCacheFresh(cached)) {
          setArticles(cached.items)
          setError(null)
          setLoading(false)
          return
        }
        if (cached) {
          paintedFromCache = true
          setArticles(cached.items)
          setLoading(false)
        } else {
          setLoading(true)
        }
      }
      setError(null)
      try {
        const result = await apiClient.getArticles({
          city: citySlug,
          q: debounced || undefined,
          category: category === 'All' ? undefined : category,
          lang: preferredLanguage,
          limit: PAGE_SIZE,
          offset: 0,
        })
        if (gen !== loadGenRef.current) {
          return
        }
        const items = result.items ?? []
        setArticles(items)
        void writeFeedCache(cacheKey, items, result.total ?? items.length)
      } catch (err) {
        if (gen !== loadGenRef.current) {
          return
        }
        // Keep prior results on refresh/stale-cache failure so pull-to-refresh does not wipe the list.
        if (mode === 'replace' && !paintedFromCache) {
          setArticles([])
        }
        setError(readableErrorMessage(err, 'search.loadFailed'))
      } finally {
        if (gen === loadGenRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [citySlug, debounced, category, preferredLanguage],
  )

  useEffect(() => {
    void load('replace')
  }, [load])

  const visibleCategories = useMemo(
    () =>
      FEED_CATEGORIES.filter(
        (c) => c === 'All' || !prefs.isCategoryBlocked(c),
      ) as FeedCategory[],
    [prefs],
  )

  const visible = useMemo(() => prefs.filterArticles(articles), [articles, prefs])
  const cityTitle = getCityDisplayLabel(citySlug, cityMeta?.name)
  const showSkeleton = (loading && !refreshing) || !prefs.ready

  const openArticle = useCallback(
    (article: ArticleResponse) => {
      const params = articleRouteParams(article, {
        city: citySlug ?? undefined,
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
    [router, citySlug, preferredLanguage],
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

  const sheetSections: BottomSheetSection[] = useMemo(() => {
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

  const filterItems: ActionSheetItem[] = useMemo(
    () => [
      {
        key: 'city',
        label: t('common.changeCity'),
        onPress: () => router.push({ pathname: '/(tabs)', params: { pickCity: '1' } }),
      },
      ...visibleCategories
        .filter((c) => c !== 'All')
        .map((c) => ({
          key: `cat-${c}`,
          label:
            category === c
              ? t('search.categorySelected', { category: feedCategoryLabel(t, c) })
              : t('search.showCategory', { category: feedCategoryLabel(t, c) }),
          onPress: () => setCategory(c),
        })),
    ],
    [visibleCategories, category, router, t],
  )

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 220 }}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.goBack')}
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed ? styles.pressed : null]}
          >
            <ArrowLeft size={22} strokeWidth={iconStroke} color={colors.text} />
          </Pressable>
        ) : null}
        <VStack flex={1} pl={showBack ? '$1' : '$2'} pr="$2">
          <Text fontSize={24} lineHeight={30} fontWeight="$bold" color={colors.text}>
            {t('search.title')}
          </Text>
          <Text fontSize={14} lineHeight={20} color={colors.textSecondary} mt="$0.5">
            {t('search.subtitle', { city: cityTitle })}
          </Text>
        </VStack>
      </View>

      <View style={styles.searchBar}>
        <Search size={20} strokeWidth={iconStroke} color={colors.accent} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('common.searchHeadlines')}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('search.filterOptions')}
          hitSlop={4}
          style={({ pressed }) => [styles.filterBtn, pressed ? styles.pressed : null]}
        >
          <SlidersHorizontal size={20} strokeWidth={iconStroke} color={colors.text} />
        </Pressable>
      </View>

      <CategoryChipRow
        selected={category}
        onSelect={setCategory}
        onLongPressCategory={(chip) => {
          if (chip !== 'All') {
            setBlockCategoryName(chip)
          }
        }}
        categories={visibleCategories}
      />

      {showSkeleton ? (
        <Box px="$4" pt="$2" style={{ flex: 1 }}>
          {[0, 1, 2].map((i) => (
            <CompactArticleCardSkeleton
              key={i}
              index={i}
              density={desktop ? 'compact' : 'default'}
            />
          ))}
        </Box>
      ) : null}

      {!showSkeleton && error ? (
        <View
          testID={desktop ? 'error-column' : undefined}
          style={desktop ? styles.errorColumn : undefined}
        >
          <ErrorState
            title={t('common.somethingWentWrong')}
            message={error}
            onRetry={() => void load('replace')}
            retryLabel={t('common.tryAgain')}
            retryAccessibilityLabel={t('search.retryA11y')}
            onSecondary={() => router.replace('/(tabs)')}
            secondaryLabel={t('search.backToFeed')}
          />
        </View>
      ) : null}

      {!showSkeleton && !error ? (
        <FlatList
          style={styles.listFlex}
          data={visible}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: tabClearance }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load('refresh')}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={
                Platform.OS === 'android' ? colors.surface : undefined
              }
            />
          }
          renderItem={({ item, index }) => {
            const card = (
              <CompactArticleCard
                article={item}
                index={index}
                density={desktop ? 'compact' : 'default'}
                onPress={openArticle}
                onLongPress={desktop ? openStoryActions : setActionArticle}
                onMorePress={desktop ? openStoryActions : setActionArticle}
                onSeeMorePress={(article) => {
                  const q = article.sourceName?.trim()
                  if (q) {
                    setQuery(q)
                  }
                }}
              />
            )
            if (!desktop) {
              return card
            }
            return (
              <View
                collapsable={false}
                ref={(node) => {
                  const key = item.id != null ? String(item.id) : String(index)
                  if (node) {
                    cardHosts.current.set(key, node)
                  } else {
                    cardHosts.current.delete(key)
                  }
                }}
              >
                {card}
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                title={debounced ? t('search.noMatches') : t('home.emptyTitle')}
                message={
                  debounced
                    ? t('search.noMatchesMessage', { query: debounced, city: cityTitle })
                    : category !== 'All'
                      ? t('search.emptyMessageCategory', {
                          city: cityTitle,
                          category: feedCategoryLabel(t, category),
                        })
                      : t('search.emptyMessage', { city: cityTitle })
                }
                primaryLabel={debounced ? t('common.clearSearch') : t('search.browseHome')}
                onPrimary={
                  debounced
                    ? () => {
                        setQuery('')
                        setDebounced('')
                      }
                    : () => router.replace('/(tabs)')
                }
                primaryAccessibilityLabel={debounced ? t('common.clearSearch') : t('search.browseHome')}
                secondaryLabel={debounced ? t('search.backToHome') : t('common.changeCity')}
                onSecondary={
                  debounced
                    ? () => router.replace('/(tabs)')
                    : () => router.push({ pathname: '/(tabs)', params: { pickCity: '1' } })
                }
                secondaryAccessibilityLabel={debounced ? t('search.backToHome') : t('common.changeCity')}
              />
            </View>
          }
        />
      ) : null}

      <ActionSheet
        visible={filterOpen}
        title={t('search.filters')}
        items={filterItems}
        onClose={() => setFilterOpen(false)}
      />

      {desktop ? (
        <StoryOptionsPopover
          visible={actionArticle != null}
          anchor={popoverAnchor}
          sections={sheetSections}
          onClose={closeStoryActions}
        />
      ) : (
        <BottomSheet
          visible={actionArticle != null}
          sections={sheetSections}
          onClose={() => setActionArticle(null)}
        />
      )}

      <ConfirmModal
        visible={blockSourceName != null}
        title={t('block.sourceTitle')}
        message={t('block.sourceMessage', { name: blockSourceName ?? t('block.thisSource') })}
        confirmLabel={t('block.sourceConfirm')}
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
        title={t('block.categoryTitle')}
        message={t('block.categoryMessage', { name: blockCategoryName ? feedCategoryLabel(t, blockCategoryName) : t('block.thisCategory') })}
        confirmLabel={t('block.categoryConfirm')}
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: space.sm,
    paddingBottom: space.xs,
    gap: space.xxs,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    marginTop: 2,
  },
  searchBar: {
    marginHorizontal: space.screen,
    marginTop: space.xs,
    marginBottom: space.xs,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: space.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    color: c.text,
    paddingVertical: 0,
    height: 48,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  pressed: {
    backgroundColor: c.surfaceRaised,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: space.screen,
    paddingTop: space.xs,
    flexGrow: 1,
  },
  emptyWrap: {
    flexGrow: 1,
  },
  errorColumn: {
    flex: 1,
    width: '100%',
    maxWidth: ERROR_COLUMN_MAX,
    alignSelf: 'center',
  },
  })
}
