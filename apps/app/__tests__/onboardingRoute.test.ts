import { resolveBootRoute, routeAfterLanguage } from '../src/lib/onboarding'

describe('onboarding routing', () => {
  it('first launch goes to language', () => {
    expect(resolveBootRoute({ hasSelectedLanguage: false, storedCity: null })).toBe('/language')
  })

  it('language chosen but no city goes to the city step', () => {
    expect(resolveBootRoute({ hasSelectedLanguage: true, storedCity: null })).toBe('/city')
    expect(routeAfterLanguage(null)).toBe('/city')
  })

  it('returning reader goes straight to tabs, including Skip (All India)', () => {
    expect(resolveBootRoute({ hasSelectedLanguage: true, storedCity: 'jhansi' })).toEqual({
      pathname: '/(tabs)',
      params: { city: 'jhansi' },
    })
    expect(routeAfterLanguage('global')).toEqual({ pathname: '/(tabs)', params: { city: 'global' } })
  })
})

describe('boot route with a URL city', () => {
  it('a deep-link city wins over the stored one for returning readers', () => {
    expect(resolveBootRoute({ hasSelectedLanguage: true, storedCity: 'global', urlCity: 'lucknow' })).toEqual({
      pathname: '/(tabs)',
      params: { city: 'lucknow' },
    })
  })
})
