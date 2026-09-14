import { render, waitFor } from '@testing-library/react-native'

const mockRedirect = jest.fn()
const mockResolveCitySlug = jest.fn(async () => 'global')

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}))

jest.mock('expo-router', () => ({
  Redirect: (props: { href: unknown }) => {
    mockRedirect(props.href)
    return null
  },
}))

jest.mock('../src/preferences/ThemePreferenceContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      textSecondary: '#666',
      textMuted: '#999',
    },
  }),
}))

jest.mock('../src/preferences/LanguagePreferenceContext', () => ({
  useLanguagePreference: () => ({
    ready: true,
    hasSelectedLanguage: true,
  }),
}))

jest.mock('../src/storage/cityPreference', () => ({
  resolveCitySlug: (...args: unknown[]) => mockResolveCitySlug(...args),
}))

import IndexScreen from '../app/index'

describe('boot index', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
    mockResolveCitySlug.mockClear()
    mockResolveCitySlug.mockResolvedValue('global')
  })

  it('sends readers to Home with the effective city, never /city', async () => {
    mockResolveCitySlug.mockResolvedValue('jhansi')
    render(<IndexScreen />)

    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalledWith({
        pathname: '/(tabs)',
        params: { city: 'jhansi' },
      })
    })
    expect(mockRedirect).not.toHaveBeenCalledWith('/city')
  })

  it('defaults first-time readers to All India Home', async () => {
    mockResolveCitySlug.mockResolvedValue('global')
    render(<IndexScreen />)

    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalledWith({
        pathname: '/(tabs)',
        params: { city: 'global' },
      })
    })
  })
})
