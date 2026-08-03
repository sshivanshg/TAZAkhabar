import AsyncStorage from '@react-native-async-storage/async-storage'
import { CITY_STORAGE_KEY } from '../theme/tokens'

export async function getStoredCitySlug(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CITY_STORAGE_KEY)
  } catch {
    return null
  }
}

export async function setStoredCitySlug(slug: string): Promise<void> {
  await AsyncStorage.setItem(CITY_STORAGE_KEY, slug)
}

export async function clearStoredCitySlug(): Promise<void> {
  await AsyncStorage.removeItem(CITY_STORAGE_KEY)
}
