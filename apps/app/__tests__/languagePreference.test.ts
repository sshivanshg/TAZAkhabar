jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

import {
  detectDeviceReadingLanguage,
  isReadingLanguageCode,
} from '../src/storage/languagePreference'
import { isArticleTranslated } from '../src/utils/articleLanguage'

describe('languagePreference', () => {
  it('accepts en and hi only for reading preference', () => {
    expect(isReadingLanguageCode('en')).toBe(true)
    expect(isReadingLanguageCode('hi')).toBe(true)
    expect(isReadingLanguageCode('fr')).toBe(false)
    expect(isReadingLanguageCode(null)).toBe(false)
  })

  it('detects device reading language without throwing', () => {
    expect(['en', 'hi']).toContain(detectDeviceReadingLanguage())
  })
})

describe('isArticleTranslated', () => {
  it('is true when display language differs from detected', () => {
    expect(
      isArticleTranslated({ detectedLanguage: 'hi', displayLanguage: 'en' }),
    ).toBe(true)
    expect(
      isArticleTranslated({ detectedLanguage: 'en', displayLanguage: 'en' }),
    ).toBe(false)
    expect(isArticleTranslated({})).toBe(false)
  })
})
