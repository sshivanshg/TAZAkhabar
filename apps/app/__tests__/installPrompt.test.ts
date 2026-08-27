/**
 * @jest-environment jsdom
 */
import {
  getDeferredInstallPrompt,
  promptInstall,
  subscribeInstallPrompt,
} from '../src/pwa/installPrompt'

describe('installPrompt', () => {
  afterEach(() => {
    // Fresh module state isn't easy; clear by firing appinstalled if needed.
    window.dispatchEvent(new Event('appinstalled'))
  })

  it('stores beforeinstallprompt and allows promptInstall', async () => {
    const prompt = jest.fn(async () => undefined)
    const userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' })
    let captured: Event | null = null

    const unsub = subscribeInstallPrompt((event) => {
      captured = event as Event | null
    })

    const bip = new Event('beforeinstallprompt') as Event & {
      prompt: typeof prompt
      userChoice: typeof userChoice
      preventDefault: () => void
    }
    bip.prompt = prompt
    bip.userChoice = userChoice
    bip.preventDefault = jest.fn()

    window.dispatchEvent(bip)

    expect(getDeferredInstallPrompt()).not.toBeNull()
    expect(captured).not.toBeNull()

    await expect(promptInstall()).resolves.toBe('accepted')
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(getDeferredInstallPrompt()).toBeNull()

    unsub()
  })

  it('returns unavailable when no deferred prompt', async () => {
    window.dispatchEvent(new Event('appinstalled'))
    await expect(promptInstall()).resolves.toBe('unavailable')
  })
})
