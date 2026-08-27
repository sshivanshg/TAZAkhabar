jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useIsFocused: () => true,
  }
})

/** Default light theme for unit tests — screens/components call useTheme(). */
jest.mock('./src/preferences/ThemePreferenceContext', () => {
  const React = require('react')
  const { getColors, getShadows } = require('./src/theme/tokens')
  const { getReaderColors } = require('./src/theme/readerTokens')
  const value = {
    ready: true,
    preference: 'system',
    setPreference: jest.fn(),
    colorScheme: 'light',
    colors: getColors('light'),
    readerColors: getReaderColors('light'),
    shadows: getShadows('light'),
  }
  return {
    ThemePreferenceProvider: ({ children }: { children: React.ReactNode }) => children,
    useTheme: () => value,
  }
})

/** Any lucide icon → empty View so new icons cannot break tests. */
jest.mock('lucide-react-native', () => {
  const React = require('react')
  const { View } = require('react-native')
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props)
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') return true
        return Icon
      },
    },
  )
})
