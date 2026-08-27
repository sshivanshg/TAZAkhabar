import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import {
  FEED_CACHE_STORAGE_KEY,
  FEED_CACHE_TTL_MS,
  feedCacheKey,
  isFeedCacheFresh,
  readFeedCache,
  writeFeedCache,
} from '../src/storage/feedCache'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}))

const sample: ArticleResponse = {
  id: 1,
  headline: 'Cached story',
  summary: 'Summary',
  sourceName: 'Local Daily',
  sourceUrl: 'https://example.com/1',
  publishedAt: '2026-08-03T10:00:00.000Z',
  category: 'Local',
}

describe('feedCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
  })

  it('builds stable keys from city, category, lang, and query', () => {
    expect(
      feedCacheKey({ city: 'Jhansi', category: 'Local', lang: 'hi', q: 'Mayor' }),
    ).toBe('jhansi|local|hi|mayor')
    expect(feedCacheKey({ city: 'jhansi' })).toBe('jhansi|all||')
  })

  it('treats entries within TTL as fresh', () => {
    const now = 1_000_000
    expect(
      isFeedCacheFresh({ fetchedAt: now - FEED_CACHE_TTL_MS + 1, items: [], total: 0 }, now),
    ).toBe(true)
    expect(
      isFeedCacheFresh({ fetchedAt: now - FEED_CACHE_TTL_MS, items: [], total: 0 }, now),
    ).toBe(false)
  })

  it('round-trips first-page feed payloads', async () => {
    let stored: string | null = null
    ;(AsyncStorage.getItem as jest.Mock).mockImplementation(async () => stored)
    ;(AsyncStorage.setItem as jest.Mock).mockImplementation(async (_k, v) => {
      stored = v
    })

    const key = feedCacheKey({ city: 'jhansi', lang: 'en' })
    await writeFeedCache(key, [sample], 1, 5000)

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      FEED_CACHE_STORAGE_KEY,
      expect.any(String),
    )

    const entry = await readFeedCache(key)
    expect(entry).toEqual({
      fetchedAt: 5000,
      items: [sample],
      total: 1,
    })
    expect(isFeedCacheFresh(entry!, 5000 + FEED_CACHE_TTL_MS - 1)).toBe(true)
  })

  it('returns null for missing keys', async () => {
    await expect(readFeedCache('missing')).resolves.toBeNull()
  })
})
