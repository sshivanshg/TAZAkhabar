import type { CityResponse } from '@tazakhabar/shared-types'
import { distanceInKm, findNearestCity } from '../src/location/nearestCity'

const cities: CityResponse[] = [
  {
    id: 6,
    name: 'Mumbai',
    state: 'Maharashtra',
    slug: 'mumbai',
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    id: 11,
    name: 'Pune',
    state: 'Maharashtra',
    slug: 'pune',
    latitude: 18.5204,
    longitude: 73.8567,
  },
]

describe('findNearestCity', () => {
  it('finds the closest supported city using geographic distance', () => {
    const match = findNearestCity({ latitude: 18.53, longitude: 73.85 }, cities)

    expect(match?.city.slug).toBe('pune')
    expect(match?.distanceKm).toBeLessThan(2)
  })

  it('ignores catalog entries without valid coordinates', () => {
    expect(
      findNearestCity(
        { latitude: 19.076, longitude: 72.8777 },
        [{ id: 1, name: 'Unknown', state: 'Unknown', slug: 'unknown' }],
      ),
    ).toBeNull()
  })
})

describe('distanceInKm', () => {
  it('returns zero for the same point', () => {
    expect(
      distanceInKm(
        { latitude: 28.6139, longitude: 77.209 },
        { latitude: 28.6139, longitude: 77.209 },
      ),
    ).toBe(0)
  })
})
