/**
 * @jest-environment jsdom
 */
import { Platform } from 'react-native'
import { setWebRobots } from '../src/utils/setWebRobots'

describe('setWebRobots', () => {
  const originalOs = Platform.OS

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' })
    document.head.querySelectorAll('meta[name="robots"]').forEach((node) => node.remove())
  })

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOs })
    document.head.querySelectorAll('meta[name="robots"]').forEach((node) => node.remove())
  })

  it('is a no-op on native platforms', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' })
    const cleanup = setWebRobots('noindex,nofollow')
    expect(document.querySelector('meta[name="robots"]')).toBeNull()
    cleanup()
  })

  it('creates a robots meta tag and restores on cleanup', () => {
    const cleanup = setWebRobots('noindex,nofollow')
    const meta = document.querySelector('meta[name="robots"]')
    expect(meta?.getAttribute('content')).toBe('noindex,nofollow')
    cleanup()
    expect(document.querySelector('meta[name="robots"]')).toBeNull()
  })

  it('restores a previous robots content value', () => {
    const existing = document.createElement('meta')
    existing.setAttribute('name', 'robots')
    existing.setAttribute('content', 'index,follow')
    document.head.appendChild(existing)

    const cleanup = setWebRobots('noindex,nofollow')
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,nofollow',
    )
    cleanup()
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index,follow',
    )
  })
})
