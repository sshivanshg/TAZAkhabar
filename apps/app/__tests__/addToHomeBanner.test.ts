/**
 * @jest-environment jsdom
 */
import { Platform } from 'react-native'
import { shouldOfferAddToHome } from '../src/utils/shouldOfferAddToHome'

function setUa(ua: string, opts?: { standalone?: boolean; maxTouchPoints?: number }) {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    get: () => ua,
  })
  Object.defineProperty(navigator, 'standalone', {
    configurable: true,
    get: () => opts?.standalone === true,
  })
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    get: () => opts?.maxTouchPoints ?? 0,
  })
}

function setDisplayMode(mode: string | null) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: mode != null && query.includes(`display-mode: ${mode}`),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

describe('shouldOfferAddToHome', () => {
  const originalOs = Platform.OS

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOs })
  })

  it('never offers on Expo native (ios/android)', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' })
    setUa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    setDisplayMode(null)
    expect(shouldOfferAddToHome()).toBe(false)

    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' })
    expect(shouldOfferAddToHome()).toBe(false)
  })

  it('offers on mobile web browser (not installed)', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' })
    setUa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15')
    setDisplayMode(null)
    expect(shouldOfferAddToHome()).toBe(true)
  })

  it('hides when already installed as PWA (standalone)', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' })
    setUa('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile')
    setDisplayMode('standalone')
    expect(shouldOfferAddToHome()).toBe(false)
  })

  it('hides when iOS home-screen PWA (navigator.standalone)', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' })
    setUa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', { standalone: true })
    setDisplayMode(null)
    expect(shouldOfferAddToHome()).toBe(false)
  })

  it('hides on desktop web browsers', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' })
    setUa('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0')
    setDisplayMode(null)
    expect(shouldOfferAddToHome()).toBe(false)
  })
})
