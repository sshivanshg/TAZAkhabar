import { Linking, Platform } from 'react-native'
import { isHttpsUrl } from './shareToWhatsApp'

export type OpenSourceContext = {
  articleId?: number | string | null
  publisher?: string | null
  storyIndex?: number
}

/**
 * Open a publisher URL only when it is a valid https link.
 * Web uses a new tab with noopener so the reader keeps its scroll position.
 */
export async function openArticleSource(
  sourceUrl: string | null | undefined,
  _context?: OpenSourceContext,
): Promise<boolean> {
  if (!isHttpsUrl(sourceUrl)) {
    return false
  }

  const url = sourceUrl!.trim()

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
  }

  try {
    await Linking.openURL(url)
    return true
  } catch {
    return false
  }
}
