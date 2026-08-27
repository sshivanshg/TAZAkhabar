import { useMemo } from 'react'
import { Pressable, StyleSheet, View, type AccessibilityRole } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@gluestack-ui/themed'
import { PUBLIC_PAGE_LINKS } from '../content/publicPages'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../theme/tokens'

export function PublicLinks({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
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
          onPress={() => router.push(link.href)}
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
