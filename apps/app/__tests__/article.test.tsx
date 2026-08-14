import { render, screen, waitFor } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { LanguagePreferenceProvider } from '../src/preferences/LanguagePreferenceContext'

const mockBack = jest.fn()
const mockGetArticle = jest.fn()
const mockGetArticles = jest.fn()
const mockParams: Record<string, string> = { id: '7', city: 'jhansi' }

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}))

jest.mock('../src/api/client', () => ({
  apiClient: {
    getArticle: (...args: unknown[]) => mockGetArticle(...args),
    getArticles: (...args: unknown[]) => mockGetArticles(...args),
    recordArticleView: jest.fn(async () => undefined),
  },
}))

jest.mock('../src/storage/cityPreference', () => ({
  getStoredCitySlug: jest.fn(async () => 'jhansi'),
}))

jest.mock('../src/storage/swipeCoach', () => ({
  hasCompletedSwipeCoach: jest.fn(async () => false),
  markSwipeCoachCompleted: jest.fn(async () => undefined),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
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

import ArticleScreen from '../app/article/[id]'
import { hasCompletedSwipeCoach } from '../src/storage/swipeCoach'

const fetched: ArticleResponse = {
  id: 7,
  headline: 'Fetched headline',
  summary: 'Fetched summary body.',
  sourceName: 'City Times',
  sourceUrl: 'https://example.com/7',
  publishedAt: '2026-08-03T10:00:00.000Z',
  category: 'Local',
}

const second: ArticleResponse = {
  id: 8,
  headline: 'Second story',
  summary: 'Another digest.',
  sourceName: 'City Times',
  sourceUrl: 'https://example.com/8',
  publishedAt: '2026-08-03T09:00:00.000Z',
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
      <LanguagePreferenceProvider>
        <ArticleScreen />
      </LanguagePreferenceProvider>
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
    mockParams.city = 'jhansi'
    mockGetArticles.mockResolvedValue({
      items: [fetched, second],
      total: 2,
      offset: 0,
      limit: 20,
    })
    mockGetArticle.mockResolvedValue(fetched)
    ;(hasCompletedSwipeCoach as jest.Mock).mockResolvedValue(false)
  })

  it('loads the feed stack and shows the opened story', async () => {
    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    expect(screen.getByText('Fetched summary body.')).toBeTruthy()
    expect(screen.getAllByLabelText('Share').length).toBeGreaterThan(0)
    expect(mockGetArticles).toHaveBeenCalled()
  })

  it('shows swipe coach until completed', async () => {
    renderArticle()

    expect(await screen.findByText('Swipe up for the next story')).toBeTruthy()
  })

  it('hides coach when already completed', async () => {
    ;(hasCompletedSwipeCoach as jest.Mock).mockResolvedValue(true)
    renderArticle()

    await screen.findByText('Fetched headline')
    await waitFor(() => {
      expect(screen.queryByText('Swipe up for the next story')).toBeNull()
    })
  })

  it('shows unavailable state when article cannot be loaded', async () => {
    mockGetArticles.mockResolvedValue({ items: [], total: 0, offset: 0, limit: 20 })
    mockGetArticle.mockRejectedValueOnce(new Error('not found'))
    renderArticle()

    expect(await screen.findByText('Story unavailable')).toBeTruthy()
  })
})
