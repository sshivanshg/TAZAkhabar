import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@gluestack-ui/themed'
import MapPin from 'lucide-react-native/icons/map-pin'
import Search from 'lucide-react-native/icons/search'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import {
  READING_LANGUAGES,
  type ReadingLanguageCode,
} from '../storage/languagePreference'

type Props = {
  cityTitle?: string
  onCityPress: () => void
  onSearchPress: () => void
  includeSafeArea?: boolean
  readingLanguage?: ReadingLanguageCode
  onSelectLanguage?: (code: ReadingLanguageCode) => void
}

/** Home top bar — search | brand | city (Google News–inspired chrome). */
export function HomeTopBar({
  cityTitle,
  onCityPress,
  onSearchPress,
  includeSafeArea = true,
  readingLanguage,
  onSelectLanguage,
}: Props) {
  const insets = useSafeAreaInsets()
  const paddingTop = includeSafeArea ? Math.max(insets.top, space.xxs) : space.xxs
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={[styles.bar, { paddingTop }]}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onSearchPress}
          accessibilityRole="button"
          accessibilityLabel="Search and discover"
          hitSlop={8}
          style={({ pressed }) => [styles.iconHit, pressed ? styles.pressed : null]}
        >
          <Search size={22} strokeWidth={iconStroke} color={colors.text} />
        </Pressable>

        <View style={styles.center} accessibilityRole="header">
          <Text
            fontSize={typography.headlineSm.fontSize}
            lineHeight={typography.headlineSm.lineHeight}
            fontWeight="$bold"
            color={colors.text}
            numberOfLines={1}
          >
            TazaKhabar
          </Text>
        </View>

        {cityTitle ? (
          <Pressable
            onPress={onCityPress}
            accessibilityRole="button"
            accessibilityLabel={`Change city, currently ${cityTitle}`}
            hitSlop={4}
            style={({ pressed }) => [styles.cityHit, pressed ? styles.pressed : null]}
          >
            <MapPin size={14} strokeWidth={iconStroke} color={colors.accent} />
            <Text
              fontSize={typography.label.fontSize}
              lineHeight={typography.label.lineHeight}
              fontWeight="$semibold"
              color={colors.accent}
              numberOfLines={1}
            >
              {cityTitle}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.iconHit} />
        )}
      </View>

      {onSelectLanguage ? (
        <View style={styles.langRow}>
          {READING_LANGUAGES.map((lang) => {
            const selected = readingLanguage === lang.code
            return (
              <Pressable
                key={lang.code}
                onPress={() => onSelectLanguage(lang.code)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Prefer ${lang.accessibilityLabel}`}
                style={[styles.langChip, selected ? styles.langChipSelected : null]}
              >
                <Text
                  fontSize={typography.label.fontSize}
                  fontWeight="$semibold"
                  color={selected ? colors.chipSelectedText : colors.chipInactiveText}
                >
                  {lang.code === 'en' ? 'EN' : 'हि'}
                </Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    bar: {
      minHeight: HIT_TARGET,
      paddingBottom: space.xs,
      paddingHorizontal: space.screen,
      gap: space.xs,
      backgroundColor: c.background,
      flexGrow: 0,
      flexShrink: 0,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.sm,
    },
    iconHit: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cityHit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      maxWidth: 120,
      minHeight: 40,
      paddingHorizontal: 4,
    },
    langRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    langChip: {
      minWidth: 38,
      minHeight: 30,
      paddingHorizontal: 10,
      borderRadius: radius.full,
      backgroundColor: c.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    langChipSelected: {
      backgroundColor: c.accentFill,
    },
    pressed: {
      opacity: 0.75,
    },
  })
}
