import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CityResponse } from '@tazakhabar/shared-types'
import { CITY_STORAGE_KEY } from '../theme/tokens'

/** Virtual feed scope: nationwide articles ranked with the same personalization pipeline. */
export const GLOBAL_CITY_SLUG = 'global'
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
): string {
  if (isGlobalCitySlug(slug)) {
    return GLOBAL_CITY_LABEL
  }
  return cityName ?? slug ?? GLOBAL_CITY_LABEL
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

export async function setStoredCitySlug(slug: string): Promise<void> {
  await AsyncStorage.setItem(CITY_STORAGE_KEY, slug)
}

export async function clearStoredCitySlug(): Promise<void> {
  await AsyncStorage.removeItem(CITY_STORAGE_KEY)
}
