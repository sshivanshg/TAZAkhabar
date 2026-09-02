import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrandHomeButton } from '../src/components/BrandHomeButton'
import { ThemePreferenceProvider } from '../src/preferences/ThemePreferenceContext'

const mockReplace = jest.fn()
const mockSetStoredCitySlug = jest.fn(async () => undefined)

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}))

jest.mock('../src/storage/cityPreference', () => ({
  GLOBAL_CITY_SLUG: 'global',
  setStoredCitySlug: jest.fn(async () => undefined),
}))

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, { testID: 'brand-mark' }, children),
    Circle: View,
    Path: View,
    Rect: View,
  }
})

jest.mock('@gluestack-ui/themed', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
  }
})

describe('BrandHomeButton', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockSetStoredCitySlug.mockClear()
  })

  it('navigates to the All India home feed when pressed', async () => {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemePreferenceProvider>
          <BrandHomeButton />
        </ThemePreferenceProvider>
      </SafeAreaProvider>,
    )

    fireEvent.press(screen.getByLabelText('All India home feed'))

    await waitFor(() => {
      expect(mockSetStoredCitySlug).toHaveBeenCalledWith('global')
    })
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(tabs)',
        params: { city: 'global' },
      })
    })
  })
})
