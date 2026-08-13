import { fireEvent, render, screen } from '@testing-library/react-native'
import { View } from 'react-native'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { DesktopHeroRow } from '../src/components/desktop/DesktopHeroRow'

jest.mock('moti', () => {
  const React = require('react')
  const { View: RNView } = require('react-native')
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(RNView, props, children),
  }
})

jest.mock('@gluestack-ui/themed', () => {
  const React = require('react')
  const { Text: RNText, View: RNView, Image: RNImage } = require('react-native')
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(RNText, props, children),
    VStack: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(RNView, props, children),
    Image: (props: Record<string, unknown>) => React.createElement(RNImage, props),
  }
})

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View: RNView } = require('react-native')
  const Mock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(RNView, null, children)
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

function makeArticle(id: number, headline: string): ArticleResponse {
  return {
    id,
    cityId: 2,
    headline,
    summary: `Summary ${id}`,
    sourceName: `Source ${id}`,
    sourceUrl: `https://example.com/${id}`,
    publishedAt: '2026-08-13T08:00:00Z',
    category: 'Local',
    imageUrl: undefined,
  }
}

const articles: ArticleResponse[] = [
  makeArticle(1, 'First story'),
  makeArticle(2, 'Second story'),
  makeArticle(3, 'Third story'),
  makeArticle(4, 'Fourth story'),
]

function renderRow(items: ArticleResponse[] = articles, width = 720) {
  render(<DesktopHeroRow articles={items} onPress={jest.fn()} />)
  fireEvent(screen.UNSAFE_getAllByType(View)[0], 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 220 } },
  })
}

describe('DesktopHeroRow', () => {
  it('renders 3 headlines when given 3+ articles', () => {
    renderRow()

    expect(screen.getByText('First story')).toBeTruthy()
    expect(screen.getByText('Second story')).toBeTruthy()
    expect(screen.getByText('Third story')).toBeTruthy()
    expect(screen.queryByText('Fourth story')).toBeNull()
    expect(screen.queryByLabelText(/Breaking story \d+ of/)).toBeNull()
  })
})
