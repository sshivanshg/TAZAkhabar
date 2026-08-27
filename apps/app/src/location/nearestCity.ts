import type { CityResponse } from '@tazakhabar/shared-types'

export type Coordinates = {
  latitude: number
  longitude: number
}

export type NearestCityMatch = {
  city: CityResponse
  distanceKm: number
}

const EARTH_RADIUS_KM = 6371

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

export function distanceInKm(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude)
  const longitudeDelta = toRadians(to.longitude - from.longitude)
  const fromLatitude = toRadians(from.latitude)
  const toLatitude = toRadians(to.latitude)

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function findNearestCity(
  coordinates: Coordinates,
  cities: CityResponse[],
): NearestCityMatch | null {
  let nearest: NearestCityMatch | null = null

  for (const city of cities) {
    if (
      typeof city.latitude !== 'number' ||
      !Number.isFinite(city.latitude) ||
      typeof city.longitude !== 'number' ||
      !Number.isFinite(city.longitude)
    ) {
      continue
    }

    const distanceKm = distanceInKm(coordinates, {
      latitude: city.latitude,
      longitude: city.longitude,
    })

    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { city, distanceKm }
    }
  }

  return nearest
}
