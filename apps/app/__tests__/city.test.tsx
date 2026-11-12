import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockReplace = jest.fn()
const mockSetCity = jest.fn(async (_slug: string) => undefined)

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}))
jest.mock('../src/components/ui/PrimaryButton', () => {
  const React = require('react')
  const { Pressable, Text } = require('react-native')
  const Btn = ({ label, onPress }: { label: string; onPress: () => void }) =>
    React.createElement(Pressable, { onPress }, React.createElement(Text, null, label))
  return { PrimaryButton: Btn, SecondaryButton: Btn }
})
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../src/hooks/useCityPicker', () => ({
  useCityPicker: () => ({ openCityPicker: jest.fn(), picker: null }),
}))
jest.mock('../src/location/getCurrentCoordinates', () => ({ getCurrentCoordinates: jest.fn() }))
jest.mock('../src/api/client', () => ({ apiClient: { getCities: jest.fn() } }))
jest.mock('../src/storage/cityPreference', () => ({
  ...jest.requireActual('../src/storage/cityPreference'),
  setStoredCitySlug: (slug: string) => mockSetCity(slug),
}))

import CityStepScreen, { CITY_STEP_COPY } from '../app/city'

describe('city onboarding step', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockSetCity.mockClear()
  })

  it('offers location, search and skip', () => {
    render(<CityStepScreen />)
    expect(screen.getByText(CITY_STEP_COPY.useLocation)).toBeTruthy()
    expect(screen.getByText(CITY_STEP_COPY.search)).toBeTruthy()
    expect(screen.getByText(CITY_STEP_COPY.skip)).toBeTruthy()
  })

  it('Skip stores All India and goes to the tabs', async () => {
    render(<CityStepScreen />)
    fireEvent.press(screen.getByText(CITY_STEP_COPY.skip))
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(tabs)', params: { city: 'global' } })
    })
    expect(mockSetCity).toHaveBeenCalledWith('global')
  })
})
