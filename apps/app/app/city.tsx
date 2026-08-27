import { useCallback, useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import LocateFixed from 'lucide-react-native/icons/locate-fixed'
import type { CityResponse } from '@tazakhabar/shared-types'
import { apiClient } from '../src/api/client'
import { useAsyncResource } from '../src/api/useAsyncResource'
import { CityListItem, CityListSkeleton } from '../src/components/CityListItem'
import { CitySearch, filterCities } from '../src/components/CitySearch'
import { ErrorState } from '../src/components/ui/ErrorState'
import { PublicLinks } from '../src/components/PublicLinks'
import { getStoredCitySlug, setStoredCitySlug } from '../src/storage/cityPreference'
import { useTheme } from '../src/preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../src/theme/tokens'
import { iconStroke } from '../src/theme/categoryIcons'
import { getCurrentCoordinates } from '../src/location/getCurrentCoordinates'
import { findNearestCity } from '../src/location/nearestCity'

const EMPTY_CITIES: CityResponse[] = []
const CONTENT_MAX = 560
const TEST_CITY_SLUG = 'emptyville'

type LocationNotice = {
  tone: 'error' | 'info'
  message: string
} | null

function isSelectableCity(city: CityResponse): boolean {
  return Boolean(city.slug && city.slug !== TEST_CITY_SLUG)
}

export default function CityPickerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const canGoBack = router.canGoBack()
  const [query, setQuery] = useState('')
  const [storedSlug, setStoredSlug] = useState<string | null>(null)
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationNotice, setLocationNotice] = useState<LocationNotice>(null)

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
        return false
      }
      setSavingSlug(city.slug)
      try {
        await setStoredCitySlug(city.slug)
        router.replace({ pathname: '/(tabs)', params: { city: city.slug } })
        return true
      } catch {
        setSavingSlug(null)
        return false
      }
    },
    [router, savingSlug],
  )

  const onDetectLocation = useCallback(async () => {
    if (detectingLocation || savingSlug || cities.length === 0) {
      return
    }

    setDetectingLocation(true)
    setLocationNotice({ tone: 'info', message: 'Finding the nearest city…' })
    try {
      const coordinates = await getCurrentCoordinates()
      const match = findNearestCity(coordinates, cities)
      if (!match) {
        setLocationNotice({
          tone: 'error',
          message: 'We could not match your location. Please choose a city below.',
        })
        return
      }

      setLocationNotice({
        tone: 'info',
        message: `Found ${match.city.name ?? 'your city'}. Opening local news…`,
      })
      const saved = await onSelect(match.city)
      if (!saved) {
        setLocationNotice({
          tone: 'error',
          message: 'We found your city but could not save it. Please try again.',
        })
      }
    } catch (error) {
      const reason =
        typeof error === 'object' &&
        error !== null &&
        'reason' in error &&
        typeof error.reason === 'string'
          ? error.reason
          : 'unavailable'
      const message =
        reason === 'permission-denied'
          ? 'Location access was not allowed. You can still choose your city below.'
          : reason === 'services-disabled'
            ? 'Location services are turned off. Turn them on or choose your city below.'
            : reason === 'timeout'
              ? 'Location took too long. Try again or choose your city below.'
              : 'We could not get your location. Try again or choose your city below.'
      setLocationNotice({ tone: 'error', message })
    } finally {
      setDetectingLocation(false)
    }
  }, [cities, detectingLocation, onSelect, savingSlug])

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
          TazaKhabar
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
            <View style={styles.locationCard}>
              <Text
                fontSize={typography.headlineSm.fontSize}
                lineHeight={typography.headlineSm.lineHeight}
                fontWeight="$semibold"
                color={colors.text}
              >
                Find my city
              </Text>
              <Text
                fontSize={typography.summary.fontSize}
                lineHeight={typography.summary.lineHeight}
                color={colors.textSecondary}
                mt="$1"
              >
                Use your location once to select the nearest supported city. Your precise
                location stays on this device and is never sent to TazaKhabar.
              </Text>
              <Pressable
                onPress={() => void onDetectLocation()}
                disabled={detectingLocation || Boolean(savingSlug)}
                accessibilityRole="button"
                accessibilityLabel="Use my current location"
                accessibilityState={{ disabled: detectingLocation || Boolean(savingSlug), busy: detectingLocation }}
                style={({ pressed }) => [
                  styles.locationButton,
                  pressed ? styles.locationButtonPressed : null,
                  detectingLocation || savingSlug ? styles.locationButtonDisabled : null,
                ]}
              >
                <LocateFixed size={20} strokeWidth={iconStroke} color={colors.textOnAccent} />
                <Text
                  fontSize={typography.label.fontSize}
                  lineHeight={typography.label.lineHeight}
                  fontWeight="$semibold"
                  color={colors.textOnAccent}
                >
                  {detectingLocation ? 'Detecting city…' : 'Use my current location'}
                </Text>
              </Pressable>
              {locationNotice ? (
                <Text
                  accessibilityRole="alert"
                  fontSize={typography.meta.fontSize}
                  lineHeight={typography.meta.lineHeight}
                  color={locationNotice.tone === 'error' ? colors.destructive : colors.textSecondary}
                  mt="$2"
                >
                  {locationNotice.message}
                </Text>
              ) : null}
            </View>

            <View style={styles.manualHeader}>
              <View style={styles.divider} />
              <Text
                fontSize={typography.meta.fontSize}
                lineHeight={typography.meta.lineHeight}
                fontWeight="$semibold"
                color={colors.textMuted}
              >
                OR CHOOSE A CITY
              </Text>
              <View style={styles.divider} />
            </View>
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
        <View style={styles.publicFooter}>
          <Text
            fontSize={typography.meta.fontSize}
            lineHeight={typography.meta.lineHeight}
            color={colors.textMuted}
            textAlign="center"
          >
            No login. Choose your city and start reading.
          </Text>
          <PublicLinks compact />
        </View>
      </ScrollView>
    </MotiView>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
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
      backgroundColor: c.surfaceRaised,
    },
    description: {
      marginBottom: space.xl,
      maxWidth: 480,
    },
    body: {
      gap: space.sm,
    },
    locationCard: {
      padding: space.lg,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    locationButton: {
      minHeight: HIT_TARGET,
      marginTop: space.md,
      paddingHorizontal: space.lg,
      borderRadius: radius.full,
      backgroundColor: c.accentFill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
    },
    locationButtonPressed: {
      opacity: 0.85,
    },
    locationButtonDisabled: {
      opacity: 0.65,
    },
    manualHeader: {
      marginTop: space.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    divider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
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
    publicFooter: {
      marginTop: 'auto',
      paddingTop: space.xxl,
    },
  })
}
