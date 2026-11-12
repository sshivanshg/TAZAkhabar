import { View, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { EmptyState } from '../src/components/ui/EmptyState'
import { useTheme } from '../src/preferences/ThemePreferenceContext'
import { useT } from '../src/i18n'

/** Unknown routes: translated message and one big Home button in thumb reach. */
export default function NotFoundScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const t = useT()
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false, title: t('home.notFoundTitle') }} />
      <EmptyState
        title={t('home.notFoundTitle')}
        message={t('home.notFoundMessage')}
        primaryLabel={t('home.goHome')}
        primaryAccessibilityLabel={t('home.goHome')}
        onPrimary={() => router.replace('/')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center' },
})
