import { useMemo } from 'react'
import { Platform, Pressable, StyleSheet, Text, View, type AccessibilityRole, type PressableStateCallbackType } from 'react-native'
import { usePathname, useRouter, type Href } from 'expo-router'
import Bookmark from 'lucide-react-native/icons/bookmark'
import Home from 'lucide-react-native/icons/house'
import User from 'lucide-react-native/icons/user'
import Info from 'lucide-react-native/icons/info'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { iconStroke, type AppIcon } from '../../theme/categoryIcons'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../../theme/tokens'

type NavItem = {
  id: 'home' | 'bookmarks' | 'profile' | 'about'
  label: string
  href: Href
  testID: string
  Icon: AppIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/(tabs)', testID: 'sidebar-nav-home', Icon: Home },
  { id: 'bookmarks', label: 'Bookmarks', href: '/(tabs)/bookmarks', testID: 'sidebar-nav-bookmarks', Icon: Bookmark },
  { id: 'profile', label: 'Profile', href: '/(tabs)/profile', testID: 'sidebar-nav-profile', Icon: User },
  { id: 'about', label: 'About & help', href: '/about', testID: 'sidebar-nav-about', Icon: Info },
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
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

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
          TazaKhabar
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
        <View style={styles.footerLinks}>
          <Pressable
            onPress={() => router.push('/privacy')}
            accessibilityRole="link"
            accessibilityLabel="Privacy"
            style={({ pressed }) => [styles.footerLink, pressed ? styles.itemPressed : null]}
          >
            <Text style={styles.footerLinkText}>Privacy</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/support')}
            accessibilityRole="link"
            accessibilityLabel="Support"
            style={({ pressed }) => [styles.footerLink, pressed ? styles.itemPressed : null]}
          >
            <Text style={styles.footerLinkText}>Support</Text>
          </Pressable>
        </View>
        <Text style={styles.footerText} accessibilityLabel="TazaKhabar version 0.1">
          TazaKhabar v0.1
        </Text>
      </View>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.surface,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: c.border,
      paddingHorizontal: space.sm,
    },
    brandBlock: {
      paddingHorizontal: space.sm,
      marginBottom: space.lg,
      gap: 8,
    },
    brand: {
      fontSize: typography.section.fontSize,
      lineHeight: typography.section.lineHeight,
      fontWeight: typography.section.fontWeight,
      color: c.text,
      letterSpacing: -0.3,
    },
    brandRule: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
    },
    list: {
      gap: 6,
      flexGrow: 0,
    },
    item: {
      minHeight: HIT_TARGET,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingVertical: 10,
      paddingLeft: space.md,
      paddingRight: space.sm,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    itemActive: {
      backgroundColor: c.accentSoft,
    },
    itemHover: {
      backgroundColor: c.accentSoft,
    },
    itemPressed: {
      backgroundColor: c.surfaceRaised,
    },
    itemFocus: {
      ...(Platform.OS === 'web'
        ? {
            outlineStyle: 'solid' as const,
            outlineWidth: 2,
            outlineColor: c.accent,
            outlineOffset: 2,
          }
        : {
            borderWidth: 2,
            borderColor: c.accent,
          }),
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: 3,
      borderRadius: radius.full,
      backgroundColor: c.accentFill,
    },
    label: {
      fontSize: typography.bodySemibold.fontSize,
      lineHeight: typography.bodySemibold.lineHeight,
      fontWeight: typography.bodySemibold.fontWeight,
      color: c.textSecondary,
    },
    labelActive: {
      color: c.accent,
    },
    footer: {
      marginTop: 'auto',
      paddingHorizontal: space.sm,
      paddingTop: space.lg,
      gap: space.sm,
    },
    footerRule: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
    },
    footerText: {
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: typography.label.fontWeight,
      letterSpacing: typography.label.letterSpacing,
      color: c.textMuted,
    },
    footerLinks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.xxs,
    },
    footerLink: {
      minHeight: HIT_TARGET,
      justifyContent: 'center',
      paddingHorizontal: space.xs,
      borderRadius: radius.sm,
    },
    footerLinkText: {
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      fontWeight: '600',
      color: c.textMuted,
    },
  })
}
