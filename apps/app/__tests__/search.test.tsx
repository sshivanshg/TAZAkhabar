import { render, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { ArticleResponse, CityResponse, PagedArticlesResponse } from '@tazakhabar/shared-types'
import { FeedPreferencesProvider } from '../src/preferences/FeedPreferencesContext'
import { LanguagePreferenceProvider } from '../src/preferences/LanguagePreferenceContext'
import { ThemePreferenceProvider } from '../src/preferences/ThemePreferenceContext'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockGetArticles = jest.fn()
const mockGetCities = jest.fn()
const mockParams: { category?: string; from?: string; q?: string } = { q: 'budget' }

jest.mock('expo-router', () => {
  const React = require('react')
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
    }),
    useLocalSearchParams: () => mockParams,
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

jest.mock('../src/hooks/useBreakpoint', () => ({
  useBreakpoint: jest.fn(() => 'mobile'),
  isDesktopLayout: (bp: string) => bp === 'desktop' || bp === 'wide',
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
    Circle: Mock,
  }
})

import DiscoverScreen from '../app/(tabs)/search'

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

function renderDiscover() {
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
            <DiscoverScreen />
          </LanguagePreferenceProvider>
        </ThemePreferenceProvider>
      </FeedPreferencesProvider>
    </SafeAreaProvider>,
  )
}

describe('DiscoverScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.q = 'budget'
    mockGetCities.mockResolvedValue(cities)
    mockGetArticles.mockResolvedValue(paged([sampleArticle]))
  })

  it('sends params.q on the first articles fetch', async () => {
    renderDiscover()

    await waitFor(() => {
      expect(mockGetArticles).toHaveBeenCalled()
    })

    expect(mockGetArticles.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ q: 'budget' }),
    )
  })
})
