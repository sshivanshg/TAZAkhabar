import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@gluestack-ui/themed'
import MapPin from 'lucide-react-native/icons/map-pin'
import Search from 'lucide-react-native/icons/search'
import { colors, HIT_TARGET, radius, space, typography } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import {
  READING_LANGUAGES,
  type ReadingLanguageCode,
} from '../storage/languagePreference'

type Props = {
  cityTitle?: string
  onCityPress: () => void
  onSearchPress: () => void
  /** When false, skip notch padding (parent already applied it, e.g. A2HS banner). */
  includeSafeArea?: boolean
  readingLanguage?: ReadingLanguageCode
  onSelectLanguage?: (code: ReadingLanguageCode) => void
}

/** Home top bar — compact editorial brand, city, language, and search. */
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

  return (
    <View style={[styles.bar, { paddingTop }]}>
      <View style={styles.topRow}>
        <View style={styles.left} accessibilityRole="header">
          <Text
            fontSize={typography.section.fontSize}
            lineHeight={typography.section.lineHeight}
            fontWeight="$bold"
            color={colors.text}
            numberOfLines={1}
          >
            NewsFeed
          </Text>
          <Text
            fontSize={typography.label.fontSize}
            lineHeight={typography.label.lineHeight}
            color={colors.textSecondary}
            numberOfLines={1}
          >
            Local stories, clearly ordered
          </Text>
          {cityTitle ? (
            <Pressable
              onPress={onCityPress}
              accessibilityRole="button"
              accessibilityLabel={`Change city, currently ${cityTitle}`}
              hitSlop={4}
              style={({ pressed }) => [styles.cityPill, pressed ? styles.pressed : null]}
            >
              <MapPin size={12} strokeWidth={iconStroke} color={colors.accent} />
              <Text
                fontSize={typography.label.fontSize}
                lineHeight={typography.label.lineHeight}
                fontWeight="$medium"
                color={colors.accent}
                numberOfLines={1}
              >
                {cityTitle}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={onSearchPress}
          accessibilityRole="button"
          accessibilityLabel="Search and discover"
          hitSlop={8}
          style={({ pressed }) => [styles.searchHit, pressed ? styles.pressed : null]}
        >
          <Search size={18} strokeWidth={iconStroke} color={colors.text} />
        </Pressable>
      </View>

      {onSelectLanguage ? (
        <View style={styles.bottomRow}>
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
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    minHeight: HIT_TARGET,
    paddingBottom: space.xs,
    paddingHorizontal: space.screen,
    gap: space.xs,
    backgroundColor: colors.background,
    flexGrow: 0,
    flexShrink: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  langRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  langChip: {
    minWidth: 38,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    minHeight: 32,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    maxWidth: '100%',
  },
  searchHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.85,
  },
})
