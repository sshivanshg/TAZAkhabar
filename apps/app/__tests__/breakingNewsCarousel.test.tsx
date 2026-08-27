import { fireEvent, render, screen } from '@testing-library/react-native'
import { FlatList } from 'react-native'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { BreakingNewsCarousel } from '../src/components/BreakingNewsCarousel'
import { space } from '../src/theme/tokens'

jest.mock('moti', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  }
})

jest.mock('@gluestack-ui/themed', () => {
  const React = require('react')
  const { Text: RNText, View, Image: RNImage } = require('react-native')
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(RNText, props, children),
    VStack: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
    Image: (props: Record<string, unknown>) => React.createElement(RNImage, props),
  }
})

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View } = require('react-native')
  const Mock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children)
  return {
    __esModule: true,
    default: Mock,
    Svg: Mock,
    Defs: Mock,
    LinearGradient: Mock,
    Rect: Mock,
    Stop: Mock,
    Path: Mock,
  }
})

const articles: ArticleResponse[] = [
  {
    id: 1,
    cityId: 2,
    headline: 'First story',
    summary: 'Summary one',
    sourceName: 'Source A',
    sourceUrl: 'https://example.com/1',
    publishedAt: '2026-08-13T08:00:00Z',
    category: 'Local',
    imageUrl: undefined,
  },
  {
    id: 2,
    cityId: 2,
    headline: 'Second story',
    summary: 'Summary two',
    sourceName: 'Source B',
    sourceUrl: 'https://example.com/2',
    publishedAt: '2026-08-13T09:00:00Z',
    category: 'Local',
    imageUrl: undefined,
  },
]

describe('BreakingNewsCarousel', () => {
  it('updates the active page indicator when the carousel scrolls', () => {
    render(<BreakingNewsCarousel articles={articles} onPress={jest.fn()} />)

    const firstDot = screen.getByLabelText('Breaking story 1 of 2')
    const secondDot = screen.getByLabelText('Breaking story 2 of 2')
    expect(firstDot.props.accessibilityState?.selected).toBe(true)
    expect(secondDot.props.accessibilityState?.selected).toBe(false)

    const pageWidth = 750 - space.screen * 2 + space.sm
    fireEvent.scroll(screen.UNSAFE_getByType(FlatList), {
      nativeEvent: {
        contentOffset: { x: pageWidth, y: 0 },
        contentSize: { width: pageWidth * 2, height: 200 },
        layoutMeasurement: { width: 750, height: 200 },
      },
    })

    expect(firstDot.props.accessibilityState?.selected).toBe(false)
    expect(secondDot.props.accessibilityState?.selected).toBe(true)
  })
})
