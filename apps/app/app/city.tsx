import { useCallback, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { CityResponse } from '@tazakhabar/shared-types'
import { apiClient } from '../src/api/client'
import { PrimaryButton, SecondaryButton } from '../src/components/ui/PrimaryButton'
import { showToast } from '../src/components/ui/Toast'
import { hapticSelection } from '../src/lib/haptics'
import { useCityPicker } from '../src/hooks/useCityPicker'
import { getCurrentCoordinates } from '../src/location/getCurrentCoordinates'
import { findNearestCity } from '../src/location/nearestCity'
import { useTheme } from '../src/preferences/ThemePreferenceContext'
import {
  GLOBAL_CITY_SLUG,
  getCityDisplayLabel,
  setStoredCitySlug,
} from '../src/storage/cityPreference'
import { space, type AppColors } from '../src/theme/tokens'
import { translate, useT } from '../src/i18n'


/** Onboarding step after language (also reachable from Settings). */
export default function CityStepScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const t = useT()
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const goHome = useCallback(
    (slug: string) => router.replace({ pathname: '/(tabs)', params: { city: slug } }),
    [router],
  )

  // The picker sheet saves the city and shows the confirmation toast itself.
  const { openCityPicker, picker } = useCityPicker({
    citySlug: null,
    mobile: true,
    forceSheet: true,
    onCitySelected: (city) => {
      if (city.slug) goHome(city.slug)
    },
  })

  const choose = useCallback(
    async (city: CityResponse) => {
      if (!city.slug) return
      hapticSelection()
      await setStoredCitySlug(city.slug)
      showToast({
        message: translate('city.savedToast', { city: getCityDisplayLabel(city.slug, city.name) }),
      })
      goHome(city.slug)
    },
    [goHome],
  )

  const useLocation = useCallback(async () => {
    if (locating) return
    setLocating(true)
    setMessage(null)
    try {
      const [coords, cities] = await Promise.all([
        getCurrentCoordinates(),
        apiClient.getCities(),
      ])
      const match = findNearestCity(coords, cities.filter((c) => c.slug))
      if (match) {
        await choose(match.city)
      } else {
        setMessage(translate('city.noMatch'))
      }
    } catch {
      setMessage(translate('city.noMatch'))
    } finally {
      setLocating(false)
    }
  }, [choose, locating])

  const skip = useCallback(async () => {
    await setStoredCitySlug(GLOBAL_CITY_SLUG)
    goHome(GLOBAL_CITY_SLUG)
  }, [goHome])

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{t('city.eyebrow')}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {t('city.title')}
        </Text>
        <Text style={styles.subtitle}>{t('city.subtitle')}</Text>
        {message ? (
          <Text style={styles.message} accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}
      </View>

      {/* Actions live in the lower half for one-handed use. */}
      <View style={styles.actions}>
        <PrimaryButton
          label={locating ? t('city.locating') : t('city.useLocation')}
          onPress={() => void useLocation()}
          loading={locating}
          disabled={locating}
          fullWidth
        />
        <SecondaryButton
          label={t('city.search')}
          onPress={openCityPicker}
          fullWidth
          outline
        />
        <SecondaryButton label={t('city.skip')} onPress={() => void skip()} fullWidth />
      </View>
      {picker}
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: space.xl,
      justifyContent: 'space-between',
    },
    copy: { marginTop: space.xxl, maxWidth: 520, width: '100%', alignSelf: 'center' },
    eyebrow: {
      color: c.accent,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.6,
      marginBottom: 10,
    },
    title: { color: c.text, fontSize: 28, lineHeight: 34, fontWeight: '800', marginBottom: 8 },
    subtitle: { color: c.textSecondary, fontSize: 16, lineHeight: 24 },
    message: { color: c.text, fontSize: 16, lineHeight: 24, marginTop: space.md },
    actions: { gap: space.sm, maxWidth: 520, width: '100%', alignSelf: 'center' },
  })
}
