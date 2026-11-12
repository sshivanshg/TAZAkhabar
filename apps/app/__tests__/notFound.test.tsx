import { fireEvent, render, screen } from '@testing-library/react-native'

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: mockReplace }),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

jest.mock('../src/components/ui/EmptyState', () => {
  const { Pressable, Text } = jest.requireActual('react-native')
  return {
    EmptyState: (p: { title: string; primaryAccessibilityLabel: string; onPrimary: () => void }) => (
      <Pressable accessibilityLabel={p.primaryAccessibilityLabel} onPress={p.onPrimary}>
        <Text>{p.title}</Text>
      </Pressable>
    ),
  }
})

import { ThemePreferenceProvider } from '../src/preferences/ThemePreferenceContext'
import NotFoundScreen from '../app/+not-found'

describe('not found', () => {
  it('shows a translated message and goes Home', () => {
    render(
      <ThemePreferenceProvider>
        <NotFoundScreen />
      </ThemePreferenceProvider>,
    )
    expect(screen.getByText('Page not found')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Go to Home'))
    expect(mockReplace).toHaveBeenCalledWith('/')
  })
})
