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
import { ArrowLeft, Ban, Bookmark, EyeOff, MessageCircle, Search, SlidersHorizontal, ThumbsDown, ThumbsUp } from 'lucide-react-native'
import { MotiView } from 'moti'
import type { ArticleResponse, CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../../src/api/client'
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
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import {
  addBookmark,
  articleToBookmark,
  getBookmarks,
  removeBookmark,
} from '../../src/storage/bookmarks'
import { getStoredCitySlug } from '../../src/storage/cityPreference'
import { iconStroke } from '../../src/theme/categoryIcons'
import {
  FEED_CATEGORIES,
  type FeedCategory,
  PAGE_SIZE,
  colors,
  isFeedCategory,
  radius,
  space,
} from '../../src/theme/tokens'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isDesktopLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { articleRouteParams } from '../../src/utils/articleRouteParams'
import { shareArticleToWhatsApp } from '../../src/utils/shareToWhatsApp'

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
  const params = useLocalSearchParams<{ category?: string; from?: string; q?: string }>()
  const prefs = useFeedPreferences()
  const tabClearance = useTabBarClearance()
  const desktop = isDesktopLayout(useBreakpoint())
  const [citySlug, setCitySlug] = useState<string | null>(null)
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
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
  const shareLabel = Platform.OS === 'web' ? 'Share on WhatsApp' : 'Share'

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
    void getStoredCitySlug().then((slug) => {
      if (!slug) {
        router.replace('/city')
        return
      }
      setCitySlug(slug)
    })
  }, [router])

  useEffect(() => {
    if (!citySlug) {
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
      if (mode === 'refresh') {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      try {
        const result = await apiClient.getArticles({
          city: citySlug,
          q: debounced || undefined,
          category: category === 'All' ? undefined : category,
          limit: PAGE_SIZE,
          offset: 0,
        })
        if (gen !== loadGenRef.current) {
          return
        }
        setArticles(result.items ?? [])
      } catch (err) {
        if (gen !== loadGenRef.current) {
          return
        }
        // Keep prior results on refresh failure so pull-to-refresh does not wipe the list.
        if (mode === 'replace') {
          setArticles([])
        }
        setError(err instanceof Error ? err.message : 'Could not load stories')
      } finally {
        if (gen === loadGenRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [citySlug, debounced, category],
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
  const cityTitle = cityMeta?.name ?? citySlug ?? 'your city'
  const showSkeleton = (loading && !refreshing) || !prefs.ready

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

  const filterItems: ActionSheetItem[] = useMemo(
    () => [
      {
        key: 'city',
        label: 'Change city',
        onPress: () => router.push('/city'),
      },
      ...visibleCategories
        .filter((c) => c !== 'All')
        .map((c) => ({
          key: `cat-${c}`,
          label: category === c ? `${c} (selected)` : `Show ${c}`,
          onPress: () => setCategory(c),
        })),
    ],
    [visibleCategories, category, router],
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
            accessibilityLabel="Go back"
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed ? styles.pressed : null]}
          >
            <ArrowLeft size={22} strokeWidth={iconStroke} color={colors.text} />
          </Pressable>
        ) : null}
        <VStack flex={1} pl={showBack ? '$1' : '$2'} pr="$2">
          <Text fontSize={28} lineHeight={36} fontWeight="$bold" color={colors.text}>
            Discover
          </Text>
          <Text fontSize={15} lineHeight={22} color={colors.textSecondary} mt="$0.5">
            News from {cityTitle} and beyond
          </Text>
        </VStack>
      </View>

      <View style={styles.searchBar}>
        <Search size={20} strokeWidth={iconStroke} color={colors.accent} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search headlines"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Filter options"
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
            <CompactArticleCardSkeleton key={i} index={i} />
          ))}
        </Box>
      ) : null}

      {!showSkeleton && error ? (
        <ErrorState
          title="Something went wrong"
          message={error}
          onRetry={() => void load('replace')}
          retryLabel="Try again"
          retryAccessibilityLabel="Retry loading stories"
          onSecondary={() => router.replace('/(tabs)')}
          secondaryLabel="Back to feed"
        />
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
                onPress={openArticle}
                onLongPress={desktop ? openStoryActions : setActionArticle}
                onMorePress={desktop ? openStoryActions : setActionArticle}
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
            <VStack py="$10" space="sm">
              <Text fontSize={18} lineHeight={28} fontWeight="$bold" color={colors.text}>
                {debounced ? 'No matches' : 'No stories yet'}
              </Text>
              <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
                {debounced
                  ? `No headlines matched “${debounced}” for ${cityTitle}.`
                  : `We do not have articles for ${cityTitle}${
                      category !== 'All' ? ` in ${category}` : ''
                    } right now.`}
              </Text>
            </VStack>
          }
        />
      ) : null}

      <ActionSheet
        visible={filterOpen}
        title="Filters"
        items={filterItems}
        onClose={() => setFilterOpen(false)}
      />

      {desktop ? (
        <StoryOptionsPopover
          visible={actionArticle != null}
          anchor={popoverAnchor}
          title="Story options"
          sections={sheetSections}
          onClose={closeStoryActions}
        />
      ) : (
        <BottomSheet
          visible={actionArticle != null}
          title="Story options"
          sections={sheetSections}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: space.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
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
    backgroundColor: colors.surfaceRaised,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: space.screen,
    paddingTop: space.xs,
    flexGrow: 1,
  },
})
