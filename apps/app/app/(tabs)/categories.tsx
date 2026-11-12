import { useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { ConfirmModal } from '../../src/components/ConfirmModal'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import { useTheme } from '../../src/preferences/ThemePreferenceContext'
import {
  TOPIC_CATEGORIES,
  categoryIcon,
  iconInactiveColor,
  iconStroke,
} from '../../src/theme/categoryIcons'
import { useMotionTransition, usePrefersReducedMotion } from '../../src/hooks/usePrefersReducedMotion'
import { hapticLight } from '../../src/lib/haptics'
import { cardPress } from '../../src/lib/pressFeedback'
import { feedCategoryLabel, useT } from '../../src/i18n'
import { type FeedCategory, radius, space, type AppColors } from '../../src/theme/tokens'

export default function CategoriesScreen() {
  const router = useRouter()
  const prefs = useFeedPreferences()
  const { colors } = useTheme()
  const t = useT()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [blockCategoryName, setBlockCategoryName] = useState<string | null>(null)
  const reduced = usePrefersReducedMotion()
  const screenTransition = useMotionTransition({ type: 'timing', duration: 220 })

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
      transition={screenTransition}
      style={styles.root}
    >
      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <VStack px="$4" pt="$2" pb="$4" space="sm">
            <Text fontSize={14} lineHeight={20} color={colors.textSecondary}>
              {t('categories.hint')}
            </Text>
          </VStack>
        }
        renderItem={({ item, index }) => {
          const Icon = categoryIcon(item)
          const row = (
              <Pressable
                onPress={() => openCategory(item)}
                onLongPress={() => {
                  hapticLight()
                  setBlockCategoryName(item)
                }}
                delayLongPress={380}
                accessibilityRole="button"
                accessibilityLabel={t('categories.itemA11y', { category: feedCategoryLabel(t, item) })}
                style={({ pressed }) => [styles.row, cardPress(pressed)]}
              >
                <View style={styles.iconWrap}>
                  <Icon size={22} strokeWidth={iconStroke} color={iconInactiveColor(colors)} />
                </View>
                <Text
                  fontSize={18}
                  lineHeight={26}
                  fontWeight="$semibold"
                  color={colors.text}
                  style={{ flex: 1 }}
                >
                  {feedCategoryLabel(t, item)}
                </Text>
                <Text fontSize={14} lineHeight={20} color={colors.textMuted}>
                  {t('categories.open')}
                </Text>
              </Pressable>
          )
          // M9: stagger only the first rows; reduced motion renders them static.
          if (reduced || index >= 6) {
            return row
          }
          return (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 220, delay: index * 40 }}
            >
              {row}
            </MotiView>
          )
        }}
        ListEmptyComponent={
          <BoxEmpty colors={colors} />
        }
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
          }
          setBlockCategoryName(null)
        }}
      />
    </MotiView>
  )
}

function BoxEmpty({ colors }: { colors: AppColors }) {
  const t = useT()
  return (
    <VStack px="$4" py="$10" space="sm">
      <Text fontSize={18} lineHeight={28} fontWeight="$bold" color={colors.text}>
        {t('categories.emptyTitle')}
      </Text>
      <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
        {t('categories.emptyBody')}
      </Text>
    </VStack>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
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
      borderBottomColor: c.border,
    },
    rowPressed: {
      backgroundColor: c.surface,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
