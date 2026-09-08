import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { Box, Spinner, Text, VStack } from '@gluestack-ui/themed'
import { useTheme } from '../src/preferences/ThemePreferenceContext'
import { getEffectiveCitySlug } from '../src/storage/cityPreference'

export default function IndexScreen() {
  const { colors } = useTheme()
  const [ready, setReady] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getEffectiveCitySlug().then((value) => {
      if (!cancelled) {
        setSlug(value)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <Box flex={1} bg={colors.background} justifyContent="center" alignItems="center" px="$6">
        <VStack space="md" alignItems="center">
          <Spinner color={colors.textSecondary} size="large" />
          <Text fontSize={16} lineHeight={24} color={colors.textMuted}>
            Loading TazaKhabar…
          </Text>
        </VStack>
      </Box>
    )
  }

  if (slug) {
    return <Redirect href={{ pathname: '/(tabs)', params: { city: slug } }} />
  }

  return <Redirect href="/(tabs)" />
}
