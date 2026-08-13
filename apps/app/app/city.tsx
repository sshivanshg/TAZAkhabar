import { useCallback, useEffect, useState } from 'react'
import { FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Box, Button, ButtonText, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import type { CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../src/api/client'
import { CityListSkeleton, CityRow } from '../src/components/CityRow'
import { setStoredCitySlug } from '../src/storage/cityPreference'
import { colors, radius, space } from '../src/theme/tokens'
import { isDesktopLayout, useBreakpoint } from '../src/hooks/useBreakpoint'

export default function CityPickerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const desktop = isDesktopLayout(useBreakpoint())
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
        <VStack
          px="$4"
          pb="$2"
          space="sm"
          style={{ paddingTop: desktop ? space.md : Math.max(insets.top, 8) + space.md }}
        >
          <Text fontSize={28} lineHeight={36} fontWeight="$bold" color={colors.text}>
            NewsFeed
          </Text>
          <Text fontSize={16} lineHeight={26} color={colors.textSecondary}>
            Pick your city to see local news summaries. You can change this anytime from Profile.
          </Text>
        </VStack>

        {loading ? <CityListSkeleton /> : null}

        {!loading && error ? (
          <VStack px="$4" py="$8" space="md" alignItems="flex-start">
            <Text fontSize={18} lineHeight={28} color={colors.text}>
              We could not load cities.
            </Text>
            <Text fontSize={16} lineHeight={24} color={colors.textSecondary}>
              {error}
            </Text>
            <Button
              onPress={() => void load()}
              bg={colors.accent}
              minHeight={48}
              px="$5"
              borderRadius={radius.full}
              accessibilityLabel="Retry loading cities"
            >
              <ButtonText color={colors.textOnAccent} fontSize={16}>
                Try again
              </ButtonText>
            </Button>
          </VStack>
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
