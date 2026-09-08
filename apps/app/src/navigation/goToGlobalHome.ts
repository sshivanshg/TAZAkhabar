import { router } from 'expo-router'
import { GLOBAL_CITY_SLUG, setStoredCitySlug } from '../storage/cityPreference'

/** Home = All India nationwide feed; persists scope and resets to the main tab. */
export async function goToGlobalHome(): Promise<void> {
  await setStoredCitySlug(GLOBAL_CITY_SLUG)
  router.replace({
    pathname: '/(tabs)',
    params: { city: GLOBAL_CITY_SLUG },
  })
}
