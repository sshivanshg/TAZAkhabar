import { Linking, Platform, Share } from 'react-native'

export type ShareableArticle = {
  headline?: string | null
  summary?: string | null
  sourceUrl?: string | null
}

/** True when url is a non-empty https URL. */
export function isHttpsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** Pure formatter used by share + tests. */
export function formatWhatsAppShareText(article: ShareableArticle): string {
  const headline = (article.headline ?? '').trim()
  const summary = (article.summary ?? '').trim()
  const sourceUrl = (article.sourceUrl ?? '').trim()
  const parts = [headline, '', summary]
  if (sourceUrl) {
    parts.push('', `Read more: ${sourceUrl}`)
  }
  return parts.join('\n')
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export async function canOpenWhatsApp(): Promise<boolean> {
  try {
    return await Linking.canOpenURL('https://wa.me/')
  } catch {
    return false
  }
}

export function canUseNativeShare(): boolean {
  return Platform.OS !== 'web' && typeof Share?.share === 'function'
}

/**
 * Share an article via WhatsApp (web) or the system share sheet (native),
 * falling back to the WhatsApp web URL when needed.
 */
export async function shareArticleToWhatsApp(article: ShareableArticle): Promise<void> {
  const text = formatWhatsAppShareText(article)
  const url = whatsAppShareUrl(text)

  if (Platform.OS === 'web') {
    await Linking.openURL(url)
    return
  }

  if (canUseNativeShare()) {
    try {
      // System share sheet: user may pick WhatsApp or cancel.
      // On dismiss/cancel do not open wa.me (Android rejects on dismiss).
      await Share.share({ message: text })
    } catch {
      // Dismiss or share unavailable — treat as user cancel, no fallback.
    }
    return
  }

  await Linking.openURL(url)
}

/** Open a source URL only when it is https. */
export async function openHttpsSource(sourceUrl: string | null | undefined): Promise<boolean> {
  if (!isHttpsUrl(sourceUrl)) {
    return false
  }
  await Linking.openURL(sourceUrl!.trim())
  return true
}
