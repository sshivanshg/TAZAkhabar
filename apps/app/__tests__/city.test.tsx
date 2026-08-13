import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { CityResponse } from '@newsfeed/shared-types'

const mockReplace = jest.fn()
const mockGetCities = jest.fn()
const mockSetStoredCitySlug = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
  }),
}))

jest.mock('../src/api/client', () => ({
  apiClient: {
    getCities: (...args: unknown[]) => mockGetCities(...args),
  },
}))

jest.mock('../src/storage/cityPreference', () => ({
  setStoredCitySlug: (...args: unknown[]) => mockSetStoredCitySlug(...args),
  getStoredCitySlug: jest.fn(),
  clearStoredCitySlug: jest.fn(),
}))

jest.mock('moti', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  }
})

jest.mock('moti/interactions', () => {
  const React = require('react')
  const { Pressable } = require('react-native')
  return {
    MotiPressable: ({
      children,
      onPress,
      accessibilityLabel,
      accessibilityRole,
    }: {
      children?: React.ReactNode
      onPress?: () => void
      accessibilityLabel?: string
      accessibilityRole?: string
    }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityLabel, accessibilityRole },
        children,
      ),
  }
})

jest.mock('@gluestack-ui/themed', () => {
  const React = require('react')
  const { Text, View, Pressable } = require('react-native')
  const passthrough =
    (Comp: typeof View | typeof Text | typeof Pressable) =>
    ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Comp, props, children)

  return {
    Box: passthrough(View),
    VStack: passthrough(View),
    HStack: passthrough(View),
    Text: passthrough(Text),
    Pressable: passthrough(Pressable),
    Button: ({
      children,
      onPress,
      accessibilityLabel,
    }: {
      children?: React.ReactNode
      onPress?: () => void
      accessibilityLabel?: string
    }) =>
      React.createElement(Pressable, { onPress, accessibilityLabel }, children),
    ButtonText: passthrough(Text),
    ScrollView: passthrough(View),
    Spinner: () => React.createElement(View, { testID: 'spinner' }),
    Image: passthrough(View),
    GluestackUIProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
  }
})

import CityPickerScreen from '../app/city'

const cities: CityResponse[] = [
  { id: 2, name: 'Jhansi', state: 'Uttar Pradesh', slug: 'jhansi' },
  { id: 3, name: 'Kanpur', state: 'Uttar Pradesh', slug: 'kanpur' },
]

function renderCity() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <CityPickerScreen />
    </SafeAreaProvider>,
  )
}

describe('CityPickerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCities.mockResolvedValue(cities)
    mockSetStoredCitySlug.mockResolvedValue(undefined)
  })

  it('renders cities and persists selection then navigates to feed', async () => {
    renderCity()

    expect(await screen.findByText('Jhansi')).toBeTruthy()
    expect(screen.getByText('Kanpur')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Select Jhansi, Uttar Pradesh'))

    await waitFor(() => {
      expect(mockSetStoredCitySlug).toHaveBeenCalledWith('jhansi')
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(tabs)',
        params: { city: 'jhansi' },
      })
    })
  })

  it('shows error state with retry when cities fail to load', async () => {
    mockGetCities.mockRejectedValueOnce(new Error('Network down'))
    renderCity()

    expect(await screen.findByText('We could not load cities.')).toBeTruthy()
    expect(screen.getByText('Network down')).toBeTruthy()

    mockGetCities.mockResolvedValueOnce(cities)
    fireEvent.press(screen.getByLabelText('Retry loading cities'))

    expect(await screen.findByText('Jhansi')).toBeTruthy()
  })
})
