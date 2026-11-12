import type { ArticleResponse } from '@tazakhabar/shared-types'
import { showToast } from '../components/ui/Toast'
import { translate } from '../i18n/runtime'
import { hapticLight } from './haptics'
import { addBookmark, articleToBookmark, removeBookmark } from '../storage/bookmarks'

export type ToggleBookmarkResult = 'saved' | 'removed' | 'failed' | 'busy' | 'skipped'

/** Ids with a storage write in flight; a second tap waits for the first to settle. */
const inFlight = new Set<number>()

/**
 * The single save/unsave path for the feed sheet and the article screen.
 * Optimistic UI, light haptic on save, the Toast is the only announcer,
 * rollback + error toast on failure, and a per-id in-flight guard.
 */
export async function toggleBookmarkAction(opts: {
  article: ArticleResponse
  citySlug?: string
  currentlySaved: boolean
  setSaved: (id: number, saved: boolean) => void
}): Promise<ToggleBookmarkResult> {
  const { article, citySlug, currentlySaved, setSaved } = opts
  const snapshot = articleToBookmark(article, citySlug || undefined)
  if (!snapshot) return 'skipped'
  const id = snapshot.id
  if (inFlight.has(id)) return 'busy'
  inFlight.add(id)
  setSaved(id, !currentlySaved)
  if (!currentlySaved) hapticLight()
  try {
    if (currentlySaved) {
      await removeBookmark(id)
      showToast({
        message: translate('toast.removed'),
        actionLabel: translate('toast.undo'),
        onAction: () => {
          setSaved(id, true)
          void addBookmark(snapshot).catch(() => setSaved(id, false))
        },
      })
      return 'removed'
    }
    await addBookmark(snapshot)
    showToast({ message: translate('toast.saved') })
    return 'saved'
  } catch {
    setSaved(id, currentlySaved)
    showToast({ message: translate('article.saveFailed') })
    return 'failed'
  } finally {
    inFlight.delete(id)
  }
}
