import { useMemo } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Stack } from 'expo-router'
import { Text } from '@gluestack-ui/themed'
import Mail from 'lucide-react-native/icons/mail'
import Globe from 'lucide-react-native/icons/globe'
import { Card } from '../src/components/ui/Card'
import { ScreenErrorBoundary } from '../src/components/ScreenErrorBoundary'
import { useTheme } from '../src/preferences/ThemePreferenceContext'
import { CONTACT_EMAIL, DEVELOPER_NAME, getContactPageUrl } from '../src/config/contact'
import { HIT_TARGET, space, typography, type AppColors } from '../src/theme/tokens'
import { iconStroke } from '../src/theme/categoryIcons'

export default function ContactScreen() {
  return (
    <ScreenErrorBoundary name="contact">
      <Stack.Screen options={{ title: 'Contact us', headerShown: true }} />
      <ContactBody />
    </ScreenErrorBoundary>
  )
}

function ContactBody() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const contactUrl = getContactPageUrl()

  return (
    <ScrollView contentContainerStyle={styles.content} testID="contact-screen">
      <Text style={styles.kicker}>CONTACT US</Text>
      <Text style={styles.title} accessibilityRole="header">Contact Khabro</Text>
      <Card>
        <View style={styles.body}>
          <Text style={styles.label}>Developer / publisher</Text>
          <Text style={styles.value}>{DEVELOPER_NAME}</Text>

          <Text style={[styles.label, styles.gap]}>Email</Text>
          <Pressable
            onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            accessibilityRole="link"
            accessibilityLabel={`Email Khabro at ${CONTACT_EMAIL}`}
            style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
          >
            <Mail size={18} strokeWidth={iconStroke} color={colors.accent} />
            <Text style={styles.actionText}>{CONTACT_EMAIL}</Text>
          </Pressable>
          <Text style={styles.note}>
            For app support, privacy questions, publisher requests, corrections, or takedown
            requests.
          </Text>

          <Text style={[styles.label, styles.gap]}>Website</Text>
          <Pressable
            onPress={() => void Linking.openURL(contactUrl)}
            accessibilityRole="link"
            accessibilityLabel="Open the Khabro website contact page"
            style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
          >
            <Globe size={18} strokeWidth={iconStroke} color={colors.accent} />
            <Text style={styles.actionText}>{contactUrl.replace(/^https?:\/\//, '')}</Text>
          </Pressable>
        </View>
      </Card>
      <Card style={styles.cardGap}>
        <View style={styles.body}>
          <Text style={styles.label}>About our content</Text>
          <Text style={styles.note}>
            Khabro is a news aggregator. Articles belong to their original publishers; every story
            shows its source and links to the original article.
          </Text>
        </View>
      </Card>
    </ScrollView>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    content: { padding: space.lg, paddingBottom: space.xl, backgroundColor: c.background, flexGrow: 1 },
    kicker: { color: c.accent, fontSize: 12, lineHeight: 18, fontWeight: '800', letterSpacing: 1.4 },
    title: { color: c.text, fontSize: 24, lineHeight: 30, fontWeight: '700', marginBottom: space.md },
    body: { padding: space.lg },
    cardGap: { marginTop: space.md },
    label: { color: c.textMuted, fontSize: typography.meta.fontSize, lineHeight: typography.meta.lineHeight, fontWeight: '700' },
    value: { color: c.text, fontSize: typography.bodySemibold.fontSize, lineHeight: typography.bodySemibold.lineHeight, fontWeight: '700' },
    gap: { marginTop: space.md },
    note: { color: c.textSecondary, fontSize: typography.summary.fontSize, lineHeight: typography.summary.lineHeight, marginTop: space.xs },
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
    actionText: { color: c.accent, fontSize: typography.bodySemibold.fontSize, lineHeight: typography.bodySemibold.lineHeight, fontWeight: '700' },
  })
}
