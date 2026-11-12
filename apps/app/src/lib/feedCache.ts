import {
  readFeedCache,
  type FeedCacheEntry,
} from '../storage/feedCache'

/** Offline copies match article retention: older than this is never shown. */
export const OFFLINE_FEED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function isOfflineFeedUsable(
  entry: FeedCacheEntry,
  now: number = Date.now(),
): boolean {
  return now - entry.fetchedAt < OFFLINE_FEED_MAX_AGE_MS
}

/**
 * Last successful feed for a city + language (+ category) key, or null when
 * missing or older than 7 days. Writes go through `writeFeedCache`.
 */
export async function readOfflineFeed(
  key: string,
  now: number = Date.now(),
): Promise<FeedCacheEntry | null> {
  const entry = await readFeedCache(key)
  return entry && isOfflineFeedUsable(entry, now) ? entry : null
}
