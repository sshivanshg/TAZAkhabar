import type { Href } from 'expo-router'

/**
 * First launch: language → city → tabs. A reader with a stored city
 * (including "global" from Skip) is returning and goes straight to the tabs.
 */
export function resolveBootRoute(opts: {
  hasSelectedLanguage: boolean
  storedCity: string | null
}): Href {
  if (!opts.hasSelectedLanguage) {
    return '/language'
  }
  return routeAfterLanguage(opts.storedCity)
}

export function routeAfterLanguage(storedCity: string | null): Href {
  if (!storedCity) {
    return '/city'
  }
  return { pathname: '/(tabs)', params: { city: storedCity } }
}
