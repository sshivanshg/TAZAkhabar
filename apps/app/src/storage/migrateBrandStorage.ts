import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * One-time copy of pre-rebrand AsyncStorage keys (`tazakhabar.*` → `khabro.*`).
 * Keeps bookmarks, city, language, theme, and personalization across the rename.
 */
const KEY_MIGRATIONS: ReadonlyArray<readonly [string, string]> = [
  ['tazakhabar.bookmarks.v1', 'khabro.bookmarks.v1'],
  ['tazakhabar.preferredReadingLanguage.v1', 'khabro.preferredReadingLanguage.v1'],
  ['tazakhabar.feedCache.v1', 'khabro.feedCache.v1'],
  ['tazakhabar.personalizationId', 'khabro.personalizationId'],
  ['tazakhabar.themePreference.v1', 'khabro.themePreference.v1'],
  ['tazakhabar.swipeCoach.v1', 'khabro.swipeCoach.v1'],
  ['tazakhabar.notificationClientId.v1', 'khabro.notificationClientId.v1'],
  ['tazakhabar.notificationPromptState.v1', 'khabro.notificationPromptState.v1'],
  ['tazakhabar.selectedCitySlug', 'khabro.selectedCitySlug'],
  ['tazakhabar.feedPreferences.v1', 'khabro.feedPreferences.v1'],
  ['tazakhabar.a2hs.dismissed.v2', 'khabro.a2hs.dismissed.v2'],
]

const MIGRATION_FLAG = 'khabro.storageMigrated.v1'

let migrationPromise: Promise<void> | null = null

async function migrateKey(from: string, to: string): Promise<void> {
  const existing = await AsyncStorage.getItem(to)
  if (existing != null) {
    return
  }
  const legacy = await AsyncStorage.getItem(from)
  if (legacy == null) {
    return
  }
  await AsyncStorage.setItem(to, legacy)
  await AsyncStorage.removeItem(from)
}

export async function migrateBrandStorage(): Promise<void> {
  if (migrationPromise) {
    return migrationPromise
  }

  migrationPromise = (async () => {
    try {
      const done = await AsyncStorage.getItem(MIGRATION_FLAG)
      if (done === '1') {
        return
      }
      for (const [from, to] of KEY_MIGRATIONS) {
        await migrateKey(from, to)
      }
      await AsyncStorage.setItem(MIGRATION_FLAG, '1')
    } catch {
      // Best-effort: readers still work with empty preferences if storage fails.
    }
  })()

  return migrationPromise
}
