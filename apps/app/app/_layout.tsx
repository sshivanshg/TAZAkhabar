import 'react-native-gesture-handler'
import '../src/accessibility/defaultTextScaling'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GluestackUIProvider } from '@gluestack-ui/themed'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { FeedPreferencesProvider } from '../src/preferences/FeedPreferencesContext'
import { LanguagePreferenceProvider } from '../src/preferences/LanguagePreferenceContext'
import {
  ThemePreferenceProvider,
  useTheme,
} from '../src/preferences/ThemePreferenceContext'
import { ScreenErrorBoundary } from '../src/components/ScreenErrorBoundary'
import { AppShell, DesktopSidebar } from '../src/components/desktop'
import { tazakhabarConfig } from '../src/theme/gluestack-config'
import { applyWebColorScheme } from '../src/theme/applyWebColorScheme'

function RootNavigation() {
  const { colorScheme, colors } = useTheme()

  useEffect(() => {
    applyWebColorScheme(colorScheme, colors)
  }, [colorScheme, colors])

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppShell sidebar={<DesktopSidebar />}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
            animationDuration: 260,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="feed" options={{ headerShown: false }} />
          <Stack.Screen
            name="city"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 280,
            }}
          />
          <Stack.Screen
            name="article/[id]"
            options={{
              headerShown: false,
              animation: 'fade_from_bottom',
              animationDuration: 320,
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          />
        </Stack>
      </AppShell>
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={tazakhabarConfig}>
        <ThemePreferenceProvider>
          <FeedPreferencesProvider>
            <LanguagePreferenceProvider>
              <ScreenErrorBoundary name="root">
                <RootNavigation />
              </ScreenErrorBoundary>
            </LanguagePreferenceProvider>
          </FeedPreferencesProvider>
        </ThemePreferenceProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  )
}
