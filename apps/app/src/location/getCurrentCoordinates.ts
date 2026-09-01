import * as Location from 'expo-location'
import { Platform } from 'react-native'

export type LocationFailureReason =
  | 'permission-denied'
  | 'services-disabled'
  | 'timeout'
  | 'unavailable'

export class LocationFailure extends Error {
  constructor(
    readonly reason: LocationFailureReason,
    readonly canAskAgain = true,
  ) {
    super(reason)
    this.name = 'LocationFailure'
  }
}

const LOCATION_TIMEOUT_MS = 15_000

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new LocationFailure('timeout')),
      LOCATION_TIMEOUT_MS,
    )
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export async function getCurrentCoordinates(): Promise<{
  latitude: number
  longitude: number
}> {
  if (Platform.OS === 'web') {
    return getWebCoordinates()
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    throw new LocationFailure('services-disabled')
  }

  const permission = await Location.requestForegroundPermissionsAsync()
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new LocationFailure('permission-denied', permission.canAskAgain)
  }

  try {
    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    )
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
  } catch (error) {
    if (error instanceof LocationFailure) {
      throw error
    }
    throw new LocationFailure('unavailable')
  }
}

async function getWebCoordinates(): Promise<{
  latitude: number
  longitude: number
}> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new LocationFailure('unavailable')
  }

  try {
    const position = await withTimeout(
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          maximumAge: 300_000,
          timeout: LOCATION_TIMEOUT_MS,
        })
      }),
    )
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
  } catch (error) {
    if (error instanceof LocationFailure) {
      throw error
    }
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = error.code
      if (code === 1) {
        throw new LocationFailure('permission-denied')
      }
      if (code === 3) {
        throw new LocationFailure('timeout')
      }
    }
    throw new LocationFailure('unavailable')
  }
}
