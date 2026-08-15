import { Platform, Pressable, StyleSheet, Text, View, type AccessibilityRole, type PressableStateCallbackType } from 'react-native'
import { usePathname, useRouter, type Href } from 'expo-router'
import Bookmark from 'lucide-react-native/icons/bookmark'
import Globe from 'lucide-react-native/icons/globe'
import Home from 'lucide-react-native/icons/house'
import User from 'lucide-react-native/icons/user'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { iconStroke, type AppIcon } from '../../theme/categoryIcons'
import { colors, HIT_TARGET, radius, space, typography } from '../../theme/tokens'

type NavItem = {
  id: 'home' | 'search' | 'bookmarks' | 'profile'
  label: string
  href: Href
  testID: string
  Icon: AppIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/(tabs)', testID: 'sidebar-nav-home', Icon: Home },
  { id: 'search', label: 'Discover', href: '/(tabs)/search', testID: 'sidebar-nav-search', Icon: Globe },
  { id: 'bookmarks', label: 'Bookmarks', href: '/(tabs)/bookmarks', testID: 'sidebar-nav-bookmarks', Icon: Bookmark },
  { id: 'profile', label: 'Profile', href: '/(tabs)/profile', testID: 'sidebar-nav-profile', Icon: User },
]

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

function normalizePath(pathname: string): string {
  const stripped = pathname
    .replace(/\/\([^/]+\)/g, '')
    .replace(/\/index$/i, '')
    .replace(/\/+$/, '')
  return stripped === '' ? '/' : stripped
}

function isNavActive(pathname: string, href: string): boolean {
  const path = normalizePath(pathname)
  const target = normalizePath(href)
  if (target === '/') return path === '/'
  return path === target || path.startsWith(`${target}/`)
}

export function DesktopSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View
      accessibilityRole={'navigation' as AccessibilityRole}
      accessibilityLabel="Desktop navigation"
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, space.xl),
          paddingBottom: Math.max(insets.bottom, space.md),
        },
      ]}
    >
      <View style={styles.brandBlock}>
        <Text style={styles.brand} accessibilityRole="header">
          NewsFeed
        </Text>
        <View style={styles.brandRule} />
      </View>

      <View style={styles.list}>
        {NAV_ITEMS.map((item) => {
          const selected = isNavActive(pathname, String(item.href))
          return (
            <Pressable
              key={item.id}
              testID={item.testID}
              onPress={() => router.push(item.href)}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              style={(state) => {
                const { pressed, hovered, focused } = state as WebPressableState
                return [
                  styles.item,
                  selected ? styles.itemActive : null,
                  hovered && !selected ? styles.itemHover : null,
                  pressed && !selected ? styles.itemPressed : null,
                  focused ? styles.itemFocus : null,
                ]
              }}
            >
              {selected ? <View style={styles.accentBar} /> : null}
              <item.Icon
                size={20}
                strokeWidth={iconStroke}
                color={selected ? colors.accent : colors.textMuted}
              />
              <Text style={[styles.label, selected ? styles.labelActive : null]}>{item.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.footer} testID="sidebar-footer">
        <View style={styles.footerRule} />
        <Text style={styles.footerText} accessibilityLabel="NewsFeed version 0.1">
          NewsFeed v0.1
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    paddingHorizontal: space.sm,
  },
  brandBlock: {
    paddingHorizontal: space.sm,
    marginBottom: space.xl,
    gap: space.md,
  },
  brand: {
    fontSize: typography.section.fontSize,
    lineHeight: typography.section.lineHeight,
    fontWeight: typography.section.fontWeight,
    color: colors.text,
    letterSpacing: -0.3,
  },
  brandRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  list: {
    gap: space.xxs,
    flexGrow: 0,
  },
  item: {
    minHeight: HIT_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
    paddingLeft: space.md,
    paddingRight: space.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  itemActive: {
    backgroundColor: colors.accentSoft,
  },
  itemHover: {
    backgroundColor: colors.accentSoft,
  },
  itemPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  itemFocus: {
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'solid' as const,
          outlineWidth: 2,
          outlineColor: colors.accent,
          outlineOffset: 2,
        }
      : {
          borderWidth: 2,
          borderColor: colors.accent,
        }),
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: typography.bodySemibold.fontSize,
    lineHeight: typography.bodySemibold.lineHeight,
    fontWeight: typography.bodySemibold.fontWeight,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.accent,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: space.sm,
    paddingTop: space.lg,
    gap: space.sm,
  },
  footerRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  footerText: {
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    fontWeight: typography.label.fontWeight,
    letterSpacing: typography.label.letterSpacing,
    color: colors.textMuted,
  },
})
