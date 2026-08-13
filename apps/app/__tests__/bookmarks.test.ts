import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  BOOKMARKS_STORAGE_KEY,
  addBookmark,
  getBookmarks,
  isBookmarked,
  removeBookmark,
  toggleBookmark,
  type BookmarkSnapshot,
} from '../src/storage/bookmarks'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}))

const sample: BookmarkSnapshot = {
  id: 42,
  headline: 'Saved story',
  summary: 'A short summary',
  sourceName: 'Local Daily',
  sourceUrl: 'https://example.com/42',
  publishedAt: '2026-08-03T10:00:00.000Z',
  category: 'Local',
  imageUrl: undefined,
  citySlug: 'jhansi',
}

describe('bookmarks storage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
  })

  it('starts empty', async () => {
    await expect(getBookmarks()).resolves.toEqual([])
    await expect(isBookmarked(42)).resolves.toBe(false)
  })

  it('adds and removes bookmarks', async () => {
    let stored: string | null = null
    ;(AsyncStorage.getItem as jest.Mock).mockImplementation(async () => stored)
    ;(AsyncStorage.setItem as jest.Mock).mockImplementation(async (_k, v) => {
      stored = v
    })

    await addBookmark(sample)
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      BOOKMARKS_STORAGE_KEY,
      expect.any(String),
    )
    await expect(isBookmarked(42)).resolves.toBe(true)
    await expect(getBookmarks()).resolves.toEqual([sample])

    await removeBookmark(42)
    await expect(isBookmarked(42)).resolves.toBe(false)
    await expect(getBookmarks()).resolves.toEqual([])
  })

  it('toggles bookmark membership', async () => {
    let stored: string | null = null
    ;(AsyncStorage.getItem as jest.Mock).mockImplementation(async () => stored)
    ;(AsyncStorage.setItem as jest.Mock).mockImplementation(async (_k, v) => {
      stored = v
    })

    await expect(toggleBookmark(sample)).resolves.toBe(true)
    await expect(toggleBookmark(sample)).resolves.toBe(false)
    await expect(getBookmarks()).resolves.toEqual([])
  })
})
