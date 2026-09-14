import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Check from 'lucide-react-native/icons/check'
import { useLanguagePreference } from '../src/preferences/LanguagePreferenceContext'
import { READING_LANGUAGES, type ReadingLanguageCode } from '../src/storage/languagePreference'
import { useTheme } from '../src/preferences/ThemePreferenceContext'

export default function LanguageScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { preferredLanguage, setPreferredLanguage } = useLanguagePreference()
  const styles = useMemo(() => createStyles(colors), [colors])

  const choose = (code: ReadingLanguageCode) => {
    setPreferredLanguage(code)
    router.replace('/city')
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.brand}>Khabro</Text>
        <Text style={styles.eyebrow}>WELCOME</Text>
        <Text style={styles.title}>Choose your reading language</Text>
        <Text style={styles.subtitle}>You can change this anytime from your profile.</Text>

        <View style={styles.options}>
          {READING_LANGUAGES.map((language) => {
            const selected = language.code === preferredLanguage
            return (
              <Pressable
                key={language.code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={language.accessibilityLabel}
                onPress={() => choose(language.code)}
                style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
              >
                <View>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{language.label}</Text>
                  <Text style={styles.optionHint}>{language.code === 'hi' ? 'समाचार हिंदी में' : 'News in English'}</Text>
                </View>
                {selected ? <Check size={22} color={colors.textOnAccent} strokeWidth={2.5} /> : null}
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

function createStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background, justifyContent: 'center', padding: 24 },
    content: { width: '100%', maxWidth: 520, alignSelf: 'center' },
    brand: { color: c.accent, fontSize: 20, fontWeight: '800', marginBottom: 56 },
    eyebrow: { color: c.accent, fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
    title: { color: c.text, fontSize: 32, lineHeight: 40, fontWeight: '800', marginBottom: 10 },
    subtitle: { color: c.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 30 },
    options: { gap: 14 },
    option: { minHeight: 82, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    optionSelected: { backgroundColor: c.accentFill, borderColor: c.accentFill },
    optionLabel: { color: c.text, fontSize: 21, fontWeight: '700' },
    optionLabelSelected: { color: c.textOnAccent },
    optionHint: { color: c.textMuted, fontSize: 14, marginTop: 3 },
    pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  })
}
