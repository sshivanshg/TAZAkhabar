import { renderHook } from '@testing-library/react-native'
import { useMotionTransition } from '../src/hooks/usePrefersReducedMotion'

describe('useMotionTransition', () => {
  it('returns the same object across renders for an equal config (so Moti does not restart)', () => {
    const { result, rerender } = renderHook(({ d }: { d: number }) => useMotionTransition({ type: 'timing', duration: d }), {
      initialProps: { d: 240 },
    })
    const first = result.current
    rerender({ d: 240 })
    expect(result.current).toBe(first)
    rerender({ d: 300 })
    expect(result.current).not.toBe(first)
  })
})
