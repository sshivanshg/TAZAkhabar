const mockStore = new Map<string, string>()
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k: string) => mockStore.get(k) ?? null),
  setItem: jest.fn(async (k: string, v: string) => void mockStore.set(k, v)),
  removeItem: jest.fn(async (k: string) => void mockStore.delete(k)),
}))

import { OFFLINE_FEED_MAX_AGE_MS, isOfflineFeedUsable, readOfflineFeed } from '../src/lib/feedCache'
import { feedCacheKey, writeFeedCache } from '../src/storage/feedCache'

const DAY = 24 * 60 * 60 * 1000

describe('offline feed cache', () => {
  beforeEach(() => mockStore.clear())

  it('expires after 7 days', () => {
    const now = 100 * DAY
    expect(OFFLINE_FEED_MAX_AGE_MS).toBe(7 * DAY)
    expect(isOfflineFeedUsable({ fetchedAt: now - 6 * DAY, items: [], total: 0 }, now)).toBe(true)
    expect(isOfflineFeedUsable({ fetchedAt: now - 7 * DAY, items: [], total: 0 }, now)).toBe(false)
  })

  it('returns the last feed per city and language, and null once expired', async () => {
    const now = 100 * DAY
    const hi = feedCacheKey({ city: 'jhansi', lang: 'hi' })
    const en = feedCacheKey({ city: 'jhansi', lang: 'en' })
    await writeFeedCache(hi, [{ id: 1 } as never], 1, now - DAY)

    expect((await readOfflineFeed(hi, now))?.items).toHaveLength(1)
    expect(await readOfflineFeed(en, now)).toBeNull()
    expect(await readOfflineFeed(hi, now + 7 * DAY)).toBeNull()
  })
})
