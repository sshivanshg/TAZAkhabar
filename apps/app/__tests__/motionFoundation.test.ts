import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { hapticLight, hapticSelection, hapticSuccess } from '../src/lib/haptics'
import { resolveMotionTransition } from '../src/hooks/usePrefersReducedMotion'
import { cardPress, iconPress } from '../src/lib/pressFeedback'

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}))

describe('haptics', () => {
  const original = Platform.OS
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true })
    jest.clearAllMocks()
  })

  it('is a no-op on web', () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true })
    hapticSelection()
    hapticLight()
    hapticSuccess()
    expect(Haptics.selectionAsync).not.toHaveBeenCalled()
    expect(Haptics.impactAsync).not.toHaveBeenCalled()
    expect(Haptics.notificationAsync).not.toHaveBeenCalled()
  })

  it('fires on native and swallows errors', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true })
    ;(Haptics.selectionAsync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('boom')
    })
    expect(() => hapticSelection()).not.toThrow()
    hapticLight()
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light')
  })
})

describe('resolveMotionTransition (useMotionTransition)', () => {
  const spring = { type: 'spring' as const, damping: 22, stiffness: 260, mass: 0.9 }
  it('passes config through when motion is allowed', () => {
    expect(resolveMotionTransition(spring, false)).toBe(spring)
  })
  it('returns an instant non-looping timing under reduced motion', () => {
    expect(resolveMotionTransition({ type: 'timing', duration: 900, loop: true }, true)).toEqual({
      type: 'timing',
      duration: 0,
      delay: 0,
      loop: false,
    })
  })
})

describe('pressFeedback', () => {
  it('cardPress / iconPress', () => {
    expect(cardPress(true)).toEqual({ opacity: 0.85, transform: [{ scale: 0.98 }] })
    expect(cardPress(false)).toBeNull()
    expect(iconPress(true)).toEqual({ opacity: 0.6 })
  })
})
