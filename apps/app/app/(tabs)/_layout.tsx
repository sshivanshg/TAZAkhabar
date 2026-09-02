import { useMemo } from 'react'
import { Tabs } from 'expo-router'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Bookmark from 'lucide-react-native/icons/bookmark'
import Home from 'lucide-react-native/icons/house'
import User from 'lucide-react-native/icons/user'
import { MotiView } from 'moti'
import {
  space,
  TAB_BAR_HEIGHT,
  type AppColors,
} from '../../src/theme/tokens'
import { iconStroke } from '../../src/theme/categoryIcons'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { isExpandedLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { useTheme } from '../../src/preferences/ThemePreferenceContext'

function TabIcon({
  Icon,
  focused,
}: {
  Icon: typeof Home
  focused: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <MotiView
      animate={{
        scale: focused ? 1 : 0.96,
        backgroundColor: focused ? colors.accentFill : 'transparent',
      }}
      transition={{ type: 'timing', duration: 200 }}
      style={styles.tabIconWrap}
    >
      <Icon
        size={22}
        strokeWidth={focused ? 2.15 : iconStroke}
        color={focused ? colors.textOnAccent : colors.textMuted}
      />
    </MotiView>
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const bp = useBreakpoint()
  const expanded = isExpandedLayout(bp)
  // The web tab bar already ends at the viewport edge. The extra shell pad
  // is only needed for native safe-area insets (home indicator / navigation
  // bar) and otherwise creates a visible strip below the web nav.
  const bottomPad = Platform.OS === 'web' || expanded ? 0 : Math.max(insets.bottom, space.xs)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <ScreenErrorBoundary name="tabs">
      <View style={[styles.shell, { paddingBottom: bottomPad }]}>
        <Tabs
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
            headerShadowVisible: false,
            tabBarStyle: {
              height: TAB_BAR_HEIGHT,
              marginHorizontal: 0,
              marginBottom: 0,
              paddingTop: 6,
              paddingBottom: 8,
              borderRadius: 0,
              backgroundColor: colors.surface,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
              borderWidth: 0,
              ...{ shadowOpacity: 0, elevation: 0 },
              ...(Platform.OS === 'web'
                ? ({ overflow: 'hidden' } as const)
                : null),
              ...(expanded
                ? { display: 'none' as const, height: 0, marginBottom: 0, overflow: 'hidden' as const }
                : null),
            },
            tabBarItemStyle: {
              paddingVertical: 2,
            },
            sceneStyle: {
              backgroundColor: colors.background,
            },
            animation: Platform.OS === 'web' ? 'none' : 'fade',
            freezeOnBlur: true,
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: {
              fontSize: 11,
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
            name="bookmarks"
            options={{
              title: 'Bookmarks',
              headerShown: false,
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
            name="search"
            options={{
              href: null,
              headerShown: false,
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    shell: {
      flex: 1,
      backgroundColor: c.background,
    },
    tabIconWrap: {
      minWidth: 56,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      paddingHorizontal: 16,
    },
  })
}
