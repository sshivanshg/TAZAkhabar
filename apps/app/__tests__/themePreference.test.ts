jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}))

import {
  DEFAULT_THEME_PREFERENCE,
  getSystemColorScheme,
  isThemePreference,
  resolveColorScheme,
} from '../src/storage/themePreference'

describe('themePreference', () => {
  it('defaults new installs to light appearance', () => {
    expect(DEFAULT_THEME_PREFERENCE).toBe('light')
    expect(resolveColorScheme(DEFAULT_THEME_PREFERENCE, 'dark')).toBe('light')
  })

  it('accepts light, dark, and system', () => {
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('auto')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })

  it('resolves system to the provided system scheme', () => {
    expect(resolveColorScheme('system', 'dark')).toBe('dark')
    expect(resolveColorScheme('system', 'light')).toBe('light')
  })

  it('ignores system when preference is explicit', () => {
    expect(resolveColorScheme('light', 'dark')).toBe('light')
    expect(resolveColorScheme('dark', 'light')).toBe('dark')
  })

  it('reads a system color scheme without throwing', () => {
    expect(['light', 'dark']).toContain(getSystemColorScheme())
  })
})
