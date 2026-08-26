import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { CityResponse } from '@newsfeed/shared-types'
import { filterCities } from '../src/components/CitySearch'

const mockReplace = jest.fn()
const mockBack = jest.fn()
const mockCanGoBack = jest.fn(() => false)
const mockGetCities = jest.fn()
const mockSetStoredCitySlug = jest.fn()
const mockGetStoredCitySlug = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: mockBack,
    canGoBack: () => mockCanGoBack(),
  }),
}))

jest.mock('../src/api/client', () => ({
  apiClient: {
    getCities: (...args: unknown[]) => mockGetCities(...args),
  },
}))

jest.mock('../src/storage/cityPreference', () => ({
  setStoredCitySlug: (...args: unknown[]) => mockSetStoredCitySlug(...args),
  getStoredCitySlug: (...args: unknown[]) => mockGetStoredCitySlug(...args),
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
  { id: 1, name: 'Agra', state: 'Uttar Pradesh', slug: 'agra' },
  { id: 5, name: 'Delhi', state: 'Delhi', slug: 'delhi' },
  { id: 2, name: 'Jhansi', state: 'Uttar Pradesh', slug: 'jhansi' },
  { id: 3, name: 'Kanpur', state: 'Uttar Pradesh', slug: 'kanpur' },
  { id: 4, name: 'Lucknow', state: 'Uttar Pradesh', slug: 'lucknow' },
  { id: 99, name: 'Emptyville', state: 'Test', slug: 'emptyville' },
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

describe('filterCities', () => {
  it('matches city or state case-insensitively and trims whitespace', () => {
    expect(filterCities(cities, '  Jh  ').map((city) => city.slug)).toEqual(['jhansi'])
    expect(filterCities(cities, 'DELHI').map((city) => city.slug)).toEqual(['delhi'])
    expect(filterCities(cities, 'uttar').map((city) => city.slug)).toEqual([
      'agra',
      'jhansi',
      'kanpur',
      'lucknow',
    ])
  })
})

describe('CityPickerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCities.mockResolvedValue(cities)
    mockSetStoredCitySlug.mockResolvedValue(undefined)
    mockGetStoredCitySlug.mockResolvedValue(null)
    mockCanGoBack.mockReturnValue(false)
  })

  it('renders city rows without Select links and persists selection then navigates to feed', async () => {
    renderCity()

    expect(await screen.findByText('Jhansi')).toBeTruthy()
    expect(screen.getByText('Kanpur')).toBeTruthy()
    expect(screen.getByText('Choose your city')).toBeTruthy()
    expect(screen.getByText('Available cities')).toBeTruthy()
    expect(screen.queryByText('Select')).toBeNull()
    expect(screen.queryByLabelText('Go back')).toBeNull()

    fireEvent.press(screen.getByLabelText('Jhansi, Uttar Pradesh'))

    await waitFor(() => {
      expect(mockSetStoredCitySlug).toHaveBeenCalledWith('jhansi')
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(tabs)',
        params: { city: 'jhansi' },
      })
    })
  })

  it('hides the test-only emptyville city', async () => {
    renderCity()
    expect(await screen.findByText('Jhansi')).toBeTruthy()
    expect(screen.queryByText('Emptyville')).toBeNull()
  })

  it('filters the list live from the search field', async () => {
    renderCity()
    expect(await screen.findByText('Agra')).toBeTruthy()

    fireEvent.changeText(screen.getByLabelText('Search cities'), 'Jh')

    expect(screen.getByText('Jhansi')).toBeTruthy()
    expect(screen.queryByText('Agra')).toBeNull()
    expect(screen.queryByText('Kanpur')).toBeNull()
  })

  it('shows an empty search state and can clear the query', async () => {
    renderCity()
    expect(await screen.findByText('Lucknow')).toBeTruthy()

    fireEvent.changeText(screen.getByLabelText('Search cities'), 'xyz')

    expect(screen.getByText('No cities found')).toBeTruthy()
    expect(screen.getByText('Try a different city name.')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Clear search'))

    expect(await screen.findByText('Lucknow')).toBeTruthy()
    expect(screen.queryByText('No cities found')).toBeNull()
  })

  it('uses change-city copy, back, and current city when opened with a saved preference', async () => {
    mockGetStoredCitySlug.mockResolvedValue('jhansi')
    mockCanGoBack.mockReturnValue(true)

    renderCity()

    expect(await screen.findByText('Change city')).toBeTruthy()
    expect(screen.getByText('Your city')).toBeTruthy()
    expect(screen.getByText('Current city')).toBeTruthy()
    expect(screen.getByText('Other cities')).toBeTruthy()
    expect(screen.getByLabelText('Go back')).toBeTruthy()
    expect(screen.getByLabelText('Jhansi, Uttar Pradesh, currently selected')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Go back'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('does not show back during onboarding even if the router could go back', async () => {
    mockCanGoBack.mockReturnValue(true)
    renderCity()

    expect(await screen.findByText('Choose your city')).toBeTruthy()
    expect(screen.queryByLabelText('Go back')).toBeNull()
  })

  it('shows error state with retry when cities fail to load', async () => {
    mockGetCities.mockRejectedValueOnce(new Error('Network down'))
    renderCity()

    expect(await screen.findByText("Couldn't load cities")).toBeTruthy()
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy()

    mockGetCities.mockResolvedValueOnce(cities)
    fireEvent.press(screen.getByLabelText('Retry loading cities'))

    expect(await screen.findByText('Jhansi')).toBeTruthy()
  })

  it('shows an empty catalog state when the API returns no cities', async () => {
    mockGetCities.mockResolvedValueOnce([])
    renderCity()

    expect(await screen.findByText('No cities available yet.')).toBeTruthy()
  })
})
