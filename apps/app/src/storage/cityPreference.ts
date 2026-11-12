import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CityResponse } from '@tazakhabar/shared-types'
import { CITY_STORAGE_KEY } from '../theme/tokens'
import { getAppLanguage, translateIn, type AppLanguage } from '../i18n/runtime'
import { cityNameHi } from '../location/cityNamesHi'

/** Virtual feed scope: nationwide articles ranked with the same personalization pipeline. */
export const GLOBAL_CITY_SLUG = 'global'
/** English label; UI reads the translated one via getCityDisplayLabel. */
export const GLOBAL_CITY_LABEL = 'All India'

export function isGlobalCitySlug(slug: string | null | undefined): boolean {
  return slug?.toLowerCase() === GLOBAL_CITY_SLUG
}

export function createGlobalCity(): CityResponse {
  return {
    slug: GLOBAL_CITY_SLUG,
    name: GLOBAL_CITY_LABEL,
    state: 'India',
  }
}

export function getCityDisplayLabel(
  slug: string | null | undefined,
  cityName?: string | null,
  lang: AppLanguage = getAppLanguage(),
): string {
  if (isGlobalCitySlug(slug)) {
    return translateIn(lang, 'city.allIndia')
  }
  if (lang === 'hi') {
    const hindi = cityNameHi(slug)
    if (hindi) return hindi
  }
  return cityName ?? slug ?? translateIn(lang, 'city.allIndia')
}

/**
 * Feed city precedence: an explicit URL `?city=` (deep link or a fresh pick,
 * which also writes the param) wins, then the stored preference, then All India.
 */
export function pickFeedCity(opts: {
  paramCity: string | null | undefined
  storedCity: string | null | undefined
}): string {
  return opts.paramCity || opts.storedCity || GLOBAL_CITY_SLUG
}

export async function getStoredCitySlug(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CITY_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Stored slug, or {@link GLOBAL_CITY_SLUG} when the reader has not picked a city yet. */
export async function getEffectiveCitySlug(): Promise<string> {
  const stored = await getStoredCitySlug()
  return stored ?? GLOBAL_CITY_SLUG
}

/**
 * City for boot / feed scope: use the stored preference, or persist All India
 * once so cold starts never re-enter a mandatory city gate.
 */
export async function resolveCitySlug(): Promise<string> {
  const stored = await getStoredCitySlug()
  if (stored) {
    return stored
  }
  await setStoredCitySlug(GLOBAL_CITY_SLUG)
  return GLOBAL_CITY_SLUG
}

export async function setStoredCitySlug(slug: string): Promise<void> {
  await AsyncStorage.setItem(CITY_STORAGE_KEY, slug)
}

export async function clearStoredCitySlug(): Promise<void> {
  await AsyncStorage.removeItem(CITY_STORAGE_KEY)
}
