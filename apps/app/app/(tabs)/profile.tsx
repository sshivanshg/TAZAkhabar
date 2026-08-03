import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../../src/api/client'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import { getStoredCitySlug } from '../../src/storage/cityPreference'
import { colors, radius, shadows, space } from '../../src/theme/tokens'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'

export default function ProfileScreen() {
  return (
    <TabScreenShell>
      <ProfileBody />
    </TabScreenShell>
  )
}

function ProfileBody() {
  const router = useRouter()
  const prefs = useFeedPreferences()
  const tabClearance = useTabBarClearance()
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [citySlug, setCitySlug] = useState<string | null>(null)

  const loadCity = useCallback(async () => {
    const slug = await getStoredCitySlug()
    setCitySlug(slug)
    if (!slug) {
      setCityMeta(null)
      return
    }
    try {
      const cities = await apiClient.getCities()
      setCityMeta(cities.find((c) => c.slug === slug) ?? null)
    } catch {
      setCityMeta(null)
    }
  }, [])

  useEffect(() => {
    void loadCity()
  }, [loadCity])

  const cityTitle = cityMeta?.name ?? citySlug ?? 'Not set'
  const version =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    '0.1.0'

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 220 }}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabClearance }]}>
        <Section title="City">
          <Text fontSize={16} lineHeight={24} color={colors.textSecondary} mb="$3">
            News is filtered for your selected city. No account is required.
          </Text>
          <Text fontSize={22} lineHeight={30} fontWeight="$bold" color={colors.text} mb="$4">
            {cityTitle}
          </Text>
          <Pressable
            onPress={() => router.push('/city')}
            accessibilityRole="button"
            accessibilityLabel="Change city"
            style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
          >
            <Text fontSize={16} lineHeight={22} fontWeight="$semibold" color={colors.textOnAccent}>
              Change city
            </Text>
          </Pressable>
        </Section>

        <Section title="Blocked">
          <PreferenceList
            label="Sources"
            empty="No sources blocked"
            items={prefs.blockedSources}
            onRemove={(name) => prefs.unblockSource(name)}
          />
          <View style={styles.spacer} />
          <PreferenceList
            label="Categories"
            empty="No categories blocked"
            items={prefs.blockedCategories}
            onRemove={(name) => prefs.unblockCategory(name)}
          />
        </Section>

        <Section title="About this app">
          <Text fontSize={16} lineHeight={26} color={colors.textSecondary}>
            NewsFeed is a local news summary PWA. Stories are curated for your city so you can
            catch up quickly and share what matters.
          </Text>
          <Text
            fontSize={13}
            lineHeight={18}
            letterSpacing={0.6}
            fontWeight="$medium"
            color={colors.textMuted}
            textTransform="uppercase"
            mt="$5"
          >
            Version {version}
          </Text>
        </Section>
      </ScrollView>
    </MotiView>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <VStack mb="$8" px="$4">
      <Text
        fontSize={13}
        lineHeight={18}
        letterSpacing={0.6}
        fontWeight="$medium"
        color={colors.textMuted}
        textTransform="uppercase"
        mb="$3"
      >
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
    </VStack>
  )
}

function PreferenceList({
  label,
  empty,
  items,
  onRemove,
}: {
  label: string
  empty: string
  items: string[]
  onRemove: (value: string) => void
}) {
  return (
    <VStack>
      <Text fontSize={15} lineHeight={22} fontWeight="$semibold" color={colors.text} mb="$2">
        {label}
      </Text>
      {items.length === 0 ? (
        <Text fontSize={15} lineHeight={22} color={colors.textMuted}>
          {empty}
        </Text>
      ) : (
        items.map((item) => (
          <View key={item} style={styles.prefRow}>
            <Text fontSize={16} lineHeight={22} color={colors.textSecondary} style={{ flex: 1 }}>
              {item}
            </Text>
            <Pressable
              onPress={() => onRemove(item)}
              accessibilityRole="button"
              accessibilityLabel={`Unblock ${item}`}
              hitSlop={8}
            >
              <Text fontSize={15} lineHeight={20} fontWeight="$semibold" color={colors.text}>
                Unblock
              </Text>
            </Pressable>
          </View>
        ))
      )}
    </VStack>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    ...shadows.card,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    minHeight: 44,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    backgroundColor: colors.accentPressed,
  },
  spacer: {
    height: 18,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    gap: space.sm,
  },
})
