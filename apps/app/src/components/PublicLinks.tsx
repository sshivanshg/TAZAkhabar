import { useMemo } from 'react'
import { Linking, Pressable, StyleSheet, View, type AccessibilityRole } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../theme/tokens'

const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://tazakhabar-site.pages.dev').replace(/\/+$/, '')

const PUBLIC_PAGE_LINKS = [
  { id: 'about', label: 'About', href: `${siteUrl}/about` },
  { id: 'privacy', label: 'Privacy', href: `${siteUrl}/privacy` },
  { id: 'terms', label: 'Terms', href: `${siteUrl}/terms` },
  { id: 'support', label: 'Support', href: `${siteUrl}/support` },
  { id: 'corrections', label: 'Corrections', href: `${siteUrl}/corrections` },
] as const

export function PublicLinks({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View
      accessibilityRole={'navigation' as AccessibilityRole}
      accessibilityLabel="TazaKhabar information"
      style={[styles.root, compact ? styles.compact : null]}
    >
      {PUBLIC_PAGE_LINKS.map((link) => (
        <Pressable
          key={link.id}
          onPress={() => {
            void Linking.openURL(link.href)
          }}
          accessibilityRole="link"
          accessibilityLabel={link.label}
          style={({ pressed }) => [styles.link, pressed ? styles.linkPressed : null]}
        >
          <Text style={styles.label}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.xxs,
      marginTop: space.md,
    },
    compact: {
      justifyContent: 'center',
      paddingVertical: space.md,
    },
    link: {
      minHeight: HIT_TARGET,
      justifyContent: 'center',
      paddingHorizontal: space.sm,
      borderRadius: radius.sm,
    },
    linkPressed: { backgroundColor: c.surfaceRaised },
    label: {
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      fontWeight: '600',
      color: c.textMuted,
    },
  })
}
