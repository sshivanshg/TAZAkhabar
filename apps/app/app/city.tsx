import { useCallback, useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import type { CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../src/api/client'
import { useAsyncResource } from '../src/api/useAsyncResource'
import { CityListItem, CityListSkeleton } from '../src/components/CityListItem'
import { CitySearch, filterCities } from '../src/components/CitySearch'
import { ErrorState } from '../src/components/ui/ErrorState'
import { getStoredCitySlug, setStoredCitySlug } from '../src/storage/cityPreference'
import { colors, HIT_TARGET, radius, space, typography } from '../src/theme/tokens'
import { iconStroke } from '../src/theme/categoryIcons'

const EMPTY_CITIES: CityResponse[] = []
const CONTENT_MAX = 560
const TEST_CITY_SLUG = 'emptyville'

function isSelectableCity(city: CityResponse): boolean {
  return Boolean(city.slug && city.slug !== TEST_CITY_SLUG)
}

export default function CityPickerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const canGoBack = router.canGoBack()
  const [query, setQuery] = useState('')
  const [storedSlug, setStoredSlug] = useState<string | null>(null)
  const [savingSlug, setSavingSlug] = useState<string | null>(null)

  const citiesResource = useAsyncResource(
    () => apiClient.getCities().then((result) => result.filter(isSelectableCity)),
    [],
    { initialData: EMPTY_CITIES },
  )

  useEffect(() => {
    let cancelled = false
    void getStoredCitySlug().then((slug) => {
      if (!cancelled) {
        setStoredSlug(slug)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const isChangingCity = Boolean(storedSlug)
  const showBack = canGoBack && isChangingCity
  const cities = citiesResource.data
  const matches = useMemo(() => filterCities(cities, query), [cities, query])
  const searching = query.trim().length > 0

  const selectedMatch = useMemo(
    () => (storedSlug ? matches.find((city) => city.slug === storedSlug) : undefined),
    [matches, storedSlug],
  )
  const otherMatches = useMemo(
    () => (storedSlug ? matches.filter((city) => city.slug !== storedSlug) : matches),
    [matches, storedSlug],
  )
  const showYourCity = Boolean(!searching && selectedMatch)

  const onSelect = useCallback(
    async (city: CityResponse) => {
      if (!city.slug || savingSlug) {
        return
      }
      setSavingSlug(city.slug)
      try {
        await setStoredCitySlug(city.slug)
        router.replace({ pathname: '/(tabs)', params: { city: city.slug } })
      } catch {
        setSavingSlug(null)
      }
    },
    [router, savingSlug],
  )

  const heading = isChangingCity ? 'Change city' : 'Choose your city'
  const description = isChangingCity
    ? "Choose which city's local news appears in your feed."
    : "We'll personalize your local news feed around this city. You can change this anytime from Profile."

  const topPad = Math.max(insets.top, space.xs) + space.lg
  const bottomPad = Math.max(insets.bottom, space.sm) + space.xl

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200 }}
      style={styles.root}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad,
            paddingBottom: bottomPad,
          },
        ]}
      >
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={4}
            style={({ pressed }) => [styles.backBtn, pressed ? styles.backPressed : null]}
          >
            <ArrowLeft size={22} strokeWidth={iconStroke} color={colors.text} />
          </Pressable>
        ) : null}

        <Text
          fontSize={13}
          lineHeight={18}
          fontWeight="$semibold"
          color={colors.textMuted}
          letterSpacing={0.4}
          accessibilityRole="header"
        >
          NewsFeed
        </Text>
        <Text
          fontSize={typography.section.fontSize}
          lineHeight={typography.section.lineHeight}
          fontWeight="$bold"
          color={colors.text}
          mt="$2"
          accessibilityRole="header"
        >
          {heading}
        </Text>
        <Text
          fontSize={16}
          lineHeight={24}
          color={colors.textSecondary}
          mt="$2"
          style={styles.description}
        >
          {description}
        </Text>

        {citiesResource.loading ? <CityListSkeleton /> : null}

        {!citiesResource.loading && citiesResource.error ? (
          <View style={styles.errorWrap}>
            <ErrorState
              title="Couldn't load cities"
              message="Check your connection and try again."
              onRetry={() => citiesResource.reload()}
              retryLabel="Retry"
              retryAccessibilityLabel="Retry loading cities"
            />
          </View>
        ) : null}

        {!citiesResource.loading && !citiesResource.error ? (
          <View style={styles.body}>
            <CitySearch value={query} onChange={setQuery} />

            {matches.length === 0 ? (
              <View style={styles.emptySearch} accessibilityRole="text">
                <Text
                  fontSize={18}
                  lineHeight={24}
                  fontWeight="$semibold"
                  color={colors.text}
                >
                  {cities.length === 0 ? 'No cities available yet.' : 'No cities found'}
                </Text>
                <Text
                  fontSize={16}
                  lineHeight={24}
                  color={colors.textSecondary}
                  mt="$1"
                >
                  {cities.length === 0
                    ? 'Please try again later.'
                    : 'Try a different city name.'}
                </Text>
              </View>
            ) : (
              <>
                {showYourCity && selectedMatch ? (
                  <View style={styles.section}>
                    <Text
                      fontSize={15}
                      lineHeight={20}
                      fontWeight="$semibold"
                      color={colors.textMuted}
                      mb="$2"
                    >
                      Your city
                    </Text>
                    <CityListItem
                      city={selectedMatch}
                      selected
                      saving={savingSlug === selectedMatch.slug}
                      disabled={Boolean(savingSlug)}
                      statusLabel={
                        savingSlug === selectedMatch.slug
                          ? `Setting up your ${selectedMatch.name ?? 'city'} feed…`
                          : 'Current city'
                      }
                      onSelect={(city) => void onSelect(city)}
                    />
                  </View>
                ) : null}

                {otherMatches.length > 0 ? (
                  <View style={styles.section}>
                    <Text
                      fontSize={15}
                      lineHeight={20}
                      fontWeight="$semibold"
                      color={colors.textMuted}
                      mb="$2"
                    >
                      {showYourCity ? 'Other cities' : 'Available cities'}
                    </Text>
                    <View style={styles.list}>
                      {otherMatches.map((city) => {
                        const selected = city.slug === storedSlug
                        const saving = city.slug === savingSlug
                        return (
                          <CityListItem
                            key={String(city.id ?? city.slug)}
                            city={city}
                            selected={selected}
                            saving={saving}
                            disabled={Boolean(savingSlug)}
                            statusLabel={
                              saving
                                ? `Setting up your ${city.name ?? 'city'} feed…`
                                : selected
                                  ? 'Selected'
                                  : undefined
                            }
                            onSelect={(next) => void onSelect(next)}
                          />
                        )
                      })}
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100dvh' as unknown as number } : {}),
  },
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    paddingHorizontal: space.xl,
    flexGrow: 1,
  },
  backBtn: {
    width: HIT_TARGET,
    height: HIT_TARGET,
    marginLeft: -space.xs,
    marginBottom: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  backPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  description: {
    marginBottom: space.xl,
    maxWidth: 480,
  },
  body: {
    gap: space.sm,
  },
  section: {
    marginTop: space.lg,
  },
  list: {
    gap: 10,
  },
  emptySearch: {
    marginTop: space.xl,
    paddingVertical: space.lg,
  },
  errorWrap: {
    flexGrow: 1,
    minHeight: 280,
  },
})
