import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native'
import { MotiView } from 'moti'
import Check from 'lucide-react-native/icons/check'
import LocateFixed from 'lucide-react-native/icons/locate-fixed'
import Search from 'lucide-react-native/icons/search'
import type { CityResponse } from '@tazakhabar/shared-types'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { getShadows, radius, space, type AppColors } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { filterCities } from './CitySearch'

export type CityPickerAnchor = {
  x: number
  y: number
  width: number
  height: number
}

type Props = {
  visible: boolean
  anchor: CityPickerAnchor | null
  cities: CityResponse[]
  loading?: boolean
  error?: string | null
  selectedSlug?: string | null
  savingSlug?: string | null
  onSelect: (city: CityResponse) => void
  onDetectLocation?: () => void
  detectingLocation?: boolean
  locationMessage?: string | null
  onClose: () => void
  sheet?: boolean
}

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
}

const MENU_WIDTH = 260
const VIEWPORT_PAD = 10
const ANCHOR_GAP = 6
const MOTION_MS = 160
const PANEL_MAX_HEIGHT = 340

export function captureCityButtonAnchor(
  node: View | null,
  onAnchor: (anchor: CityPickerAnchor | null) => void,
): void {
  if (node == null || typeof node.measureInWindow !== 'function') {
    onAnchor(null)
    return
  }
  node.measureInWindow((x, y, width, height) => {
    onAnchor({ x, y, width, height })
  })
}

function popoverPosition(
  anchor: CityPickerAnchor,
  viewport: { width: number; height: number },
  panelHeight: number,
): { top: number; left: number } {
  let left = anchor.x + anchor.width - MENU_WIDTH
  let top = anchor.y + anchor.height + ANCHOR_GAP
  const maxLeft = Math.max(VIEWPORT_PAD, viewport.width - MENU_WIDTH - VIEWPORT_PAD)
  left = Math.min(Math.max(VIEWPORT_PAD, left), maxLeft)
  if (top + panelHeight > viewport.height - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, anchor.y - panelHeight - ANCHOR_GAP)
  }
  return { top, left }
}

function cityLine(city: CityResponse): string {
  const name = city.name?.trim() || 'Unknown city'
  const state = city.state?.trim()
  return state ? `${name}, ${state}` : name
}

/** Minimal floating city menu — search, optional location, compact list. */
export function CityPickerDropdown({
  visible,
  anchor,
  cities,
  loading = false,
  error = null,
  selectedSlug,
  savingSlug,
  onSelect,
  onDetectLocation,
  detectingLocation = false,
  locationMessage = null,
  onClose,
  sheet = false,
}: Props) {
  const viewport = useWindowDimensions()
  const effectiveSheet = sheet || anchor == null
  const open = visible && (effectiveSheet || anchor != null)
  const [query, setQuery] = useState('')
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const { colors, shadows } = useTheme()
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows])

  const matches = useMemo(() => filterCities(cities, query), [cities, query])

  const close = useCallback(() => {
    onClose()
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => returnFocusRef.current?.focus())
    }
  }, [onClose])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return
    }
    const active = document.activeElement
    returnFocusRef.current =
      active && typeof (active as HTMLElement).focus === 'function'
        ? (active as HTMLElement)
        : null
  }, [open])

  useEffect(() => {
    if (
      !open ||
      typeof window === 'undefined' ||
      typeof window.addEventListener !== 'function'
    ) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', onKeyDown)
      }
    }
  }, [close, open])

  const panelHeight = Math.min(PANEL_MAX_HEIGHT, viewport.height * 0.62)
  const pos = !effectiveSheet && anchor ? popoverPosition(anchor, viewport, panelHeight) : null

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={close}>
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          focusable={false}
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Dismiss city picker"
        >
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ type: 'timing', duration: MOTION_MS }}
            style={styles.scrim}
          />
        </Pressable>

        <MotiView
          from={effectiveSheet ? { opacity: 0, translateY: 16 } : { opacity: 0 }}
          animate={
            open
              ? effectiveSheet
                ? { opacity: 1, translateY: 0 }
                : { opacity: 1 }
              : effectiveSheet
                ? { opacity: 0, translateY: 16 }
                : { opacity: 0 }
          }
          transition={{ type: 'timing', duration: MOTION_MS }}
          style={[
            styles.panel,
            effectiveSheet
              ? [styles.panelSheet, { maxHeight: panelHeight }]
              : pos
                ? [styles.panelPopover, { top: pos.top, left: pos.left, maxHeight: panelHeight }]
                : null,
          ]}
        >
          <View style={styles.searchRow}>
            <Search size={16} strokeWidth={iconStroke} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search city"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Search cities"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              style={styles.searchInput}
            />
          </View>

          {onDetectLocation ? (
            <Pressable
              onPress={onDetectLocation}
              disabled={detectingLocation}
              accessibilityRole="button"
              accessibilityLabel="Use current location"
              style={(pressState) => {
                const { pressed, hovered } = pressState as WebPressableState
                return [
                  styles.locateRow,
                  hovered ? styles.rowHover : null,
                  pressed ? styles.rowPressed : null,
                ]
              }}
            >
              {detectingLocation ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <LocateFixed size={14} strokeWidth={iconStroke} color={colors.accent} />
              )}
              <Text style={styles.locateText}>Use current location</Text>
            </Pressable>
          ) : null}

          {locationMessage ? <Text style={styles.locationMessage}>{locationMessage}</Text> : null}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} size="small" />
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : matches.length === 0 ? (
              <Text style={styles.emptyText}>No matches</Text>
            ) : (
              matches.map((city, index) => {
                const slug = city.slug ?? ''
                const selected = Boolean(selectedSlug && slug === selectedSlug)
                const saving = Boolean(savingSlug && slug === savingSlug)
                return (
                  <Pressable
                    key={slug || `${cityLine(city)}-${index}`}
                    onPress={() => onSelect(city)}
                    disabled={saving || !slug}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected }}
                    accessibilityLabel={cityLine(city)}
                    style={(pressState) => {
                      const { pressed, hovered } = pressState as WebPressableState
                      return [
                        styles.row,
                        selected ? styles.rowSelected : null,
                        hovered && !selected ? styles.rowHover : null,
                        pressed ? styles.rowPressed : null,
                      ]
                    }}
                  >
                    <Text
                      style={[styles.rowLabel, selected ? styles.rowLabelSelected : null]}
                      numberOfLines={1}
                    >
                      {cityLine(city)}
                    </Text>
                    {saving ? (
                      <ActivityIndicator color={colors.accent} size="small" />
                    ) : selected ? (
                      <Check size={14} strokeWidth={2.4} color={colors.accent} />
                    ) : null}
                  </Pressable>
                )
              })
            )}
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  )
}

function createStyles(c: AppColors, shadows: ReturnType<typeof getShadows>) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    panel: {
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
      ...(shadows.card as ViewStyle),
    },
    panelPopover: {
      position: 'absolute',
      width: MENU_WIDTH,
      borderRadius: radius.sm,
      paddingVertical: space.xxs,
    },
    panelSheet: {
      position: 'absolute',
      left: VIEWPORT_PAD,
      right: VIEWPORT_PAD,
      bottom: VIEWPORT_PAD,
      borderRadius: radius.md,
      paddingVertical: space.xxs,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      marginHorizontal: space.sm,
      marginTop: space.sm,
      marginBottom: space.xxs,
      paddingHorizontal: space.sm,
      minHeight: 36,
      borderRadius: radius.xs,
      backgroundColor: c.surfaceRaised,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      lineHeight: 20,
      color: c.text,
      paddingVertical: 0,
      minHeight: 36,
      ...(Platform.OS === 'web'
        ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
        : null),
    },
    locateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      minHeight: 36,
      paddingHorizontal: space.md,
    },
    locateText: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500',
      color: c.accent,
    },
    locationMessage: {
      fontSize: 12,
      lineHeight: 16,
      color: c.textMuted,
      paddingHorizontal: space.md,
      paddingBottom: space.xxs,
    },
    list: {
      flexGrow: 0,
    },
    listContent: {
      paddingBottom: space.xxs,
    },
    row: {
      minHeight: 36,
      paddingHorizontal: space.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    rowSelected: {
      backgroundColor: c.accentSoft,
    },
    rowHover: {
      backgroundColor: c.surfaceRaised,
    },
    rowPressed: {
      opacity: 0.9,
    },
    rowLabel: {
      flex: 1,
      fontSize: 14,
      lineHeight: 18,
      color: c.text,
    },
    rowLabelSelected: {
      fontWeight: '600',
      color: c.accent,
    },
    centered: {
      alignItems: 'center',
      paddingVertical: space.lg,
    },
    emptyText: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: space.lg,
    },
    errorText: {
      fontSize: 13,
      lineHeight: 18,
      color: c.destructive,
      textAlign: 'center',
      paddingVertical: space.lg,
      paddingHorizontal: space.md,
    },
  })
}
