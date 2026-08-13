import type { ArticleResponse } from '@newsfeed/shared-types'
import type { BookmarkSnapshot } from '../storage/bookmarks'

/** Route params for `/article/[id]` — enables optimistic render before API reconcile. */
export type ArticleRouteParams = {
  id: string
  headline: string
  summary: string
  sourceName: string
  sourceUrl: string
  imageUrl: string
  publishedAt: string
  category: string
}

export function articleRouteParams(
  article: ArticleResponse | BookmarkSnapshot,
): ArticleRouteParams | null {
  if (article.id == null) {
    return null
  }
  return {
    id: String(article.id),
    headline: article.headline ?? '',
    summary: article.summary ?? '',
    sourceName: article.sourceName ?? '',
    sourceUrl: article.sourceUrl ?? '',
    imageUrl: article.imageUrl ?? '',
    publishedAt: article.publishedAt ?? '',
    category: article.category ?? '',
  }
}
