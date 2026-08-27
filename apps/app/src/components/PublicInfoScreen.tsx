import { useMemo } from 'react'
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import Head from 'expo-router/head'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@gluestack-ui/themed'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import ArrowRight from 'lucide-react-native/icons/arrow-right'
import Mail from 'lucide-react-native/icons/mail'
import ShieldCheck from 'lucide-react-native/icons/shield-check'
import { PUBLIC_PAGE_LINKS, PUBLIC_PAGES, type PublicPageId } from '../content/publicPages'
import { useBreakpoint, isDesktopLayout } from '../hooks/useBreakpoint'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { iconStroke } from '../theme/categoryIcons'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../theme/tokens'

const CONTENT_MAX = 780
const SUPPORT_EMAIL = (process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '').trim()

export function PublicInfoScreen({ pageId }: { pageId: PublicPageId }) {
  const page = PUBLIC_PAGES[pageId]
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const desktop = isDesktopLayout(useBreakpoint())
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const related = PUBLIC_PAGE_LINKS.filter((link) => link.id !== pageId)

  const openSupportEmail = () => {
    if (!SUPPORT_EMAIL) return
    const subject = pageId === 'corrections' ? 'TazaKhabar correction or takedown request' : 'TazaKhabar support request'
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`)
  }

  return (
    <>
      <Head>
        <title>{`${page.title} — TazaKhabar`}</title>
        <meta name="description" content={page.intro} />
        <meta property="og:title" content={`${page.title} — TazaKhabar`} />
        <meta property="og:description" content={page.intro} />
      </Head>
      <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: desktop ? space.xl : Math.max(insets.top, space.sm) + space.xs,
            paddingBottom: Math.max(insets.bottom, space.lg) + space.xxl,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <ArrowLeft size={22} strokeWidth={iconStroke} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.replace('/')}
            accessibilityRole="link"
            accessibilityLabel="TazaKhabar home"
            style={({ pressed }) => [styles.brandButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.brand}>TazaKhabar</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrow}>{page.eyebrow}</Text>
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {page.title}
          </Text>
          <Text style={styles.intro}>{page.intro}</Text>
          {page.updated ? <Text style={styles.updated}>Effective {page.updated}</Text> : null}
        </View>

        <View style={styles.document}>
          {page.sections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>{String(sectionIndex + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  {section.title}
                </Text>
                {section.paragraphs?.map((paragraph) => (
                  <Text key={paragraph} style={styles.bodyText}>
                    {paragraph}
                  </Text>
                ))}
                {section.bullets ? (
                  <View style={styles.bulletList}>
                    {section.bullets.map((bullet) => (
                      <View key={bullet} style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {(pageId === 'support' || pageId === 'corrections' || pageId === 'privacy') ? (
          <View style={styles.contactPanel}>
            <View style={styles.contactIcon}>
              {pageId === 'privacy' ? (
                <ShieldCheck size={24} strokeWidth={iconStroke} color={colors.accent} />
              ) : (
                <Mail size={24} strokeWidth={iconStroke} color={colors.accent} />
              )}
            </View>
            <View style={styles.contactCopy}>
              <Text accessibilityRole="header" style={styles.contactTitle}>
                {pageId === 'corrections' ? 'Send an editorial request' : 'Contact TazaKhabar'}
              </Text>
              <Text style={styles.contactText}>
                {SUPPORT_EMAIL
                  ? `Write to ${SUPPORT_EMAIL}. Please do not include passwords, payment details, or unnecessary personal information.`
                  : 'Our public support address is being configured for launch. The rest of this page explains what to include in your request.'}
              </Text>
            </View>
            {SUPPORT_EMAIL ? (
              <Pressable
                onPress={openSupportEmail}
                accessibilityRole="link"
                accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
                style={({ pressed }) => [styles.contactButton, pressed ? styles.contactButtonPressed : null]}
              >
                <Text style={styles.contactButtonText}>Email us</Text>
                <ArrowRight size={18} strokeWidth={iconStroke} color={colors.textOnAccent} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.moreBlock}>
          <Text accessibilityRole="header" style={styles.moreTitle}>More from TazaKhabar</Text>
          <View style={styles.linkGrid}>
            {related.map((link) => (
              <Pressable
                key={link.id}
                onPress={() => router.push(link.href)}
                accessibilityRole="link"
                accessibilityLabel={link.label}
                style={({ pressed }) => [styles.linkRow, pressed ? styles.linkRowPressed : null]}
              >
                <Text style={styles.linkText}>{link.label}</Text>
                <ArrowRight size={18} strokeWidth={iconStroke} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
        </ScrollView>
      </View>
    </>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scrollContent: {
      width: '100%',
      maxWidth: CONTENT_MAX,
      alignSelf: 'center',
      paddingHorizontal: space.screen,
    },
    topBar: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      marginBottom: space.xl,
    },
    backButton: {
      width: HIT_TARGET,
      height: HIT_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
      marginLeft: -space.xs,
    },
    brandButton: {
      minHeight: HIT_TARGET,
      justifyContent: 'center',
      paddingHorizontal: space.xs,
      borderRadius: radius.sm,
    },
    pressed: { backgroundColor: c.surfaceRaised, transform: [{ scale: 0.985 }] },
    brand: {
      fontSize: typography.headlineSm.fontSize,
      lineHeight: typography.headlineSm.lineHeight,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.3,
    },
    hero: {
      paddingTop: space.lg,
      paddingBottom: 44,
      paddingLeft: Platform.OS === 'web' ? 52 : 0,
      maxWidth: 700,
    },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.md },
    eyebrowMark: { width: 24, height: 3, borderRadius: radius.full, backgroundColor: c.accentFill },
    eyebrow: {
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      fontWeight: '700',
      color: c.accent,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 38,
      lineHeight: 44,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -1,
      maxWidth: 620,
    },
    intro: {
      marginTop: space.md,
      fontSize: 18,
      lineHeight: 28,
      color: c.textSecondary,
      maxWidth: 640,
    },
    updated: {
      marginTop: space.md,
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      fontWeight: '600',
      color: c.textMuted,
    },
    document: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSolid,
    },
    section: {
      flexDirection: 'row',
      gap: space.lg,
      paddingVertical: space.xxl,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    sectionNumber: { width: 36, paddingTop: 3 },
    sectionNumberText: {
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      fontWeight: '700',
      color: c.accent,
      letterSpacing: 0.5,
    },
    sectionContent: { flex: 1, maxWidth: 650 },
    sectionTitle: {
      fontSize: typography.section.fontSize,
      lineHeight: typography.section.lineHeight,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.35,
      marginBottom: space.sm,
    },
    bodyText: {
      fontSize: typography.summary.fontSize,
      lineHeight: 26,
      color: c.textSecondary,
      marginBottom: space.sm,
    },
    bulletList: { gap: space.sm, marginTop: space.xs },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
    bullet: {
      width: 7,
      height: 7,
      borderRadius: radius.full,
      backgroundColor: c.accentFill,
      marginTop: 9,
    },
    bulletText: { flex: 1, fontSize: typography.summary.fontSize, lineHeight: 25, color: c.textSecondary },
    contactPanel: {
      marginTop: space.xxl,
      padding: space.xl,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSolid,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      flexWrap: 'wrap',
    },
    contactIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactCopy: { flex: 1, minWidth: 220 },
    contactTitle: {
      fontSize: typography.headlineSm.fontSize,
      lineHeight: typography.headlineSm.lineHeight,
      fontWeight: '700',
      color: c.text,
    },
    contactText: { marginTop: 4, fontSize: typography.summary.fontSize, lineHeight: 24, color: c.textSecondary },
    contactButton: {
      minHeight: HIT_TARGET,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      paddingHorizontal: space.md,
      borderRadius: radius.md,
      backgroundColor: c.accentFill,
    },
    contactButtonPressed: { backgroundColor: c.accentPressed, transform: [{ scale: 0.985 }] },
    contactButtonText: {
      fontSize: typography.button.fontSize,
      lineHeight: typography.button.lineHeight,
      fontWeight: '700',
      color: c.textOnAccent,
    },
    moreBlock: { marginTop: 48 },
    moreTitle: {
      fontSize: typography.headlineSm.fontSize,
      lineHeight: typography.headlineSm.lineHeight,
      fontWeight: '700',
      color: c.text,
      marginBottom: space.sm,
    },
    linkGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.xs,
    },
    linkRow: {
      minHeight: HIT_TARGET,
      minWidth: 150,
      flexGrow: 1,
      flexBasis: 220,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.sm,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    linkRowPressed: { backgroundColor: c.surfaceRaised, transform: [{ scale: 0.99 }] },
    linkText: {
      fontSize: typography.bodySemibold.fontSize,
      lineHeight: typography.bodySemibold.lineHeight,
      fontWeight: '600',
      color: c.text,
    },
  })
}
