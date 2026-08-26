import { Platform } from 'react-native'

export function nextArticlePath(
  pathname: string,
  search: string,
  hash: string,
  articleId: number | string,
): string | null {
  const id = String(articleId)
  if (!id || !/\/article\//.test(pathname)) {
    return null
  }
  const nextPath = pathname.replace(/\/article\/[^/]+/, `/article/${id}`)
  if (nextPath === pathname) {
    return null
  }
  return `${nextPath}${search}${hash}`
}

/**
 * Replace the `/article/:id` path during feed scrolling without pushing history.
 * Expo Router's `setParams` would remount the `[id]` screen, so web uses
 * `history.replaceState` only. Native keeps the original route.
 */
export function replaceArticlePathId(articleId: number | string): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return
  }

  const next = nextArticlePath(
    window.location.pathname,
    window.location.search,
    window.location.hash,
    articleId,
  )
  if (!next) {
    return
  }

  window.history.replaceState(window.history.state, '', next)
}
