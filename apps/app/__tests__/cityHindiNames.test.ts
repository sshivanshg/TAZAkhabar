import { filterCities } from '../src/components/CitySearch'
import { localizedCityName } from '../src/location/cityNamesHi'

const cities = [
  { slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh' },
  { slug: 'patna', name: 'Patna', state: 'Bihar' },
  { slug: 'prayagraj', name: 'Prayagraj', state: 'Uttar Pradesh' },
]

describe('Hindi city search', () => {
  it('finds लखनऊ by its Devanagari name', () => {
    expect(filterCities(cities, 'लखनऊ').map((c) => c.slug)).toEqual(['lucknow'])
  })
  it('matches common aliases (इलाहाबाद → Prayagraj)', () => {
    expect(filterCities(cities, 'इलाहाबाद').map((c) => c.slug)).toEqual(['prayagraj'])
  })
  it('still matches English names and states', () => {
    expect(filterCities(cities, 'bihar').map((c) => c.slug)).toEqual(['patna'])
  })
  it('localizes display names in Hindi only', () => {
    expect(localizedCityName({ slug: 'patna', name: 'Patna' }, 'hi')).toBe('पटना')
    expect(localizedCityName({ slug: 'patna', name: 'Patna' }, 'en')).toBe('Patna')
    expect(localizedCityName({ slug: 'nowhere', name: 'Nowhere' }, 'hi')).toBe('Nowhere')
  })
})

describe('cityRowLabel', () => {
  const { cityRowLabel } = jest.requireActual('../src/location/cityNamesHi') as typeof import('../src/location/cityNamesHi')
  const t = ((k: string) => (k === 'city.allIndia' ? 'पूरा भारत' : k)) as never
  it('uses city.allIndia for the global row with no duplicate state', () => {
    expect(cityRowLabel({ slug: 'global', name: 'All India', state: 'India' }, 'hi', t)).toBe('पूरा भारत')
    expect(cityRowLabel({ slug: 'global', name: 'All India', state: 'India' }, 'en', ((k: string) => (k === 'city.allIndia' ? 'All India' : k)) as never)).toBe('All India')
  })
  it('localizes names and keeps the state', () => {
    expect(cityRowLabel({ slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh' }, 'hi', t)).toBe('लखनऊ, उत्तर प्रदेश')
    expect(cityRowLabel({ slug: 'delhi', name: 'Delhi', state: 'Delhi' }, 'en', t)).toBe('Delhi')
  })
})

describe('Hindi query length and states', () => {
  it('needs 2+ characters before Hindi alias matching', () => {
    expect(filterCities(cities, 'ल')).toEqual([])
    expect(filterCities(cities, 'लख').map((c) => c.slug)).toEqual(['lucknow'])
  })
  it('shows Hindi state names in Hindi rows', () => {
    const { cityRowLabel } = jest.requireActual('../src/location/cityNamesHi') as typeof import('../src/location/cityNamesHi')
    expect(cityRowLabel({ slug: 'agra', name: 'Agra', state: 'Uttar Pradesh' }, 'hi', ((k: string) => k) as never)).toBe('आगरा, उत्तर प्रदेश')
  })
})
