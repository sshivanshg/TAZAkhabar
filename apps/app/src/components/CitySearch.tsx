import { useState } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import Search from 'lucide-react-native/icons/search'
import X from 'lucide-react-native/icons/x'
import type { CityResponse } from '@newsfeed/shared-types'
import { colors, HIT_TARGET, radius, space } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'

type Props = {
  value: string
  onChange: (next: string) => void
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
export function CitySearch({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false)
  const hasQuery = value.length > 0

  return (
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
  )
}

const styles = StyleSheet.create({
  field: {
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    paddingLeft: space.md,
    paddingRight: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  fieldFocused: {
    borderColor: colors.accent,
  },
  iconSlot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    paddingVertical: 0,
    minHeight: HIT_TARGET,
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 0,
          outlineStyle: 'solid' as const,
          outlineColor: 'transparent',
        }
      : {}),
  },
  clear: {
    width: HIT_TARGET,
    height: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPressed: {
    opacity: 0.7,
  },
})
