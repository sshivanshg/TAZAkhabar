import { useMemo } from 'react'
import { Linking, Pressable, StyleSheet, View, type AccessibilityRole } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../theme/tokens'
import { getPublicSiteUrl } from '../utils/publicSiteUrl'
import { useT } from '../i18n'

const siteUrl = getPublicSiteUrl()

const PUBLIC_PAGE_LINKS = [
  { id: 'about', labelKey: 'links.about', href: `${siteUrl}/about` },
  { id: 'contact', labelKey: 'common.contactUs', href: `${siteUrl}/contact` },
  { id: 'privacy', labelKey: 'links.privacy', href: `${siteUrl}/privacy` },
  { id: 'terms', labelKey: 'links.terms', href: `${siteUrl}/terms` },
  { id: 'support', labelKey: 'links.support', href: `${siteUrl}/support` },
  { id: 'corrections', labelKey: 'links.corrections', href: `${siteUrl}/corrections` },
] as const

type PublicLinkId = (typeof PUBLIC_PAGE_LINKS)[number]['id']

export function PublicLinks({
  compact = false,
  exclude = [],
}: {
  compact?: boolean
  exclude?: PublicLinkId[]
}) {
  const { colors } = useTheme()
  const t = useT()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View
      accessibilityRole={'navigation' as AccessibilityRole}
      accessibilityLabel={t('links.groupA11y')}
      style={[styles.root, compact ? styles.compact : null]}
    >
      {PUBLIC_PAGE_LINKS.filter((link) => !exclude.includes(link.id)).map((link) => (
        <Pressable
          key={link.id}
          onPress={() => {
            void Linking.openURL(link.href)
          }}
          accessibilityRole="link"
          accessibilityLabel={t(link.labelKey)}
          style={({ pressed }) => [styles.link, pressed ? styles.linkPressed : null]}
        >
          <Text style={styles.label}>{t(link.labelKey)}</Text>
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
