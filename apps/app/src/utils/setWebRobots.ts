import { Platform } from 'react-native'

/**
 * Keep thin client-rendered article shells out of search indexes.
 * Brand/product discovery should land on the marketing site + reader home.
 */
export function setWebRobots(content: string): () => void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return () => {}
  }

  let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
  const created = !meta
  const previous = meta?.getAttribute('content') ?? null

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'robots')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)

  return () => {
    if (!meta) return
    if (created) {
      meta.remove()
      return
    }
    if (previous == null) {
      meta.removeAttribute('content')
    } else {
      meta.setAttribute('content', previous)
    }
  }
}
