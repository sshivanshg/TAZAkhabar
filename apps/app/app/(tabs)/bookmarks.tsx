import { useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { Text, VStack } from '@gluestack-ui/themed'
import Bookmark from 'lucide-react-native/icons/bookmark'
import { MotiView } from 'moti'
import { CompactArticleCard } from '../../src/components/CompactArticleCard'
import {
  StoryOptionsPopover,
  captureMoreButtonAnchor,
  type StoryOptionsAnchor,
} from '../../src/components/desktop/StoryOptionsPopover'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import type { BottomSheetSection } from '../../src/components/ui/BottomSheet'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/preferences/ThemePreferenceContext'
import {
  type BookmarkSnapshot,
  getBookmarks,
  removeBookmark,
} from '../../src/storage/bookmarks'
import { radius, space, type AppColors } from '../../src/theme/tokens'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isDesktopLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { articleRouteParams } from '../../src/utils/articleRouteParams'

export default function BookmarksScreen() {
  return (
    <ScreenErrorBoundary name="bookmarks">
      <TabScreenShell>
        <BookmarksBody />
      </TabScreenShell>
    </ScreenErrorBoundary>
  )
}

function BookmarksBody() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const tabClearance = useTabBarClearance()
  const desktop = isDesktopLayout(useBreakpoint())
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [bookmarks, setBookmarks] = useState<BookmarkSnapshot[]>([])
  const [ready, setReady] = useState(false)
  const [actionItem, setActionItem] = useState<BookmarkSnapshot | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<StoryOptionsAnchor | null>(null)
  const cardHosts = useRef(new Map<string, View | null>())

  const reload = useCallback(async () => {
    const list = await getBookmarks()
    setBookmarks(list)
    setReady(true)
  }, [])

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload]),
  )

  const openArticle = useCallback(
    (item: BookmarkSnapshot) => {
      const params = articleRouteParams(item)
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

  const onRemove = useCallback(
    async (id: number) => {
      await removeBookmark(id)
      await reload()
    },
    [reload],
  )

  const closeStoryActions = useCallback(() => {
    setActionItem(null)
    setPopoverAnchor(null)
  }, [])

  const bookmarkSections: BottomSheetSection[] = useMemo(() => {
    if (!actionItem) {
      return []
    }
    return [
      {
        key: 'danger',
        items: [
          {
            key: 'remove',
            label: 'Remove bookmark',
            destructive: true,
            Icon: Bookmark,
            onPress: () => {
              void onRemove(actionItem.id)
            },
          },
        ],
      },
    ]
  }, [actionItem, onRemove])

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 220 }}
      style={styles.root}
    >
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + space.md },
        ]}
      >
        <Text
          fontSize={24}
          lineHeight={30}
          fontWeight="$bold"
          color={colors.text}
        >
          Bookmarks
        </Text>
        <Text fontSize={14} lineHeight={20} color={colors.textSecondary} mt="$1">
          Stories saved on this device
        </Text>
      </View>

      {!ready ? (
        <VStack flex={1} justifyContent="center" alignItems="center" px="$6">
          <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
            Loading saved stories…
          </Text>
        </VStack>
      ) : bookmarks.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="No saved stories yet"
            message="Save stories as you read. They'll stay here on this device for later."
            primaryLabel="Browse stories"
            onPrimary={() => router.replace('/(tabs)')}
            primaryAccessibilityLabel="Browse stories"
            secondaryLabel="Change city"
            onSecondary={() =>
              router.push({ pathname: '/(tabs)', params: { pickCity: '1' } })
            }
            secondaryAccessibilityLabel="Change city"
            icon={<Bookmark size={28} strokeWidth={1.8} color={colors.accent} />}
          />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: tabClearance }]}
          renderItem={({ item, index }) =>
            desktop ? (
              <View
                collapsable={false}
                ref={(node) => {
                  const key = String(item.id)
                  if (node) {
                    cardHosts.current.set(key, node)
                  } else {
                    cardHosts.current.delete(key)
                  }
                }}
              >
                <CompactArticleCard
                  article={item}
                  index={index}
                  density="compact"
                  onPress={() => openArticle(item)}
                  onMorePress={() => {
                    setActionItem(item)
                    captureMoreButtonAnchor(
                      cardHosts.current.get(String(item.id)) ?? null,
                      setPopoverAnchor,
                    )
                  }}
                />
              </View>
            ) : (
              <View>
                <CompactArticleCard
                  article={item}
                  index={index}
                  onPress={() => openArticle(item)}
                />
                <Pressable
                  onPress={() => void onRemove(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove bookmark ${item.headline}`}
                  style={({ pressed }) => [
                    styles.removeBtn,
                    pressed ? styles.removePressed : null,
                  ]}
                >
                  <Text fontSize={15} lineHeight={20} fontWeight="$semibold" color={colors.textSecondary}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            )
          }
        />
      )}

      {desktop ? (
        <StoryOptionsPopover
          visible={actionItem != null}
          anchor={popoverAnchor}
          title="Story options"
          sections={bookmarkSections}
          onClose={closeStoryActions}
        />
      ) : null}
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
      paddingHorizontal: space.screen,
      paddingBottom: space.sm,
      maxWidth: 980,
      width: '100%',
      alignSelf: 'center',
      ...(Platform.OS === 'web' ? { paddingTop: 8 } : {}),
    },
    list: {
      paddingHorizontal: space.screen,
      flexGrow: 1,
      maxWidth: 980,
      width: '100%',
      alignSelf: 'center',
    },
    emptyWrap: {
      flex: 1,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    removeBtn: {
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: space.xs,
      paddingHorizontal: space.xxs,
      marginBottom: space.sm,
      marginTop: -space.xs,
    },
    removePressed: {
      opacity: 0.7,
    },
  })
}
