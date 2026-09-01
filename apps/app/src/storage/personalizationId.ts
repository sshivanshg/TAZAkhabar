import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'tazakhabar.personalizationId'

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 32)
  }
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

let memoryId: string | null = null

/**
 * Persistent anonymous id for the personalized feed — not a user identity.
 * The API learns category affinity and seen stories from article views tagged
 * with this id, so it must survive app restarts (unlike a per-browser-session
 * id). Lives in AsyncStorage (localStorage on web); clearing app/site data
 * resets the profile. Never sent anywhere except view recording and the
 * personalized feed endpoint.
 */
export async function getPersonalizationId(): Promise<string> {
  if (memoryId) {
    return memoryId
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
