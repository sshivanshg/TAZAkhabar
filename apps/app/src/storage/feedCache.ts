import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ArticleResponse, FeedSection } from '@tazakhabar/shared-types'

export const FEED_CACHE_STORAGE_KEY = 'tazakhabar.feedCache.v1'

/** Keep first-page feed on device this long before an automatic network refresh. */
export const FEED_CACHE_TTL_MS = 45 * 60 * 1000

const MAX_ENTRIES = 16

export type FeedCacheKeyParts = {
  city: string
  category?: string
  lang?: string
  q?: string
}

export type FeedCacheEntry = {
  fetchedAt: number
  items: ArticleResponse[]
  total: number
  /** Sectioned For-you partition when the entry came from getFeedSections. */
  sections?: FeedSection[]
}

type FeedCacheStore = {
  entries: Record<string, FeedCacheEntry>
  order: string[]
}

export function feedCacheKey(parts: FeedCacheKeyParts): string {
  const city = parts.city.trim().toLowerCase()
  const category = (parts.category?.trim() || 'All').toLowerCase()
  const lang = (parts.lang?.trim() || '').toLowerCase()
  const q = (parts.q?.trim() || '').toLowerCase()
  return `${city}|${category}|${lang}|${q}`
}

export function isFeedCacheFresh(
  entry: FeedCacheEntry,
  now: number = Date.now(),
  ttlMs: number = FEED_CACHE_TTL_MS,
): boolean {
  return now - entry.fetchedAt < ttlMs
}

function emptyStore(): FeedCacheStore {
  return { entries: {}, order: [] }
}

async function readStore(): Promise<FeedCacheStore> {
  try {
    const raw = await AsyncStorage.getItem(FEED_CACHE_STORAGE_KEY)
    if (!raw) {
      return emptyStore()
    }
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed == null ||
      typeof parsed !== 'object' ||
      !('entries' in parsed) ||
      !('order' in parsed)
    ) {
      return emptyStore()
    }
    const entries = (parsed as FeedCacheStore).entries
    const order = (parsed as FeedCacheStore).order
    if (
      entries == null ||
      typeof entries !== 'object' ||
      !Array.isArray(order)
    ) {
      return emptyStore()
    }
    return { entries, order: order.filter((k) => typeof k === 'string') }
  } catch {
    return emptyStore()
  }
}

async function writeStore(store: FeedCacheStore): Promise<void> {
  await AsyncStorage.setItem(FEED_CACHE_STORAGE_KEY, JSON.stringify(store))
}

function touchOrder(order: string[], key: string): string[] {
  const next = order.filter((k) => k !== key)
  next.push(key)
  return next
}

function trimStore(store: FeedCacheStore): FeedCacheStore {
  const order = [...store.order]
  const entries = { ...store.entries }
  while (order.length > MAX_ENTRIES) {
    const oldest = order.shift()
    if (oldest) {
      delete entries[oldest]
    }
  }
  return { entries, order }
}

function isValidEntry(value: unknown): value is FeedCacheEntry {
  if (value == null || typeof value !== 'object') {
    return false
  }
  const entry = value as FeedCacheEntry
  return (
    typeof entry.fetchedAt === 'number' &&
    Number.isFinite(entry.fetchedAt) &&
    typeof entry.total === 'number' &&
    Array.isArray(entry.items)
  )
}

/** Returns the stored first-page feed for a key, or null if missing/corrupt. */
export async function readFeedCache(
  key: string,
): Promise<FeedCacheEntry | null> {
  const store = await readStore()
  const entry = store.entries[key]
  if (!isValidEntry(entry)) {
    return null
  }
  return entry
}

/** Persist a successful first-page fetch (replace / pull-to-refresh). */
export async function writeFeedCache(
  key: string,
  items: ArticleResponse[],
  total: number,
  fetchedAt: number = Date.now(),
  sections?: FeedSection[],
): Promise<void> {
  const store = await readStore()
  store.entries[key] = { fetchedAt, items, total, ...(sections ? { sections } : {}) }
  store.order = touchOrder(store.order, key)
  await writeStore(trimStore(store))
}
