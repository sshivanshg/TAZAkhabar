import 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GluestackUIProvider } from '@gluestack-ui/themed'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { FeedPreferencesProvider } from '../src/preferences/FeedPreferencesContext'
import { ScreenErrorBoundary } from '../src/components/ScreenErrorBoundary'
import { newsfeedConfig } from '../src/theme/gluestack-config'
import { colors } from '../src/theme/tokens'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={newsfeedConfig}>
        <FeedPreferencesProvider>
          <ScreenErrorBoundary name="root">
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
                animationDuration: 220,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="feed" options={{ headerShown: false }} />
              <Stack.Screen name="city" options={{ title: 'Choose your city' }} />
              <Stack.Screen
                name="article/[id]"
                options={{
                  title: 'Story',
                  animation: 'fade_from_bottom',
                  animationDuration: 280,
                }}
              />
            </Stack>
          </ScreenErrorBoundary>
        </FeedPreferencesProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  )
}
