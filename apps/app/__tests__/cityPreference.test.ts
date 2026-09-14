import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  GLOBAL_CITY_SLUG,
  getEffectiveCitySlug,
  getStoredCitySlug,
  resolveCitySlug,
  setStoredCitySlug,
} from '../src/storage/cityPreference'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

const getItem = AsyncStorage.getItem as jest.Mock
const setItem = AsyncStorage.setItem as jest.Mock

describe('cityPreference', () => {
  beforeEach(() => {
    getItem.mockReset()
    setItem.mockReset()
    setItem.mockResolvedValue(undefined)
  })

  it('getEffectiveCitySlug returns All India when nothing is stored', async () => {
    getItem.mockResolvedValue(null)
    await expect(getEffectiveCitySlug()).resolves.toBe(GLOBAL_CITY_SLUG)
    expect(setItem).not.toHaveBeenCalled()
  })

  it('resolveCitySlug persists All India once when preference is missing', async () => {
    getItem.mockResolvedValue(null)
    await expect(resolveCitySlug()).resolves.toBe(GLOBAL_CITY_SLUG)
    expect(setItem).toHaveBeenCalledWith('khabro.selectedCitySlug', GLOBAL_CITY_SLUG)
  })

  it('resolveCitySlug returns the stored city without rewriting', async () => {
    getItem.mockResolvedValue('jhansi')
    await expect(resolveCitySlug()).resolves.toBe('jhansi')
    expect(setItem).not.toHaveBeenCalled()
  })

  it('round-trips a stored city slug', async () => {
    getItem.mockResolvedValue('lucknow')
    await setStoredCitySlug('kanpur')
    expect(setItem).toHaveBeenCalledWith('khabro.selectedCitySlug', 'kanpur')
    await expect(getStoredCitySlug()).resolves.toBe('lucknow')
  })
})
