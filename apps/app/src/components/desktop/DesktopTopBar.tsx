import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type PressableStateCallbackType,
  type TextInputKeyPressEventData,
} from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useRouter } from 'expo-router'
import { MapPin, Search } from 'lucide-react-native'
import { MotiView } from 'moti'
import { iconStroke } from '../../theme/categoryIcons'
import { colors, HIT_TARGET, radius, space, typography } from '../../theme/tokens'

type Props = {
  cityTitle?: string
  onCityPress: () => void
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

const SEARCH_EXPANDED_WIDTH = 280

/** Desktop home header — city pill + search that expands inline into Discover. */
export function DesktopTopBar({ cityTitle, onCityPress }: Props) {
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')

  const expand = useCallback(() => {
    setExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    setQuery('')
    setExpanded(false)
  }, [])

  useEffect(() => {
    if (!expanded) {
      return
    }
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [expanded])

  useEffect(() => {
    if (!expanded || Platform.OS !== 'web' || typeof window === 'undefined') {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        collapse()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expanded, collapse])

  const submit = useCallback(() => {
    const trimmed = query.trim()
    router.push({
      pathname: '/(tabs)/search',
      params: { q: trimmed, from: 'home' },
    })
  }, [query, router])

  const onBlur = useCallback(() => {
    if (query.trim().length === 0) {
      setExpanded(false)
    }
  }, [query])

  const onKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (event.nativeEvent.key === 'Escape') {
        collapse()
      }
    },
    [collapse],
  )

  return (
    <View style={styles.bar}>
      <View style={styles.left} accessibilityRole="header">
        {cityTitle ? (
          <Pressable
            onPress={onCityPress}
            accessibilityRole="button"
            accessibilityLabel={`Change city, currently ${cityTitle}`}
            hitSlop={4}
            style={(state) => {
              const { pressed, hovered, focused } = state as WebPressableState
              return [
                styles.cityPill,
                hovered ? styles.cityHover : null,
                pressed ? styles.cityPressed : null,
                focused ? styles.focusRing : null,
              ]
            }}
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

      <MotiView
        animate={{ width: expanded ? SEARCH_EXPANDED_WIDTH : HIT_TARGET }}
        transition={{ type: 'timing', duration: 200 }}
        style={styles.searchMotion}
      >
        {expanded ? (
          <View style={styles.searchField}>
            <Search size={18} strokeWidth={iconStroke} color={colors.text} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={submit}
              onBlur={onBlur}
              onKeyPress={onKeyPress}
              placeholder="Search"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Search headlines"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              style={styles.input}
            />
          </View>
        ) : (
          <Pressable
            onPress={expand}
            accessibilityRole="button"
            accessibilityLabel="Search and discover"
            hitSlop={8}
            style={(state) => {
              const { pressed, hovered, focused } = state as WebPressableState
              return [
                styles.searchHit,
                hovered ? styles.searchHover : null,
                pressed ? styles.searchPressed : null,
                focused ? styles.focusRing : null,
              ]
            }}
          >
            <View style={styles.searchCircle}>
              <Search size={18} strokeWidth={iconStroke} color={colors.text} />
            </View>
          </Pressable>
        )}
      </MotiView>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    minHeight: HIT_TARGET,
    paddingBottom: space.xs,
    paddingHorizontal: space.screen,
    flexDirection: 'row',
    alignItems: 'center',
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
  cityHover: {
    opacity: 0.92,
  },
  cityPressed: {
    opacity: 0.85,
  },
  searchMotion: {
    height: HIT_TARGET,
    overflow: 'hidden',
    alignItems: 'flex-end',
    justifyContent: 'center',
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
  searchHover: {
    opacity: 0.92,
  },
  searchPressed: {
    opacity: 0.85,
  },
  searchField: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    paddingVertical: 0,
    height: 40,
  },
  focusRing: {
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'solid' as const,
          outlineWidth: 2,
          outlineColor: colors.accent,
          outlineOffset: 2,
        }
      : {
          borderWidth: 2,
          borderColor: colors.accent,
        }),
  },
})
