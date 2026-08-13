import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { ArticleResponse } from '@newsfeed/shared-types'

const mockBack = jest.fn()
const mockGetArticle = jest.fn()
const mockParams: Record<string, string> = { id: '7' }

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}))

jest.mock('../src/api/client', () => ({
  apiClient: {
    getArticle: (...args: unknown[]) => mockGetArticle(...args),
  },
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

jest.mock('@gluestack-ui/themed', () => {
  const React = require('react')
  const { Text, View, Pressable, ScrollView } = require('react-native')
  const passthrough =
    (Comp: typeof View | typeof Text | typeof Pressable | typeof ScrollView) =>
    ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Comp, props, children)

  return {
    Box: passthrough(View),
    VStack: passthrough(View),
    HStack: passthrough(View),
    Text: passthrough(Text),
    Pressable: passthrough(Pressable),
    ScrollView: passthrough(ScrollView),
    Image: passthrough(View),
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

import ArticleScreen from '../app/article/[id]'

const fetched: ArticleResponse = {
  id: 7,
  headline: 'Fetched headline',
  summary: 'Fetched summary body.',
  sourceName: 'City Times',
  sourceUrl: 'https://example.com/7',
  publishedAt: '2026-08-03T10:00:00.000Z',
  category: 'Local',
}

function renderArticle() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ArticleScreen />
    </SafeAreaProvider>,
  )
}

describe('ArticleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    for (const key of Object.keys(mockParams)) {
      delete mockParams[key]
    }
    mockParams.id = '7'
    mockGetArticle.mockResolvedValue(fetched)
  })

  it('loads article by id when route params are incomplete', async () => {
    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    expect(screen.getByText('Fetched summary body.')).toBeTruthy()
    // Native share label is "Share"; web uses "Share on WhatsApp".
    expect(screen.getByLabelText('Share')).toBeTruthy()
    expect(mockGetArticle).toHaveBeenCalledWith('7')
  })

  it('always fetches by id even when route params include article fields', async () => {
    mockParams.headline = 'Optimistic headline'
    mockParams.summary = 'Optimistic summary body.'
    mockParams.sourceName = 'Optimistic Source'
    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    expect(mockGetArticle).toHaveBeenCalledWith('7')
  })

  it('shows optimistic article when fetch fails but route params are complete', async () => {
    mockParams.headline = 'Optimistic headline'
    mockParams.summary = 'Optimistic summary body.'
    mockParams.sourceName = 'Optimistic Source'
    mockGetArticle.mockRejectedValueOnce(new Error('Check your connection and try again.'))
    renderArticle()

    expect(await screen.findByText('Optimistic headline')).toBeTruthy()
    expect(screen.getByText('Optimistic summary body.')).toBeTruthy()
    expect(screen.queryByText('Something went wrong')).toBeNull()
  })

  it('shows error with retry when fetch fails', async () => {
    mockGetArticle.mockRejectedValueOnce(new Error('Check your connection and try again.'))
    renderArticle()

    expect(await screen.findByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy()

    mockGetArticle.mockResolvedValueOnce(fetched)
    fireEvent.press(screen.getByLabelText('Retry loading article'))

    await waitFor(() => {
      expect(screen.getByText('Fetched headline')).toBeTruthy()
    })
  })
})
