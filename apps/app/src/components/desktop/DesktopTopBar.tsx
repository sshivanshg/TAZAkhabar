import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
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

/** Collapsed control is a circle — same size as the previous searchCircle. */
const SEARCH_COLLAPSED_WIDTH = 36
/** Fixed expanded width; grows left from the right-aligned icon, does not reflow the rail. */
const SEARCH_EXPANDED_WIDTH = 340
const MOTION_MS = 200

/** Desktop home header — city pill + morphing search. */
export function DesktopTopBar({ cityTitle, onCityPress }: Props) {
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)
  const { width: windowWidth } = useWindowDimensions()
  const prevWindowWidth = useRef(windowWidth)
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

  // RN Web UA :focus-visible draws a blue box on <input>; kill it for this control only.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return
    }
    const styleId = 'desktop-topbar-search-input-css'
    if (document.getElementById(styleId)) {
      return
    }
    const style = document.createElement('style')
    style.id = styleId
    style.textContent =
      '[data-desktop-search-input="1"]:focus,' +
      '[data-desktop-search-input="1"]:focus-visible{' +
      'outline:none!important;box-shadow:none!important;border:none!important;' +
      '}'
    document.head.appendChild(style)
  }, [])

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

  // Resize while expanded — collapse so we never leave an orphaned mid-width state.
  useEffect(() => {
    if (prevWindowWidth.current !== windowWidth && expanded) {
      collapse()
    }
    prevWindowWidth.current = windowWidth
  }, [windowWidth, expanded, collapse])

  const submit = useCallback(() => {
    const trimmed = query.trim()
    router.push({
      pathname: '/(tabs)/search',
      params: { q: trimmed, from: 'home' },
    })
  }, [query, router])

  const onBlur = useCallback(() => {
    if (query.trim().length === 0) {
      collapse()
    }
  }, [query, collapse])

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

      <View style={styles.rightCluster}>
        {/*
          One chrome surface: Moti grows width from circle → pill.
          Icon stays inside; input is clipped until width opens. Never two sibling controls.
        */}
        <MotiView
          animate={{ width: expanded ? SEARCH_EXPANDED_WIDTH : SEARCH_COLLAPSED_WIDTH }}
          transition={{ type: 'timing', duration: MOTION_MS }}
          style={styles.searchControl}
        >
          <View style={styles.searchRow}>
            {!expanded ? (
              <Pressable
                onPress={expand}
                accessibilityRole="button"
                accessibilityLabel="Search and discover"
                hitSlop={8}
                style={(state) => {
                  const { pressed, hovered, focused } = state as WebPressableState
                  return [
                    StyleSheet.absoluteFillObject,
                    hovered ? styles.searchHover : null,
                    pressed ? styles.searchPressed : null,
                    focused ? styles.focusRing : null,
                  ]
                }}
              />
            ) : null}
            <View style={styles.iconSlot} pointerEvents="none">
              <Search size={18} strokeWidth={iconStroke} color={colors.text} />
            </View>
            <MotiView
              animate={{ opacity: expanded ? 1 : 0 }}
              transition={{ type: 'timing', duration: MOTION_MS }}
              style={styles.inputWrap}
              pointerEvents={expanded ? 'auto' : 'none'}
            >
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={submit}
                onBlur={onBlur}
                onKeyPress={onKeyPress}
                editable={expanded}
                accessible={expanded}
                placeholder="Search"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Search headlines"
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                style={styles.input}
                {...(Platform.OS === 'web'
                  ? ({ dataSet: { desktopSearchInput: '1' } } as object)
                  : null)}
              />
            </MotiView>
          </View>
        </MotiView>
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
    minWidth: 0,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: space.sm,
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
  searchControl: {
    height: SEARCH_COLLAPSED_WIDTH,
    overflow: 'hidden',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexShrink: 0,
  },
  searchRow: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSlot: {
    width: SEARCH_COLLAPSED_WIDTH,
    height: SEARCH_COLLAPSED_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  searchHover: {
    opacity: 0.92,
  },
  searchPressed: {
    opacity: 0.85,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    justifyContent: 'center',
    paddingRight: space.sm + 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    paddingVertical: 0,
    margin: 0,
    height: SEARCH_COLLAPSED_WIDTH,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web'
      ? ({
          outline: 'none',
          outlineWidth: 0,
          outlineStyle: 'none',
          outlineColor: 'transparent',
          boxShadow: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
        } as object)
      : null),
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
