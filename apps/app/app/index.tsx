import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { Box, Spinner, Text, VStack } from '@gluestack-ui/themed'
import { useTheme } from '../src/preferences/ThemePreferenceContext'
import { useLanguagePreference } from '../src/preferences/LanguagePreferenceContext'
import { getStoredCitySlug } from '../src/storage/cityPreference'
import { resolveBootRoute } from '../src/lib/onboarding'
import { useT } from '../src/i18n'

export default function IndexScreen() {
  const { colors } = useTheme()
  const t = useT()
  const { ready: languageReady, hasSelectedLanguage } = useLanguagePreference()
  const [ready, setReady] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getStoredCitySlug().then((value) => {
      if (!cancelled) {
        setSlug(value)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready || !languageReady) {
    return (
      <Box flex={1} bg={colors.background} justifyContent="center" alignItems="center" px="$6">
        <VStack space="md" alignItems="center">
          <Spinner color={colors.textSecondary} size="large" />
          <Text fontSize={16} lineHeight={24} color={colors.textMuted}>
            {t('boot.loading')}
          </Text>
        </VStack>
      </Box>
    )
  }

  // language → city → tabs; returning readers (stored city) go straight to tabs.
  return <Redirect href={resolveBootRoute({ hasSelectedLanguage, storedCity: slug })} />
}
