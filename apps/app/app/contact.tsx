import { useMemo } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Text } from '@gluestack-ui/themed'
import Mail from 'lucide-react-native/icons/mail'
import Globe from 'lucide-react-native/icons/globe'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Card } from '../src/components/ui/Card'
import { ScreenErrorBoundary } from '../src/components/ScreenErrorBoundary'
import { useTheme } from '../src/preferences/ThemePreferenceContext'
import { CONTACT_EMAIL, DEVELOPER_NAME, getContactPageUrl } from '../src/config/contact'
import { HIT_TARGET, space, typography, type AppColors } from '../src/theme/tokens'
import { iconStroke } from '../src/theme/categoryIcons'
import { useT } from '../src/i18n'

export default function ContactScreen() {
  const t = useT()
  return (
    <ScreenErrorBoundary name="contact">
      <Stack.Screen options={{ title: t('contact.title'), headerShown: false }} />
      <ContactBody />
    </ScreenErrorBoundary>
  )
}

function ContactBody() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const contactUrl = getContactPageUrl()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const t = useT()

  // Opened directly (deep link / refresh) there is no history: fall back home.
  const onBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/')
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 0) + space.sm }]}
      testID="contact-screen"
    >
      <View style={styles.column}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.goBack')}
            hitSlop={4}
            style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
          >
            <ArrowLeft size={22} strokeWidth={iconStroke} color={colors.text} />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {t('contact.title')}
          </Text>
        </View>
        <Card>
          <View style={styles.body}>
            <Text style={styles.label}>{t('contact.developer')}</Text>
            <Text style={styles.value}>{DEVELOPER_NAME}</Text>

            <Text style={[styles.label, styles.gap]}>{t('contact.email')}</Text>
            <Pressable
              onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
              accessibilityRole="link"
              accessibilityLabel={t('contact.emailA11y', { email: CONTACT_EMAIL })}
              style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
            >
              <Mail size={18} strokeWidth={iconStroke} color={colors.accent} />
              <Text style={styles.actionText}>{CONTACT_EMAIL}</Text>
            </Pressable>
            <Text style={styles.note}>{t('contact.emailNote')}</Text>

            <Text style={[styles.label, styles.gap]}>{t('contact.website')}</Text>
            <Pressable
              onPress={() => void Linking.openURL(contactUrl)}
              accessibilityRole="link"
              accessibilityLabel={t('contact.websiteA11y')}
              style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
            >
              <Globe size={18} strokeWidth={iconStroke} color={colors.accent} />
              <Text style={styles.actionText}>{contactUrl.replace(/^https?:\/\//, '')}</Text>
            </Pressable>
          </View>
        </Card>
        <Card style={styles.cardGap}>
          <View style={styles.body}>
            <Text style={styles.label}>{t('contact.aboutContent')}</Text>
            <Text style={styles.note}>{t('contact.aboutContentBody')}</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    content: {
      padding: space.screen,
      paddingBottom: space.xl,
      backgroundColor: c.background,
      flexGrow: 1,
    },
    // Fix 8: cap the reading column at 720 and centre it on wide screens.
    column: { width: '100%', maxWidth: 720, alignSelf: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      marginBottom: space.md,
      marginLeft: -space.xs,
    },
    back: {
      width: HIT_TARGET,
      height: HIT_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: HIT_TARGET / 2,
    },
    title: {
      color: c.text,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
    },
    body: { padding: space.lg },
    cardGap: { marginTop: space.md },
    label: {
      color: c.textMuted,
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      fontWeight: '700',
    },
    value: {
      color: c.text,
      fontSize: typography.bodySemibold.fontSize,
      lineHeight: typography.bodySemibold.lineHeight,
      fontWeight: '700',
    },
    gap: { marginTop: space.md },
    note: {
      color: c.textSecondary,
      fontSize: typography.summary.fontSize,
      lineHeight: typography.summary.lineHeight,
      marginTop: space.xs,
    },
    action: {
      minHeight: HIT_TARGET,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      paddingHorizontal: space.sm,
      borderRadius: 12,
      backgroundColor: c.surfaceRaised,
      marginTop: space.xs,
    },
    pressed: { opacity: 0.82 },
    actionText: {
      color: c.accent,
      fontSize: typography.bodySemibold.fontSize,
      lineHeight: typography.bodySemibold.lineHeight,
      fontWeight: '700',
    },
  })
}
