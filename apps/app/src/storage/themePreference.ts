import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance, Platform } from 'react-native'
import type { ColorScheme } from '../theme/tokens'

export const THEME_STORAGE_KEY = 'tazakhabar.themePreference.v1'

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const

export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return THEME_PREFERENCES.some((p) => p === value)
}

/** Sync system scheme — Appearance on native; matchMedia on web when available. */
export function getSystemColorScheme(): ColorScheme {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
}

export function resolveColorScheme(preference: ThemePreference, system: ColorScheme): ColorScheme {
  if (preference === 'system') {
    return system
  }
  return preference
}

export async function getStoredThemePreference(): Promise<ThemePreference | null> {
  try {
    const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(raw) ? raw : null
  } catch {
    return null
  }
}

export async function setStoredThemePreference(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, preference)
}
