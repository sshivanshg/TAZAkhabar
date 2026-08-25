import { useCallback, useEffect, useState } from 'react'
import { FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { Box, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../src/api/client'
import { CityListSkeleton, CityRow } from '../src/components/CityRow'
import { ErrorState } from '../src/components/ui/ErrorState'
import { setStoredCitySlug } from '../src/storage/cityPreference'
import { colors, radius } from '../src/theme/tokens'

export default function CityPickerScreen() {
  const router = useRouter()
  const [cities, setCities] = useState<CityResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.getCities()
      // Hide test-only empty city from the picker
      setCities(result.filter((c) => c.slug && c.slug !== 'emptyville'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load cities')
      setCities([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onSelect = async (city: CityResponse) => {
    if (!city.slug) {
      return
    }
    await setStoredCitySlug(city.slug)
    router.replace({ pathname: '/(tabs)', params: { city: city.slug } })
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240 }}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Box flex={1} bg={colors.background}>
        <VStack px="$4" pt="$4" pb="$2" space="sm">
          <Text fontSize={24} lineHeight={30} fontWeight="$bold" color={colors.text}>
            NewsFeed
          </Text>
          <Text fontSize={15} lineHeight={22} color={colors.textSecondary}>
            Pick your city to see local news summaries. You can change this anytime from Profile.
          </Text>
        </VStack>

        {loading ? <CityListSkeleton /> : null}

        {!loading && error ? (
          <Box flex={1} px="$4" py="$8">
            <ErrorState
              title="We could not load cities."
              message={`Check your connection and try again. ${error ?? 'We need this list before we can personalize your feed.'}`}
              onRetry={() => void load()}
              retryLabel="Try again"
              retryAccessibilityLabel="Retry loading cities"
            />
            {error ? (
              <Text
                fontSize={14}
                lineHeight={20}
                color={colors.textMuted}
                mt="$3"
                textAlign="center"
              >
                {error}
              </Text>
            ) : null}
          </Box>
        ) : null}

        {!loading && !error ? (
          <FlatList
            data={cities}
            keyExtractor={(item) => String(item.id ?? item.slug)}
            renderItem={({ item, index }) => (
              <CityRow city={item} index={index} onSelect={(c) => void onSelect(c)} />
            )}
            ListEmptyComponent={
              <Box px="$4" py="$8">
                <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
                  No cities are available yet. Please try again later.
                </Text>
              </Box>
            }
          />
        ) : null}
      </Box>
    </MotiView>
  )
}
