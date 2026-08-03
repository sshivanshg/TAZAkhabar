import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Box, Text, VStack } from '@gluestack-ui/themed'
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react-native'
import { MotiView } from 'moti'
import type { ArticleResponse, CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../../src/api/client'
import { ActionSheet, type ActionSheetItem } from '../../src/components/ActionSheet'
import { CategoryChipRow } from '../../src/components/CategoryChips'
import {
  CompactArticleCard,
  CompactArticleCardSkeleton,
} from '../../src/components/CompactArticleCard'
import { ConfirmModal } from '../../src/components/ConfirmModal'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
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
  const params = useLocalSearchParams<{ category?: string }>()
  const prefs = useFeedPreferences()
  const tabClearance = useTabBarClearance()
  const [citySlug, setCitySlug] = useState<string | null>(null)
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState<FeedCategory>(() =>
    isFeedCategory(params.category) ? params.category : 'All',
  )
  const [articles, setArticles] = useState<ArticleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionArticle, setActionArticle] = useState<ArticleResponse | null>(null)
  const [blockSourceName, setBlockSourceName] = useState<string | null>(null)
  const [blockCategoryName, setBlockCategoryName] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    if (isFeedCategory(params.category) && params.category !== category) {
      setCategory(params.category)
    }
  }, [params.category, category])

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

  const load = useCallback(async () => {
    if (!citySlug) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.getArticles({
        city: citySlug,
        q: debounced || undefined,
        category: category === 'All' ? undefined : category,
        limit: PAGE_SIZE,
        offset: 0,
      })
      setArticles(result.items ?? [])
    } catch (err) {
      setArticles([])
      setError(err instanceof Error ? err.message : 'Could not load stories')
    } finally {
      setLoading(false)
    }
  }, [citySlug, debounced, category])

  useEffect(() => {
    void load()
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
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.navigate('/(tabs)')
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed ? styles.pressed : null]}
        >
          <ArrowLeft size={22} strokeWidth={iconStroke} color={colors.text} />
        </Pressable>
        <VStack flex={1} pl="$1">
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
          hitSlop={8}
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

      {loading ? (
        <Box px="$4" pt="$2" style={{ flex: 1 }}>
          {[0, 1, 2].map((i) => (
            <CompactArticleCardSkeleton key={i} index={i} />
          ))}
        </Box>
      ) : null}

      {!loading && error ? (
        <VStack px="$4" py="$8" space="sm" style={{ flex: 1 }}>
          <Text fontSize={18} lineHeight={28} fontWeight="$bold" color={colors.text}>
            Something went wrong
          </Text>
          <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
            {error}
          </Text>
        </VStack>
      ) : null}

      {!loading && !error ? (
        <FlatList
          style={styles.listFlex}
          data={visible}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: tabClearance }]}
          renderItem={({ item, index }) => (
            <CompactArticleCard
              article={item}
              index={index}
              onPress={openArticle}
              onLongPress={setActionArticle}
            />
          )}
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
    width: 36,
    height: 36,
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
