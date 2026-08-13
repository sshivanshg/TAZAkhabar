jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useIsFocused: () => true,
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
