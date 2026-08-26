import { Platform, Share } from 'react-native'
import {
  canUseNativeShare,
  formatWhatsAppShareText,
  isHttpsUrl,
  type ShareableArticle,
} from './shareToWhatsApp'

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unavailable'

export function canUseWebShare(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  )
}

export function getInAppArticleUrl(): string | undefined {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.href
  }
  return undefined
}

export function articleShareUrl(article: ShareableArticle): string | undefined {
  if (isHttpsUrl(article.sourceUrl)) {
    return article.sourceUrl!.trim()
  }
  return getInAppArticleUrl()
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const value = text.trim()
  if (!value) {
    return false
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Fall through to execCommand on web.
  }

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      document.body.removeChild(area)
    }
  }

  return false
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err != null &&
    'name' in err &&
    (err as { name?: string }).name === 'AbortError'
  )
}

/**
 * Prefer the platform share sheet (Web Share / native Share).
 * Fall back to copying a URL so Share is never WhatsApp-only.
 */
export async function shareArticle(article: ShareableArticle): Promise<ShareResult> {
  const title = (article.headline ?? '').trim()
  const summary = (article.summary ?? '').trim()
  const url = articleShareUrl(article)
  const message = formatWhatsAppShareText(article)

  if (canUseWebShare()) {
    try {
      await navigator.share({
        title: title || undefined,
        text: summary || undefined,
        url,
      })
      return 'shared'
    } catch (err) {
      if (isAbortError(err)) {
        return 'cancelled'
      }
    }
  }

  if (canUseNativeShare()) {
    try {
      await Share.share(url ? { message, url, title } : { message, title })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }

  const copied = await copyTextToClipboard(url || message)
  return copied ? 'copied' : 'unavailable'
}
