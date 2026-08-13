import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { ArticleResponse, CityResponse, PagedArticlesResponse } from '@newsfeed/shared-types'
import { FeedPreferencesProvider } from '../src/preferences/FeedPreferencesContext'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockGetArticles = jest.fn()
const mockGetCities = jest.fn()

jest.mock('expo-router', () => {
  const React = require('react')
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
    }),
    useLocalSearchParams: () => ({ city: 'jhansi' }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = effect()
        return typeof cleanup === 'function' ? cleanup : undefined
      }, [effect])
    },
  }
})

jest.mock('../src/api/client', () => ({
  apiClient: {
    getArticles: (...args: unknown[]) => mockGetArticles(...args),
    getCities: (...args: unknown[]) => mockGetCities(...args),
  },
}))

jest.mock('../src/storage/cityPreference', () => ({
  getStoredCitySlug: jest.fn(async () => 'jhansi'),
  setStoredCitySlug: jest.fn(async () => undefined),
  clearStoredCitySlug: jest.fn(),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
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
      onLongPress,
      accessibilityLabel,
      accessibilityRole,
    }: {
      children?: React.ReactNode
      onPress?: () => void
      onLongPress?: () => void
      accessibilityLabel?: string
      accessibilityRole?: string
    }) =>
      React.createElement(
        Pressable,
        { onPress, onLongPress, accessibilityLabel, accessibilityRole },
        children,
      ),
  }
})

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

import FeedScreen from '../app/(tabs)/index'

const sampleArticle: ArticleResponse = {
  id: 1,
  cityId: 2,
  headline: '[MOCK] Local municipal budget approved for FY26',
  summary: 'The Jhansi Municipal Corporation cleared the annual budget.',
  sourceName: 'Dainik Jagran',
  sourceUrl: 'https://example.com/mock/1',
  publishedAt: '2026-08-03T10:00:00.000Z',
  category: 'Local',
  imageUrl: undefined,
}

const cities: CityResponse[] = [
  { id: 2, name: 'Jhansi', state: 'Uttar Pradesh', slug: 'jhansi' },
]

function paged(items: ArticleResponse[]): PagedArticlesResponse {
  return { items, total: items.length, offset: 0, limit: 20 }
}

function makeArticles(count: number): ArticleResponse[] {
  return Array.from({ length: count }, (_, i) => ({
    ...sampleArticle,
    id: i + 1,
    headline: i === 0
      ? '[MOCK] Local municipal budget approved for FY26'
      : `[MOCK] Story ${i + 1}`,
  }))
}

function renderFeed() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <FeedPreferencesProvider>
        <FeedScreen />
      </FeedPreferencesProvider>
    </SafeAreaProvider>,
  )
}

describe('FeedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCities.mockResolvedValue(cities)
    // Need more than BREAKING_NEWS_COUNT so recommendation list has the sample headline
    mockGetArticles.mockResolvedValue(paged(makeArticles(6)))
  })

  it('renders articles from the API', async () => {
    renderFeed()

    expect(
      await screen.findByText('[MOCK] Local municipal budget approved for FY26'),
    ).toBeTruthy()
    expect(screen.getByText('Breaking News')).toBeTruthy()
    expect(screen.getByText('Latest for you')).toBeTruthy()
    expect(screen.getByLabelText(/Change city/)).toBeTruthy()
  })

  it('shows empty state when there are no articles', async () => {
    mockGetArticles.mockResolvedValue(paged([]))
    renderFeed()

    expect(await screen.findByText('No stories yet')).toBeTruthy()
    expect(screen.getByText(/We do not have articles for/)).toBeTruthy()
  })

  it('shows error state with retry', async () => {
    mockGetArticles.mockRejectedValueOnce(new Error('Server unavailable'))
    renderFeed()

    expect(await screen.findByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Server unavailable')).toBeTruthy()

    mockGetArticles.mockResolvedValueOnce(paged(makeArticles(6)))
    fireEvent.press(screen.getByLabelText('Retry loading articles'))

    await waitFor(() => {
      expect(
        screen.getByText('[MOCK] Local municipal budget approved for FY26'),
      ).toBeTruthy()
    })
  })

  it('opens city picker from city pill', async () => {
    renderFeed()

    await screen.findByText('Breaking News')
    fireEvent.press(screen.getByLabelText(/Change city/))

    expect(mockPush).toHaveBeenCalledWith('/city')
  })

  it('opens story actions on long press of a recommendation card', async () => {
    renderFeed()

    const card = await screen.findByLabelText(
      /Story 6.*Open options for more actions/,
    )
    fireEvent(card, 'onLongPress')

    // Native share label is "Share"; web uses "Share on WhatsApp".
    expect(await screen.findByText('Share')).toBeTruthy()
    expect(screen.getByText('Save')).toBeTruthy()
    expect(screen.getByText('Show more like this')).toBeTruthy()
    expect(screen.getByText('Block this source')).toBeTruthy()
  })
})
