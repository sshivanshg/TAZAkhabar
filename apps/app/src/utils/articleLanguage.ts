import type { ArticleResponse } from '@newsfeed/shared-types'

/** True when the API is serving translated headline/summary text. */
export function isArticleTranslated(
  article: Pick<ArticleResponse, 'detectedLanguage' | 'displayLanguage'> | null | undefined,
): boolean {
  const detected = article?.detectedLanguage?.trim().toLowerCase()
  const display = article?.displayLanguage?.trim().toLowerCase()
  if (!detected || !display) {
    return false
  }
  return detected !== display
}
