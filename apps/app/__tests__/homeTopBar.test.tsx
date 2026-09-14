import { fireEvent, render, screen } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { HomeTopBar } from '../src/components/HomeTopBar'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

jest.mock('@gluestack-ui/themed', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
  }
})

function renderTopBar(onSelectLanguage = jest.fn()) {
  return {
    onSelectLanguage,
    ...render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <HomeTopBar
          cityTitle="Jhansi"
          onCityPress={jest.fn()}
          onSearchPress={jest.fn()}
          readingLanguage="en"
          onSelectLanguage={onSelectLanguage}
        />
      </SafeAreaProvider>,
    ),
  }
}

describe('HomeTopBar', () => {
  it('announces the active language and changes preference from the chip', () => {
    const { onSelectLanguage } = renderTopBar()

    expect(screen.getByLabelText('All India home feed')).toBeTruthy()
    expect(screen.getByLabelText('Prefer English').props.accessibilityState).toEqual({
      selected: true,
    })

    fireEvent.press(screen.getByLabelText('Prefer Hindi'))

    expect(onSelectLanguage).toHaveBeenCalledWith('hi')
  })
})
