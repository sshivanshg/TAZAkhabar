import { useMemo, type RefObject } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@gluestack-ui/themed'
import MapPin from 'lucide-react-native/icons/map-pin'
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import Search from 'lucide-react-native/icons/search'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { BrandHomeButton } from './BrandHomeButton'
import { ReadingLanguageToggle } from './ReadingLanguageToggle'
import type { ReadingLanguageCode } from '../storage/languagePreference'
import { useT } from '../i18n'

type Props = {
  cityTitle?: string
  onCityPress: () => void
  cityButtonRef?: RefObject<View | null>
  onSearchPress: () => void
  includeSafeArea?: boolean
  readingLanguage?: ReadingLanguageCode
  onSelectLanguage?: (code: ReadingLanguageCode) => void
}

/** Home top bar — search | brand mark | EN·हि | city pill (fills the rest) (Google News–inspired chrome). */
export function HomeTopBar({
  cityTitle,
  onCityPress,
  cityButtonRef,
  onSearchPress,
  includeSafeArea = true,
  readingLanguage,
  onSelectLanguage,
}: Props) {
  const insets = useSafeAreaInsets()
  const paddingTop = includeSafeArea ? Math.max(insets.top, space.xxs) : space.xxs
  const { colors } = useTheme()
  const t = useT()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={[styles.bar, { paddingTop }]}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onSearchPress}
          accessibilityRole="button"
          accessibilityLabel={t('common.searchAndDiscover')}
          hitSlop={8}
          style={({ pressed }) => [styles.iconHit, pressed ? styles.pressed : null]}
        >
          <Search size={22} strokeWidth={iconStroke} color={colors.text} />
        </Pressable>

        <View style={styles.center}>
          <BrandHomeButton size={30} />
        </View>

        <View style={styles.trailing}>
          {onSelectLanguage && readingLanguage ? (
            <ReadingLanguageToggle value={readingLanguage} onChange={onSelectLanguage} />
          ) : null}
          {cityTitle ? (
            <View ref={cityButtonRef} collapsable={false} style={styles.cityWrap}>
              <Pressable
                onPress={onCityPress}
                accessibilityRole="button"
                accessibilityLabel={t('common.changeCityCurrently', { city: cityTitle })}
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
                  ellipsizeMode="tail"
                  style={styles.cityText}
                >
                  {cityTitle}
                </Text>
                <ChevronDown size={14} strokeWidth={iconStroke} color={colors.accent} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.iconHit} />
          )}
        </View>
      </View>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    bar: {
      minHeight: HIT_TARGET,
      paddingBottom: space.xxs,
      paddingHorizontal: space.screen,
      backgroundColor: c.background,
      flexGrow: 0,
      flexShrink: 0,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: HIT_TARGET,
    },
    // Phone-first: brand is a fixed icon-size mark so the city pill gets the
    // remaining width (the city is the core of a local news app).
    center: {
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      justifyContent: 'flex-end',
      minWidth: 0,
      marginLeft: space.xs,
    },
    cityWrap: {
      flexShrink: 1,
      minWidth: 0,
    },
    cityText: {
      flexShrink: 1,
      minWidth: 0,
    },
    iconHit: {
      width: HIT_TARGET,
      height: HIT_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cityHit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 1,
      minWidth: 0,
      maxWidth: 220,
      minHeight: HIT_TARGET,
      paddingHorizontal: 10,
      borderRadius: radius.full,
      backgroundColor: c.accentSoft,
    },
    pressed: {
      opacity: 0.75,
    },
  })
}
