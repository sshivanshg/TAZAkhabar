import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type {
  ArticleResponse,
  CityResponse,
  FeedSection,
  FeedSectionsResponse,
  PagedArticlesResponse,
} from '@tazakhabar/shared-types'
import { FeedPreferencesProvider } from '../src/preferences/FeedPreferencesContext'
import { LanguagePreferenceProvider } from '../src/preferences/LanguagePreferenceContext'
import { ThemePreferenceProvider } from '../src/preferences/ThemePreferenceContext'
import { ERROR_COLUMN_MAX } from '../src/theme/tokens'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockGetArticles = jest.fn()
const mockGetPersonalizedArticles = jest.fn()
const mockGetFeedSections = jest.fn()
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
    getPersonalizedArticles: (...args: unknown[]) => mockGetPersonalizedArticles(...args),
    getFeedSections: (...args: unknown[]) => mockGetFeedSections(...args),
    getCities: (...args: unknown[]) => mockGetCities(...args),
    getTrendingArticles: jest.fn(async () => ({ items: [] })),
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

jest.mock('../src/hooks/useBreakpoint', () => ({
  useBreakpoint: jest.fn(() => 'mobile'),
  isDesktopLayout: (bp: string) => bp === 'desktop' || bp === 'wide',
  isExpandedLayout: (bp: string) => bp !== 'mobile',
}))

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

const { useBreakpoint } = require('../src/hooks/useBreakpoint') as {
  useBreakpoint: jest.Mock
}

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

function makeArticles(count: number, category = 'Local'): ArticleResponse[] {
  return Array.from({ length: count }, (_, i) => ({
    ...sampleArticle,
    id: i + 1,
    category,
    headline: i === 0
      ? '[MOCK] Local municipal budget approved for FY26'
      : `[MOCK] Story ${i + 1}`,
  }))
}

/** Mirrors the API partition: first 5 ranked stories in "top", rest in "more". */
function sectioned(items: ArticleResponse[]): FeedSectionsResponse {
  const sections: FeedSection[] = []
  if (items.length > 0) {
    sections.push({
      key: 'top',
      title: 'Top stories',
      category: undefined,
      items: items.slice(0, 5),
    })
  }
  if (items.length > 5) {
    sections.push({
      key: 'more',
      title: 'More stories',
      category: undefined,
      items: items.slice(5),
    })
  }
  return { sections, total: items.length }
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
        <ThemePreferenceProvider>
          <LanguagePreferenceProvider>
            <FeedScreen />
          </LanguagePreferenceProvider>
        </ThemePreferenceProvider>
      </FeedPreferencesProvider>
    </SafeAreaProvider>,
  )
}

describe('FeedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useBreakpoint.mockReturnValue('mobile')
    mockGetCities.mockResolvedValue(cities)
    // Need more than BREAKING_NEWS_COUNT so recommendation list has the sample headline
    mockGetArticles.mockResolvedValue(paged(makeArticles(6)))
    // Home "For you" loads through the sectioned feed endpoint by default.
    mockGetPersonalizedArticles.mockResolvedValue(paged(makeArticles(6)))
    mockGetFeedSections.mockResolvedValue(sectioned(makeArticles(6)))
  })

  it('renders articles from the API', async () => {
    renderFeed()

    expect(
      await screen.findByText('[MOCK] Local municipal budget approved for FY26'),
    ).toBeTruthy()
    // Sectioned For-you feed: section headers lead each partition on mobile too.
    expect(screen.getByText('Top stories')).toBeTruthy()
    expect(screen.getByText('More stories')).toBeTruthy()
    expect(screen.getByLabelText('Filter For you')).toBeTruthy()
    // Actions live in the overflow sheet — Google News–style clean card face.
    expect(screen.queryByText('Read original')).toBeNull()
    expect(screen.queryAllByText('Save')).toHaveLength(0)
    expect(screen.queryAllByText('Share')).toHaveLength(0)
    expect(screen.getByLabelText(/Change city/)).toBeTruthy()
    expect(screen.queryByTestId('article-row')).toBeNull()
  })

  it('renders category sections with their headers', async () => {
    const healthArticles: ArticleResponse[] = [
      { ...sampleArticle, id: 6, headline: '[MOCK] Health story one', category: 'Health' },
      { ...sampleArticle, id: 7, headline: '[MOCK] Health story two', category: 'Health' },
    ]
    mockGetFeedSections.mockResolvedValue({
      sections: [
        { key: 'top', title: 'Top stories', category: undefined, items: makeArticles(5) },
        { key: 'health', title: 'Health', category: 'Health', items: healthArticles },
      ],
      total: 7,
    } satisfies FeedSectionsResponse)
    renderFeed()

    // Wait for the section content; the "Health" category chip paints first and
    // would satisfy findAllByText before the section header renders.
    await waitFor(() => {
      expect(screen.getByText('[MOCK] Health story one')).toBeTruthy()
    })
    // "Health" appears both as a category chip and as the section header.
    expect(screen.getAllByText('Health').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('[MOCK] Health story two')).toBeTruthy()
    expect(screen.getByText('Top stories')).toBeTruthy()
  })

  it('applies feed preference filters inside sections', async () => {
    const asyncStorage = require('@react-native-async-storage/async-storage')
    asyncStorage.getItem.mockImplementation(async (key: string) =>
      key === 'tazakhabar.feedPreferences.v1'
        ? JSON.stringify({ hiddenStoryIds: [6] })
        : null,
    )
    try {
      renderFeed()

      expect(
        await screen.findByText('[MOCK] Local municipal budget approved for FY26'),
      ).toBeTruthy()
      // Story 6 is hidden, so the "More stories" section it alone filled drops out.
      expect(screen.queryByText('[MOCK] Story 6')).toBeNull()
      expect(screen.queryByText('More stories')).toBeNull()
    } finally {
      asyncStorage.getItem.mockImplementation(async () => null)
    }
  })

  it('shows empty state when there are no articles', async () => {
    mockGetFeedSections.mockResolvedValue({ sections: [], total: 0 })
    renderFeed()

    expect(await screen.findByText('No stories yet')).toBeTruthy()
    expect(screen.getByText(/We do not have articles for/)).toBeTruthy()
  })

  it('shows error state with retry', async () => {
    // Both the sections attempt and its chronological fallback must fail.
    mockGetFeedSections.mockRejectedValueOnce(new Error('Sections down'))
    mockGetArticles.mockRejectedValueOnce(new Error('Server unavailable'))
    renderFeed()

    expect(await screen.findByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Server unavailable')).toBeTruthy()
    expect(screen.queryByTestId('error-column')).toBeNull()

    mockGetFeedSections.mockResolvedValueOnce(sectioned(makeArticles(6)))
    fireEvent.press(screen.getByLabelText('Retry loading articles'))

    await waitFor(() => {
      expect(
        screen.getByText('[MOCK] Local municipal budget approved for FY26'),
      ).toBeTruthy()
    })
  })

  it('pairs recommendation articles into a 2-column row on tablet', async () => {
    useBreakpoint.mockReturnValue('tablet')
    mockGetFeedSections.mockResolvedValue(sectioned(makeArticles(7, 'Business')))
    renderFeed()

    expect(await screen.findByText('[MOCK] Story 6')).toBeTruthy()
    expect(screen.getByText('[MOCK] Story 7')).toBeTruthy()
    expect(screen.getAllByTestId('article-row').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('error-column')).toBeNull()
  })

  it('pairs recommendation articles into a 2-column row on desktop', async () => {
    useBreakpoint.mockReturnValue('desktop')
    mockGetFeedSections.mockResolvedValue(sectioned(makeArticles(7, 'Business')))
    renderFeed()

    expect(await screen.findByText('[MOCK] Story 6')).toBeTruthy()
    expect(screen.getByText('[MOCK] Story 7')).toBeTruthy()
    expect(screen.getAllByTestId('article-row').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('error-column')).toBeNull()
  })

  it('lists leftover stories after the top-stories cluster on desktop', async () => {
    useBreakpoint.mockReturnValue('desktop')
    mockGetFeedSections.mockResolvedValue(sectioned(makeArticles(7, 'Business')))
    renderFeed()

    expect(await screen.findByText('[MOCK] Story 5')).toBeTruthy()
    expect(screen.getByText('[MOCK] Story 6')).toBeTruthy()
  })

  it('centers the error column at ERROR_COLUMN_MAX on desktop', async () => {
    useBreakpoint.mockReturnValue('desktop')
    mockGetFeedSections.mockRejectedValueOnce(new Error('Sections down'))
    mockGetArticles.mockRejectedValueOnce(new Error('Server unavailable'))
    renderFeed()

    expect(await screen.findByText('Something went wrong')).toBeTruthy()
    const column = screen.getByTestId('error-column')
    expect(StyleSheet.flatten(column.props.style).maxWidth).toBe(ERROR_COLUMN_MAX)
  })

  it('shows You’re caught up when the feed has no more pages', async () => {
    renderFeed()

    expect(
      await screen.findByText('[MOCK] Local municipal budget approved for FY26'),
    ).toBeTruthy()
    expect(await screen.findByText('You’re caught up')).toBeTruthy()
  })

  it('opens city picker from city pill', async () => {
    renderFeed()

    await screen.findByText('[MOCK] Local municipal budget approved for FY26')
    fireEvent.press(screen.getByLabelText(/Change city/))

    expect(mockPush).toHaveBeenCalledWith('/city')
  })

  it('opens Discover for the publisher from See more', async () => {
    renderFeed()
    await screen.findByText('[MOCK] Local municipal budget approved for FY26')
    fireEvent.press(screen.getAllByLabelText('See more from Dainik Jagran')[0])
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/search',
      params: { from: 'home', q: 'Dainik Jagran' },
    })
  })

  it('opens story actions on long press of a mobile feed card', async () => {
    renderFeed()

    const card = await screen.findByLabelText(
      /Story 6.*Dainik Jagran/,
    )
    fireEvent(card, 'onLongPress')

    expect(await screen.findByLabelText('Save for later')).toBeTruthy()
    expect(screen.getByLabelText('Share')).toBeTruthy()
    expect(screen.getByLabelText('Go to Dainik Jagran')).toBeTruthy()
    expect(screen.getByLabelText('I like this')).toBeTruthy()
    expect(screen.getByLabelText(/Hide all stories from Dainik Jagran/)).toBeTruthy()
  })

  it('loads the For you feed through the sections endpoint', async () => {
    renderFeed()

    expect(
      await screen.findByText('[MOCK] Local municipal budget approved for FY26'),
    ).toBeTruthy()
    expect(mockGetFeedSections).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'jhansi',
        sessionId: expect.any(String),
      }),
    )
    // Chronological endpoint is only the fallback — not used on success.
    expect(mockGetArticles).not.toHaveBeenCalled()
  })

  it('falls back to the chronological feed when the sections endpoint fails', async () => {
    mockGetFeedSections.mockRejectedValueOnce(new Error('Sections down'))
    renderFeed()

    expect(
      await screen.findByText('[MOCK] Local municipal budget approved for FY26'),
    ).toBeTruthy()
    expect(mockGetArticles).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'jhansi', offset: 0, limit: 20 }),
    )
  })
})
