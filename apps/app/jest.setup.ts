jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useIsFocused: () => true,
  }
})
