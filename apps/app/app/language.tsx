import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { MotiView } from 'moti'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Check from 'lucide-react-native/icons/check'
import ArrowRight from 'lucide-react-native/icons/arrow-right'
import { BrandMark } from '../src/components/BrandMark'
import { NewsStartBackdrop } from '../src/components/onboarding/NewsStartBackdrop'
import { useLanguagePreference } from '../src/preferences/LanguagePreferenceContext'
import { useTheme } from '../src/preferences/ThemePreferenceContext'
import { READING_LANGUAGES, type ReadingLanguageCode } from '../src/storage/languagePreference'
import { HIT_TARGET, radius, space, type AppColors } from '../src/theme/tokens'

const LANGUAGE_COPY: Record<
  ReadingLanguageCode,
  { hint: string; sample: string; accentLabel: string }
> = {
  en: {
    hint: 'News in English',
    sample: "Today's brief for your city",
    accentLabel: 'EN',
  },
  hi: {
    hint: 'समाचार हिंदी में',
    sample: 'आपके शहर की ताज़ा खबर',
    accentLabel: 'हिं',
  },
}

export default function LanguageScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, shadows } = useTheme()
  const { preferredLanguage, setPreferredLanguage } = useLanguagePreference()
  const styles = useMemo(() => createStyles(colors), [colors])

  const choose = (code: ReadingLanguageCode) => {
    setPreferredLanguage(code)
    // Language is the only required first-run step; city defaults to All India.
    router.replace('/(tabs)')
  }

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <NewsStartBackdrop />

      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, translateY: 18, scale: 0.94 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 520 }}
          style={styles.hero}
        >
          <View style={styles.markWrap}>
            <MotiView
              from={{ opacity: 0.7, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 900 }}
            >
              <BrandMark size={72} />
            </MotiView>
            <MotiView
              from={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 480, delay: 280 }}
              style={styles.liveBadge}
            >
              <MotiView
                from={{ opacity: 0.35 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 900, loop: true }}
                style={styles.liveDot}
              />
              <Text style={styles.liveText}>LIVE</Text>
            </MotiView>
          </View>

          <Text style={styles.brand}>Khabro</Text>
          <Text style={styles.tagline}>ताज़ा खबर, आपके शहर की</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 480, delay: 180 }}
          style={styles.copyBlock}
        >
          <Text style={styles.eyebrow}>START YOUR BRIEF</Text>
          <Text style={styles.title}>How do you want to read the news?</Text>
          <Text style={styles.subtitle}>Pick once — change anytime from your profile.</Text>
        </MotiView>

        <View style={styles.options}>
          {READING_LANGUAGES.map((language, index) => {
            const selected = language.code === preferredLanguage
            const copy = LANGUAGE_COPY[language.code]
            return (
              <MotiView
                key={language.code}
                from={{ opacity: 0, translateY: 22 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 420, delay: 280 + index * 90 }}
              >
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={language.accessibilityLabel}
                  onPress={() => choose(language.code)}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    shadows.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.langChip, selected && styles.langChipSelected]}>
                    <Text style={[styles.langChipText, selected && styles.langChipTextSelected]}>
                      {copy.accentLabel}
                    </Text>
                  </View>

                  <View style={styles.optionBody}>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {language.label}
                    </Text>
                    <Text style={[styles.optionHint, selected && styles.optionHintSelected]}>
                      {copy.hint}
                    </Text>
                    <Text
                      style={[styles.optionSample, selected && styles.optionSampleSelected]}
                      numberOfLines={1}
                    >
                      {copy.sample}
                    </Text>
                  </View>

                  <View style={[styles.optionAction, selected && styles.optionActionSelected]}>
                    {selected ? (
                      <Check size={20} color={colors.accentFill} strokeWidth={2.5} />
                    ) : (
                      <ArrowRight size={18} color={colors.textMuted} strokeWidth={2.25} />
                    )}
                  </View>
                </Pressable>
              </MotiView>
            )
          })}
        </View>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 520 }}
          style={styles.footer}
        >
          <View style={styles.footerRule} />
          <Text style={styles.footerText}>Local stories · Clear language · Fresh every day</Text>
        </MotiView>
      </View>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: space.xl,
    },
    content: {
      flex: 1,
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
      justifyContent: 'center',
    },
    hero: {
      marginBottom: space.xxl,
    },
    markWrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space.sm,
      marginBottom: space.md,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255, 176, 0, 0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255, 176, 0, 0.45)',
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#FFB000',
    },
    liveText: {
      color: c.text,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
    },
    brand: {
      color: c.text,
      fontSize: 40,
      lineHeight: 44,
      fontWeight: '800',
      letterSpacing: -1.2,
    },
    tagline: {
      marginTop: 6,
      color: c.accent,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600',
    },
    copyBlock: {
      marginBottom: space.xl,
    },
    eyebrow: {
      color: c.accent,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.6,
      marginBottom: 10,
    },
    title: {
      color: c.text,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800',
      letterSpacing: -0.6,
      marginBottom: 8,
      maxWidth: 340,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      maxWidth: 360,
    },
    options: {
      gap: 14,
    },
    option: {
      minHeight: HIT_TARGET + 52,
      borderRadius: radius.xl,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    optionSelected: {
      borderColor: c.accentFill,
      backgroundColor: c.accentSoft,
    },
    langChip: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceRaised,
      borderWidth: 1,
      borderColor: c.border,
    },
    langChipSelected: {
      backgroundColor: c.accentFill,
      borderColor: c.accentFill,
    },
    langChipText: {
      color: c.text,
      fontSize: 15,
      fontWeight: '800',
    },
    langChipTextSelected: {
      color: c.textOnAccent,
    },
    optionBody: {
      flex: 1,
      minWidth: 0,
    },
    optionLabel: {
      color: c.text,
      fontSize: 21,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    optionLabelSelected: {
      color: c.text,
    },
    optionHint: {
      color: c.textMuted,
      fontSize: 14,
      marginTop: 2,
    },
    optionHintSelected: {
      color: c.textSecondary,
    },
    optionSample: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 6,
      fontWeight: '500',
    },
    optionSampleSelected: {
      color: c.accent,
    },
    optionAction: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceRaised,
    },
    optionActionSelected: {
      backgroundColor: c.surface,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.985 }],
    },
    footer: {
      marginTop: space.xxl,
      alignItems: 'center',
      gap: 12,
    },
    footerRule: {
      width: 36,
      height: 3,
      borderRadius: 2,
      backgroundColor: '#FFB000',
      opacity: 0.7,
    },
    footerText: {
      color: c.textMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
      textAlign: 'center',
    },
  })
}
