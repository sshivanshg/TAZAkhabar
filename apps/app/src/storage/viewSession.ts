import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const STORAGE_KEY = 'newsfeed.viewSessionId'
const SESSION_STORAGE_KEY = 'newsfeed.viewSessionId'

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 32)
  }
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

let memoryId: string | null = null

/**
 * Opaque per-install/session id for view dedup — not a user identity.
 * Web prefers sessionStorage so a new browser session gets a fresh id;
 * native falls back to AsyncStorage (survives relaunches, still anonymous).
 */
export async function getViewSessionId(): Promise<string> {
  if (memoryId) {
    return memoryId
  }

  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    try {
      const existing = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (existing) {
        memoryId = existing
        return existing
      }
      const created = randomId()
      sessionStorage.setItem(SESSION_STORAGE_KEY, created)
      memoryId = created
      return created
    } catch {
      // fall through
    }
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    if (stored) {
      memoryId = stored
      return stored
    }
    const created = randomId()
    await AsyncStorage.setItem(STORAGE_KEY, created)
    memoryId = created
    return created
  } catch {
    const created = randomId()
    memoryId = created
    return created
  }
}
