import { useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { ConfirmModal } from '../../src/components/ConfirmModal'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import {
  TOPIC_CATEGORIES,
  categoryIcon,
  iconInactive,
  iconStroke,
} from '../../src/theme/categoryIcons'
import { type FeedCategory, colors, radius, space } from '../../src/theme/tokens'

export default function CategoriesScreen() {
  const router = useRouter()
  const prefs = useFeedPreferences()
  const [blockCategoryName, setBlockCategoryName] = useState<string | null>(null)

  const categories = useMemo(
    () => TOPIC_CATEGORIES.filter((c) => !prefs.isCategoryBlocked(c)),
    [prefs],
  )

  const openCategory = (category: FeedCategory) => {
    router.push({ pathname: '/(tabs)/index', params: { category } })
  }

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 220 }}
      style={styles.root}
    >
      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <VStack px="$4" pt="$2" pb="$4" space="sm">
            <Text fontSize={14} lineHeight={20} color={colors.textSecondary}>
              Browse by topic. Long-press a category to block it from your feed.
            </Text>
          </VStack>
        }
        renderItem={({ item, index }) => {
          const Icon = categoryIcon(item)
          return (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 220, delay: Math.min(index * 40, 200) }}
            >
              <Pressable
                onPress={() => openCategory(item)}
                onLongPress={() => setBlockCategoryName(item)}
                delayLongPress={380}
                accessibilityRole="button"
                accessibilityLabel={`${item} category. Long press to block.`}
                style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              >
                <View style={styles.iconWrap}>
                  <Icon size={22} strokeWidth={iconStroke} color={iconInactive} />
                </View>
                <Text
                  fontSize={18}
                  lineHeight={26}
                  fontWeight="$semibold"
                  color={colors.text}
                  style={{ flex: 1 }}
                >
                  {item}
                </Text>
                <Text fontSize={14} lineHeight={20} color={colors.textMuted}>
                  Open
                </Text>
              </Pressable>
            </MotiView>
          )
        }}
        ListEmptyComponent={
          <BoxEmpty />
        }
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
          }
          setBlockCategoryName(null)
        }}
      />
    </MotiView>
  )
}

function BoxEmpty() {
  return (
    <VStack px="$4" py="$10" space="sm">
      <Text fontSize={18} lineHeight={28} fontWeight="$bold" color={colors.text}>
        No categories available
      </Text>
      <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
        All topics are blocked. Unblock them from Profile.
      </Text>
    </VStack>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: 32,
  },
  row: {
    minHeight: 64,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
