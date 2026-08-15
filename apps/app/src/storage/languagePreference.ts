import AsyncStorage from '@react-native-async-storage/async-storage'

export const LANGUAGE_STORAGE_KEY = 'newsfeed.preferredReadingLanguage.v1'

/** v1 reading languages — UI list only; API accepts any ISO code. */
export const READING_LANGUAGES = [
  { code: 'en', label: 'English', accessibilityLabel: 'English' },
  { code: 'hi', label: 'हिन्दी', accessibilityLabel: 'Hindi' },
] as const

export type ReadingLanguageCode = (typeof READING_LANGUAGES)[number]['code']

export function isReadingLanguageCode(value: string | null | undefined): value is ReadingLanguageCode {
  return READING_LANGUAGES.some((l) => l.code === value)
}

/** Device locale → preferred reading language; falls back to English. */
export function detectDeviceReadingLanguage(): ReadingLanguageCode {
  try {
    const locale =
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().locale
        : 'en'
    const primary = locale.split(/[-_]/)[0]?.toLowerCase() ?? 'en'
    if (primary === 'hi') {
      return 'hi'
    }
  } catch {
    // ignore
  }
  return 'en'
}

export async function getStoredReadingLanguage(): Promise<ReadingLanguageCode | null> {
  try {
    const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isReadingLanguageCode(raw) ? raw : null
  } catch {
    return null
  }
}

export async function setStoredReadingLanguage(code: ReadingLanguageCode): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code)
}
