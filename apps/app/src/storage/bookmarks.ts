import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ArticleResponse } from '@tazakhabar/shared-types'

export const BOOKMARKS_STORAGE_KEY = 'tazakhabar.bookmarks.v1'

export type BookmarkSnapshot = {
  id: number
  headline: string
  summary: string
  sourceName: string
  sourceUrl: string
  publishedAt: string
  category: string
  imageUrl?: string
  citySlug?: string
}

function normalizeId(id: string | number): number | null {
  const n = typeof id === 'number' ? id : Number(id)
  return Number.isFinite(n) ? n : null
}

export function articleToBookmark(
  article: ArticleResponse | BookmarkSnapshot,
  citySlug?: string,
): BookmarkSnapshot | null {
  if (article.id == null) {
    return null
  }
  return {
    id: article.id,
    headline: article.headline ?? '',
    summary: article.summary ?? '',
    sourceName: article.sourceName ?? '',
    sourceUrl: article.sourceUrl ?? '',
    publishedAt: article.publishedAt ?? '',
    category: article.category ?? '',
    imageUrl: article.imageUrl || undefined,
    citySlug: citySlug ?? ('citySlug' in article ? article.citySlug : undefined),
  }
}

export async function getBookmarks(): Promise<BookmarkSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(
      (item): item is BookmarkSnapshot =>
        item != null &&
        typeof item === 'object' &&
        typeof (item as BookmarkSnapshot).id === 'number',
    )
  } catch {
    return []
  }
}

async function persist(bookmarks: BookmarkSnapshot[]): Promise<void> {
  await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks))
}

export async function isBookmarked(id: string | number): Promise<boolean> {
  const n = normalizeId(id)
  if (n == null) {
    return false
  }
  const list = await getBookmarks()
  return list.some((b) => b.id === n)
}

export async function addBookmark(article: BookmarkSnapshot): Promise<void> {
  const list = await getBookmarks()
  if (list.some((b) => b.id === article.id)) {
    return
  }
  await persist([article, ...list])
}

export async function removeBookmark(id: string | number): Promise<void> {
  const n = normalizeId(id)
  if (n == null) {
    return
  }
  const list = await getBookmarks()
  await persist(list.filter((b) => b.id !== n))
}

/** Returns true when the article is bookmarked after the toggle. */
export async function toggleBookmark(
  article: ArticleResponse | BookmarkSnapshot,
  citySlug?: string,
): Promise<boolean> {
  const snap = articleToBookmark(article, citySlug)
  if (!snap) {
    return false
  }
  const list = await getBookmarks()
  if (list.some((b) => b.id === snap.id)) {
    await persist(list.filter((b) => b.id !== snap.id))
    return false
  }
  await persist([snap, ...list])
  return true
}
