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
  type AppColors,
} from '../../src/theme/tokens'
import { iconStroke } from '../../src/theme/categoryIcons'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { isExpandedLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { useTheme } from '../../src/preferences/ThemePreferenceContext'
import { useMotionTransition } from '../../src/hooks/usePrefersReducedMotion'
import { hapticSelection } from '../../src/lib/haptics'
import { useAppLanguage, useT } from '../../src/i18n'

/** Spec 2026-11-12 #13: room for the 13px label under the icon pill. */
const TAB_BAR_HEIGHT = 76

function TabIcon({
  Icon,
  focused,
}: {
  Icon: typeof Home
  focused: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const transition = useMotionTransition({ type: 'timing', duration: 160 })

  return (
    <MotiView
      animate={{
        backgroundColor: focused ? colors.accentFill : 'transparent',
      }}
      transition={transition}
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
  const t = useT()
  // Devanagari matras need extra line height to avoid clipping.
  const isHindi = useAppLanguage() === 'hi'

  return (
    <ScreenErrorBoundary name="tabs">
      <View style={[styles.shell, { paddingBottom: bottomPad }]}>
        <Tabs
          screenListeners={({ navigation }) => ({
            tabPress: () => {
              // Selection haptic only when the tab actually changes.
              if (!navigation.isFocused()) hapticSelection()
            },
          })}
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
              fontSize: 13,
              lineHeight: isHindi ? 19 : 16,
              fontWeight: '600',
              letterSpacing: 0.1,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t('tabs.home'),
              headerShown: false,
              tabBarLabel: t('tabs.home'),
              tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
              tabBarAccessibilityLabel: t('tabs.homeA11y'),
            }}
          />
          <Tabs.Screen
            name="bookmarks"
            options={{
              title: t('tabs.bookmarks'),
              headerShown: false,
              // Short label keeps the 360px bar on one line in Hindi.
              tabBarLabel: isHindi ? t('tabs.bookmarksShort') : t('tabs.bookmarks'),
              tabBarIcon: ({ focused }) => <TabIcon Icon={Bookmark} focused={focused} />,
              tabBarAccessibilityLabel: t('tabs.bookmarks'),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t('tabs.settings'),
              // Title renders in-page inside the 720 column (not at the rail edge).
              headerShown: false,
              tabBarLabel: t('tabs.settings'),
              tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
              tabBarAccessibilityLabel: t('tabs.settings'),
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
      marginBottom: 2,
    },
  })
}
