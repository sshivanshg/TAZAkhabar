import { useCallback, useMemo, useRef, useState } from 'react'
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
import Bookmark from 'lucide-react-native/icons/bookmark'
import MapPin from 'lucide-react-native/icons/map-pin'
import Search from 'lucide-react-native/icons/search'
import User from 'lucide-react-native/icons/user'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { iconStroke } from '../../theme/categoryIcons'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../../theme/tokens'
import {
  READING_LANGUAGES,
  type ReadingLanguageCode,
} from '../../storage/languagePreference'

type Props = {
  cityTitle?: string
  onCityPress: () => void
  readingLanguage?: ReadingLanguageCode
  onSelectLanguage?: (code: ReadingLanguageCode) => void
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

/** Google News–style top bar for tablet/desktop — logo, pill search, quick nav. */
export function ExpandedTopBar({
  cityTitle,
  onCityPress,
  readingLanguage,
  onSelectLanguage,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const { colors } = useTheme()
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
        <Text
          fontSize={typography.section.fontSize}
          lineHeight={typography.section.lineHeight}
          fontWeight="$bold"
          color={colors.text}
          accessibilityRole="header"
          numberOfLines={1}
          style={styles.logo}
        >
          TazaKhabar
        </Text>

        <View style={styles.searchWrap}>
          <Search size={18} strokeWidth={iconStroke} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            placeholder="Search for topics, locations & sources"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Search headlines"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.actions}>
          {cityTitle ? (
            <Pressable
              onPress={onCityPress}
              accessibilityRole="button"
              accessibilityLabel={`Change city, currently ${cityTitle}`}
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
            </Pressable>
          ) : null}

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

          <Pressable
            onPress={() => router.push('/(tabs)/bookmarks')}
            accessibilityRole="button"
            accessibilityLabel="Bookmarks"
            style={(state) => {
              const { pressed, hovered } = state as WebPressableState
              return [styles.iconBtn, hovered ? styles.hover : null, pressed ? styles.pressed : null]
            }}
          >
            <Bookmark size={20} strokeWidth={iconStroke} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
            style={(state) => {
              const { pressed, hovered } = state as WebPressableState
              return [styles.iconBtn, hovered ? styles.hover : null, pressed ? styles.pressed : null]
            }}
          >
            <User size={20} strokeWidth={iconStroke} color={colors.textSecondary} />
          </Pressable>
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
    logo: {
      flexShrink: 0,
      letterSpacing: -0.3,
    },
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      minHeight: 44,
      maxWidth: 640,
      alignSelf: 'center',
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
      minHeight: 32,
      borderRadius: radius.md,
      backgroundColor: c.accentSoft,
      maxWidth: 140,
    },
    langRow: {
      flexDirection: 'row',
      gap: 6,
    },
    langChip: {
      minWidth: 36,
      minHeight: 32,
      paddingHorizontal: 8,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    langChipSelected: {
      backgroundColor: c.accentFill,
      borderColor: c.accentFill,
    },
    iconBtn: {
      width: HIT_TARGET,
      height: HIT_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
    },
    hover: {
      backgroundColor: c.surfaceRaised,
    },
    pressed: {
      opacity: 0.85,
    },
  })
}
