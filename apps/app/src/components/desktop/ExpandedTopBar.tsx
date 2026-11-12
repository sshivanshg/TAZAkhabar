import { useCallback, useMemo, useRef, useState, type RefObject } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type PressableStateCallbackType,
} from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useRouter } from 'expo-router'
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import MapPin from 'lucide-react-native/icons/map-pin'
import Search from 'lucide-react-native/icons/search'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { iconStroke } from '../../theme/categoryIcons'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../../theme/tokens'
import { ReadingLanguageToggle } from '../ReadingLanguageToggle'
import type { ReadingLanguageCode } from '../../storage/languagePreference'
import { useT } from '../../i18n'

type Props = {
  cityTitle?: string
  onCityPress: () => void
  cityButtonRef?: RefObject<View | null>
  readingLanguage?: ReadingLanguageCode
  onSelectLanguage?: (code: ReadingLanguageCode) => void
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

/**
 * Home-feed header inside the desktop shell: pill search, city, reading language.
 * Brand and Bookmarks/Profile live in the shared DesktopSidebar (AppShell).
 */
export function ExpandedTopBar({
  cityTitle,
  onCityPress,
  cityButtonRef,
  readingLanguage,
  onSelectLanguage,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const { colors } = useTheme()
  const t = useT()
  const styles = useMemo(() => createStyles(colors), [colors])

  const submit = useCallback(() => {
    router.push({
      pathname: '/(tabs)/search',
      params: { q: query.trim(), from: 'home' },
    })
  }, [query, router])

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: Math.max(insets.top, space.sm) },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.searchWrap}>
          <Search size={18} strokeWidth={iconStroke} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            placeholder={t('expandedTop.placeholder')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('common.searchHeadlines')}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.actions}>
          {cityTitle ? (
            <View ref={cityButtonRef} collapsable={false}>
              <Pressable
                onPress={onCityPress}
                accessibilityRole="button"
                accessibilityLabel={t('common.changeCityCurrently', { city: cityTitle })}
                style={(state) => {
                  const { pressed, hovered } = state as WebPressableState
                  return [
                    styles.cityPill,
                    hovered ? styles.hover : null,
                    pressed ? styles.pressed : null,
                  ]
                }}
              >
                <MapPin size={12} strokeWidth={iconStroke} color={colors.accent} />
                <Text
                  fontSize={typography.label.fontSize}
                  fontWeight="$medium"
                  color={colors.accent}
                  numberOfLines={1}
                >
                  {cityTitle}
                </Text>
                <ChevronDown size={14} strokeWidth={iconStroke} color={colors.accent} />
              </Pressable>
            </View>
          ) : null}

          {onSelectLanguage && readingLanguage ? (
            <ReadingLanguageToggle value={readingLanguage} onChange={onSelectLanguage} />
          ) : null}

        </View>
      </View>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    bar: {
      backgroundColor: c.background,
      paddingBottom: space.sm,
      paddingHorizontal: space.screen,
      flexGrow: 0,
      flexShrink: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: HIT_TARGET,
    },
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      minHeight: HIT_TARGET,
      maxWidth: 640,
      paddingHorizontal: space.md,
      borderRadius: radius.full,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    input: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      color: c.text,
      paddingVertical: 0,
      minHeight: 44,
      ...(Platform.OS === 'web'
        ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
        : null),
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      gap: space.xs,
    },
    cityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xxs,
      paddingHorizontal: space.sm,
      paddingVertical: 6,
      minHeight: HIT_TARGET,
      borderRadius: radius.md,
      backgroundColor: c.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.badgeSoftBorder,
      maxWidth: 160,
    },
    hover: {
      backgroundColor: c.surfaceRaised,
    },
    pressed: {
      opacity: 0.85,
    },
  })
}
