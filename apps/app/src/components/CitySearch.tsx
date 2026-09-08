import { useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import Search from 'lucide-react-native/icons/search'
import X from 'lucide-react-native/icons/x'
import type { CityResponse } from '@tazakhabar/shared-types'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, type AppColors } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'

type Props = {
  value: string
  onChange: (next: string) => void
  label?: string
  helperText?: string
}

export function filterCities(cities: CityResponse[], query: string): CityResponse[] {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return cities
  }
  return cities.filter((city) => {
    const name = (city.name ?? '').toLowerCase()
    const state = (city.state ?? '').toLowerCase()
    return name.includes(needle) || state.includes(needle)
  })
}

/** Live city/state filter field for the city picker. */
export function CitySearch({ value, onChange, label = 'Search by city or state', helperText }: Props) {
  const [focused, setFocused] = useState(false)
  const hasQuery = value.length > 0
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text fontSize={13} lineHeight={18} fontWeight="$semibold" color={colors.text}>
          {label}
        </Text>
        {helperText ? (
          <Text fontSize={12} lineHeight={16} color={colors.textMuted}>
            {helperText}
          </Text>
        ) : null}
      </View>
      <View style={[styles.field, focused ? styles.fieldFocused : null]}>
        <View style={styles.iconSlot}>
          <Search
            size={20}
            strokeWidth={iconStroke}
            color={focused ? colors.accent : colors.textMuted}
          />
        </View>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search cities"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search cities"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
          underlineColorAndroid="transparent"
          style={styles.input}
        />
        {hasQuery ? (
          <Pressable
            onPress={() => onChange('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            style={({ pressed }) => [styles.clear, pressed ? styles.clearPressed : null]}
          >
            <X size={18} strokeWidth={iconStroke} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      gap: space.xs,
    },
    labelRow: {
      gap: 2,
    },
    field: {
      minHeight: 56,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSolid,
      paddingLeft: space.md,
      paddingRight: space.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    fieldFocused: {
      borderColor: c.accent,
      backgroundColor: c.surface,
    },
    iconSlot: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      fontSize: 16,
      lineHeight: 22,
      color: c.text,
      paddingVertical: 0,
      minHeight: HIT_TARGET,
      fontWeight: '500',
      ...(Platform.OS === 'web'
        ? {
            outlineWidth: 0,
            outlineStyle: 'solid' as const,
            outlineColor: 'transparent',
          }
        : {}),
    },
    clear: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceRaised,
    },
    clearPressed: {
      opacity: 0.7,
    },
  })
}
