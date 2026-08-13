import { Tabs } from 'expo-router'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bookmark, Globe, Home, User } from 'lucide-react-native'
import { MotiView } from 'moti'
import {
  colors,
  radius,
  shadows,
  space,
  TAB_BAR_HEIGHT,
} from '../../src/theme/tokens'
import { iconStroke } from '../../src/theme/categoryIcons'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { isDesktopLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'

function TabIcon({
  Icon,
  focused,
}: {
  Icon: typeof Home
  focused: boolean
}) {
  return (
    <MotiView
      animate={{ opacity: focused ? 1 : 0.72, scale: focused ? 1 : 0.96 }}
      transition={{ type: 'timing', duration: 200 }}
    >
      <Icon
        size={22}
        strokeWidth={iconStroke}
        color={focused ? colors.accent : colors.textMuted}
      />
    </MotiView>
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const desktop = isDesktopLayout(useBreakpoint())
  const bottomPad = desktop ? 0 : Math.max(insets.bottom, space.xs)

  return (
    <ScreenErrorBoundary name="tabs">
      <View style={[styles.shell, { paddingBottom: bottomPad }]}>
        <Tabs
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
            headerShadowVisible: false,
            // Not absolute — scene layout ends above the bar so content is never covered.
            tabBarStyle: {
              height: TAB_BAR_HEIGHT,
              marginHorizontal: space.sm,
              marginBottom: space.xs,
              paddingTop: 6,
              paddingBottom: 8,
              borderRadius: radius.xl,
              backgroundColor: colors.surface,
              borderTopWidth: 0,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              ...shadows.tabBar,
              ...(Platform.OS === 'web'
                ? ({ overflow: 'hidden' } as const)
                : null),
              ...(desktop
                ? { display: 'none' as const, height: 0, marginBottom: 0, overflow: 'hidden' as const }
                : null),
            },
            tabBarItemStyle: {
              paddingVertical: 2,
            },
            sceneStyle: {
              backgroundColor: colors.background,
            },
            animation: 'none',
            freezeOnBlur: true,
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.2,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              headerShown: false,
              tabBarLabel: 'Home',
              tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
              tabBarAccessibilityLabel: 'Home feed',
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: 'Discover',
              headerShown: false,
              tabBarLabel: 'Discover',
              tabBarIcon: ({ focused }) => <TabIcon Icon={Globe} focused={focused} />,
              tabBarAccessibilityLabel: 'Discover stories',
            }}
          />
          <Tabs.Screen
            name="bookmarks"
            options={{
              title: 'Bookmarks',
              tabBarLabel: 'Bookmarks',
              tabBarIcon: ({ focused }) => <TabIcon Icon={Bookmark} focused={focused} />,
              tabBarAccessibilityLabel: 'Bookmarks',
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarLabel: 'Profile',
              tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
              tabBarAccessibilityLabel: 'Profile and settings',
            }}
          />
          <Tabs.Screen
            name="categories"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </ScreenErrorBoundary>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
