import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { FlatList } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { LanguagePreferenceProvider } from '../src/preferences/LanguagePreferenceContext'
import { ThemePreferenceProvider } from '../src/preferences/ThemePreferenceContext'

const mockBack = jest.fn()
const mockReplace = jest.fn()
const mockGetArticle = jest.fn()
const mockGetArticles = jest.fn()
const mockParams: Record<string, string> = { id: '7', city: 'jhansi' }

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockParams,
  usePathname: () => '/article/1',
  Stack: { Screen: () => null },
}))

const mockShowToast = jest.fn()
jest.mock(
  '../src/components/ui/Toast',
  () => ({ showToast: (...args: unknown[]) => mockShowToast(...args) }),
  { virtual: true },
)

jest.mock('../src/api/client', () => ({
  apiClient: {
    getArticle: (...args: unknown[]) => mockGetArticle(...args),
    getArticles: (...args: unknown[]) => mockGetArticles(...args),
    recordArticleView: jest.fn(async () => undefined),
  },
}))

jest.mock('../src/storage/cityPreference', () => ({
  ...jest.requireActual('../src/storage/cityPreference'),
  getStoredCitySlug: jest.fn(async () => 'jhansi'),
  getEffectiveCitySlug: jest.fn(async () => 'jhansi'),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
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

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import { AccessibilityInfo, Platform } from 'react-native'
import { BOOKMARKS_STORAGE_KEY } from '../src/storage/bookmarks'
import ArticleScreen from '../app/article/[id]'

const listed: ArticleResponse = {
  id: 7,
  headline: 'Fetched headline',
  summary: 'Fetched summary body.',
  sourceName: 'City Times',
  sourceUrl: 'https://example.com/7',
  publishedAt: '2026-08-03T10:00:00.000Z',
  category: 'Local',
}

const fetched: ArticleResponse = {
  ...listed,
  body: 'Full story from the publisher.',
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
      <ThemePreferenceProvider>
        <LanguagePreferenceProvider>
          <ArticleScreen />
        </LanguagePreferenceProvider>
      </ThemePreferenceProvider>
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
      items: [listed, second],
      total: 2,
      offset: 0,
      limit: 20,
    })
    mockGetArticle.mockResolvedValue(fetched)
  })

  it('loads the feed stack and shows the opened story', async () => {
    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    expect(await screen.findByText('Full story from the publisher.')).toBeTruthy()
    expect(screen.getByTestId('article-bottom-bar')).toBeTruthy()
    expect(screen.getByLabelText('Share on WhatsApp')).toBeTruthy()
    expect(screen.getByText('WhatsApp')).toBeTruthy()
    expect(screen.getByLabelText('Back to news')).toBeTruthy()
    expect(screen.getByTestId('language-segment')).toBeTruthy()
    expect(screen.getByLabelText('Save')).toBeTruthy()
    expect(mockGetArticles).toHaveBeenCalledWith(
      expect.objectContaining({
        lang: 'en',
      }),
    )
    expect(mockGetArticle).toHaveBeenCalledWith('7', 'en')
  })

  it('shows a single read-original action per story', async () => {
    renderArticle()

    expect(await screen.findAllByText('Read original article ↗')).toHaveLength(2)
    expect(screen.queryByText(/Source: City Times/)).toBeNull()
    expect(screen.queryByText('View full article ↗')).toBeNull()
    expect(screen.queryByText('Read Source')).toBeNull()
    expect(screen.getAllByText(/reporting published by City Times/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Source: undefined/)).toBeNull()
  })

  it('snaps vertical scrolling one page at a time', async () => {
    renderArticle()

    await screen.findByText('Fetched headline')
    const feed = screen.UNSAFE_getByType(FlatList)
    const firstPage = feed.props.getItemLayout(null, 0)
    const pageHeight = firstPage.length as number
    const secondPage = feed.props.getItemLayout(null, 1)

    expect(feed.props.pagingEnabled).toBe(true)
    expect(feed.props.disableIntervalMomentum).toBe(true)
    expect(feed.props.decelerationRate).toBe('fast')
    expect(feed.props.snapToInterval).toBeUndefined()
    expect(feed.props.snapToAlignment).toBeUndefined()
    expect(feed.props.testID).toBe('article-feed')
    expect(pageHeight).toBeGreaterThan(0)
    expect(secondPage).toEqual({
      length: pageHeight,
      offset: pageHeight,
      index: 1,
    })
    expect(screen.getAllByTestId('article-page').length).toBeGreaterThanOrEqual(2)
    // Constrained flex list so chrome stays viewport-fixed while stories scroll.
    expect(feed.props.style).toEqual(expect.objectContaining({ flex: 1 }))
  })

  it('refreshes the article feed with pull-to-refresh', async () => {
    renderArticle()

    await screen.findByText('Fetched headline')
    const callsBeforeRefresh = mockGetArticles.mock.calls.length

    const feed = screen.UNSAFE_getByType(FlatList)
    await act(async () => {
      await feed.props.refreshControl.props.onRefresh()
    })

    await waitFor(() => {
      expect(mockGetArticles).toHaveBeenCalledTimes(callsBeforeRefresh + 1)
    })
    expect(mockGetArticles).toHaveBeenLastCalledWith(
      expect.objectContaining({
        city: 'jhansi',
        offset: 0,
        limit: 20,
      }),
    )
  })

  it('hides publisher download CTAs from story copy', async () => {
    mockGetArticle.mockResolvedValue({
      ...fetched,
      body: 'Download in high quality\n\nFull story from the publisher.',
    })
    mockGetArticles.mockResolvedValue({
      items: [
        { ...listed, summary: 'Download in high quality' },
        second,
      ],
      total: 2,
      offset: 0,
      limit: 20,
    })

    renderArticle()

    expect(await screen.findByText('Full story from the publisher.')).toBeTruthy()
    expect(screen.queryByText('Download in high quality')).toBeNull()
  })

  it('does not show a next-story divider between pages', async () => {
    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    expect(screen.queryByText('NEXT STORY')).toBeNull()
    expect(screen.queryByTestId('next-story-divider')).toBeNull()
  })

  it('does not show a story count in the sticky header', async () => {
    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    expect(screen.queryByText('1 of 2')).toBeNull()
    expect(screen.queryByLabelText('Story 1 of 2')).toBeNull()
  })

  it('returns to Home when Back is pressed', async () => {
    renderArticle()

    await screen.findByText('Fetched headline')
    fireEvent.press(screen.getByLabelText('Go back'))

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('shows unavailable state when article cannot be loaded', async () => {
    mockGetArticles.mockResolvedValue({ items: [], total: 0, offset: 0, limit: 20 })
    mockGetArticle.mockRejectedValueOnce(new Error('not found'))
    renderArticle()

    expect(await screen.findByText('Story unavailable')).toBeTruthy()
  })

  it('does not render a source CTA when the publisher URL is missing', async () => {
    mockGetArticles.mockResolvedValue({
      items: [{ ...listed, sourceUrl: undefined, sourceName: 'City Desk' }],
      total: 1,
      offset: 0,
      limit: 20,
    })
    mockGetArticle.mockResolvedValue({
      ...fetched,
      sourceUrl: undefined,
      sourceName: 'City Desk',
    })

    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    expect(screen.queryByText('Read original article ↗')).toBeNull()
    expect(screen.getAllByText(/City Desk/).length).toBeGreaterThan(0)
  })

  it('deep link outside the first page opens that exact story first', async () => {
    mockParams.id = '7'
    mockGetArticles.mockResolvedValue({ items: [second], total: 40, offset: 0, limit: 20 })
    mockGetArticle.mockResolvedValue(fetched)
    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    const feed = screen.UNSAFE_getByType(FlatList)
    expect((feed.props.data as ArticleResponse[])[0]?.id).toBe(7)
    expect(mockGetArticle).toHaveBeenCalledWith('7', expect.anything())
  })

  it('shows no error block when the story simply has no body', async () => {
    mockGetArticle.mockResolvedValue({ ...listed, body: null })
    renderArticle()

    expect(await screen.findByText('Fetched headline')).toBeTruthy()
    await waitFor(() => expect(mockGetArticle).toHaveBeenCalled())
    expect(screen.queryByText('Unable to load this story.')).toBeNull()
  })

  it('shows error + working Retry only when the body fetch fails', async () => {
    mockGetArticles.mockResolvedValue({
      items: [{ ...listed, summary: '' }],
      total: 1,
      offset: 0,
      limit: 20,
    })
    mockGetArticle.mockRejectedValue(new Error('network'))
    renderArticle()

    expect(await screen.findAllByText('Unable to load this story.')).toBeTruthy()
    const callsBefore = mockGetArticle.mock.calls.length
    mockGetArticle.mockResolvedValue(fetched)
    await act(async () => {
      fireEvent.press(screen.getAllByLabelText(/retry/i)[0]!)
    })
    await waitFor(() => expect(mockGetArticle.mock.calls.length).toBeGreaterThan(callsBefore))
    expect(await screen.findByText('Full story from the publisher.')).toBeTruthy()
    expect(screen.queryByText('Unable to load this story.')).toBeNull()
  })

  it('drops a stale hydrate result that settles after a feed reload', async () => {
    mockGetArticles.mockResolvedValue({
      items: [{ ...listed, summary: '' }],
      total: 1,
      offset: 0,
      limit: 20,
    })
    let rejectStale: (err: Error) => void = () => {}
    mockGetArticle.mockImplementationOnce(
      () => new Promise((_, reject) => {
        rejectStale = reject
      }),
    )
    mockGetArticle.mockImplementation(() => new Promise(() => {}))
    renderArticle()

    await screen.findByText('Fetched headline')
    await waitFor(() => expect(mockGetArticle).toHaveBeenCalledTimes(1))

    const feed = screen.UNSAFE_getByType(FlatList)
    await act(async () => {
      await feed.props.refreshControl.props.onRefresh()
    })
    await act(async () => {
      rejectStale(new Error('late network failure'))
    })

    expect(screen.queryByText('Unable to load this story.')).toBeNull()
  })

  it('Back to news in the bottom bar returns Home', async () => {
    renderArticle()

    await screen.findByText('Fetched headline')
    fireEvent.press(screen.getByLabelText('Back to news'))

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)')
  })

  it('shows a calm next-story cue when another story follows', async () => {
    renderArticle()

    await screen.findByText('Fetched headline')
    expect(screen.getAllByText('Next story ↓').length).toBeGreaterThan(0)
  })

  it('labels the eyebrow with the reader city', async () => {
    renderArticle()

    await screen.findByText('Fetched headline')
    expect(screen.getAllByText('JHANSI').length).toBeGreaterThan(0)
    expect(screen.queryByText('GLOBAL')).toBeNull()
  })

  it('never labels a story GLOBAL for the All India feed', async () => {
    mockParams.city = 'global'
    renderArticle()

    await screen.findByText('Fetched headline')
    expect(screen.queryByText('GLOBAL')).toBeNull()
    expect(screen.queryByText('global')).toBeNull()
  })

  it('confirms save and offers undo on remove via toast', async () => {
    renderArticle()

    await screen.findByText('Fetched headline')
    fireEvent.press(screen.getByLabelText('Save'))
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Saved' })),
    )

    fireEvent.press(await screen.findByLabelText('Remove bookmark'))
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Removed', actionLabel: 'Undo' }),
      ),
    )
  })

  describe('bookmark save (M2)', () => {
    const originalOS = Platform.OS
    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true })
    })

    it('saves optimistically with a light haptic and one toast (the only announcer)', async () => {
      const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility')
      renderArticle()
      await screen.findByText('Fetched headline')
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Save'))
      })
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light')
      expect(announce).not.toHaveBeenCalled()
      expect(mockShowToast).toHaveBeenCalledTimes(1)
      expect(mockShowToast).toHaveBeenCalledWith({ message: 'Saved' })
      const save = screen.getByLabelText('Remove bookmark')
      expect(save.props.accessibilityState).toEqual({ selected: true })
    })

    it('rolls back and shows an error toast when saving fails', async () => {
      ;(AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string) => {
        if (key === BOOKMARKS_STORAGE_KEY) throw new Error('disk full')
      })
      renderArticle()
      await screen.findByText('Fetched headline')
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Save'))
      })
      await waitFor(() => expect(screen.getByLabelText('Save')).toBeTruthy())
      expect(screen.getByLabelText('Save').props.accessibilityState).toEqual({ selected: false })
      expect(mockShowToast).toHaveBeenCalledTimes(1)
      expect(mockShowToast).not.toHaveBeenCalledWith({ message: 'Saved' })
      ;(AsyncStorage.setItem as jest.Mock).mockImplementation(async () => undefined)
    })

    it('does not fire haptics on web', async () => {
      renderArticle()
      await screen.findByText('Fetched headline')
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true })
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Save'))
      })
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })
  })
})
