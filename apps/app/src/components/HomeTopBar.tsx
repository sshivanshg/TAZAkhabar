import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@gluestack-ui/themed'
import { MapPin, Search } from 'lucide-react-native'
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

/** Home top bar — brand + city pill left, language + search right. */
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
        {cityTitle ? (
          <Pressable
            onPress={onCityPress}
            accessibilityRole="button"
            accessibilityLabel={`Change city, currently ${cityTitle}`}
            hitSlop={4}
            style={({ pressed }) => [styles.cityPill, pressed ? styles.cityPressed : null]}
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

      <View style={styles.right}>
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
                  accessibilityLabel={`Prefer ${lang.label}`}
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
        <Pressable
          onPress={onSearchPress}
          accessibilityRole="button"
          accessibilityLabel="Search and discover"
          hitSlop={8}
          style={({ pressed }) => [styles.searchHit, pressed ? styles.searchPressed : null]}
        >
          <View style={styles.searchCircle}>
            <Search size={18} strokeWidth={iconStroke} color={colors.text} />
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    minHeight: HIT_TARGET,
    paddingBottom: space.xs,
    paddingHorizontal: space.screen,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    flexGrow: 0,
    flexShrink: 0,
    gap: space.sm,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: space.xxs + 2,
    paddingTop: space.xxs,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingTop: space.xxs,
  },
  langRow: {
    flexDirection: 'row',
    gap: 6,
  },
  langChip: {
    minWidth: 36,
    minHeight: 32,
    paddingHorizontal: 8,
    borderRadius: radius.full,
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
    paddingHorizontal: space.xs + 2,
    paddingVertical: space.xxs + 2,
    minHeight: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    maxWidth: '100%',
  },
  cityPressed: {
    opacity: 0.85,
  },
  searchHit: {
    width: HIT_TARGET,
    height: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchPressed: {
    opacity: 0.85,
  },
})
