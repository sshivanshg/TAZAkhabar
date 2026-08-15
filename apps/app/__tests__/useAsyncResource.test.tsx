import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useAsyncResource, type AsyncResource } from '../src/api/useAsyncResource'

describe('useAsyncResource', () => {
  it('loads data through a shared server-state lifecycle', async () => {
    const load = jest.fn(async () => ['jhansi'])

    const { result } = renderHook(() =>
      useAsyncResource(load, [], { initialData: [] as string[] }),
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current.data).toEqual(['jhansi'])
  })

  it('ignores stale responses when dependencies change', async () => {
    let resolveFirst: (value: string) => void = () => undefined
    const load = jest
      .fn()
      .mockImplementationOnce(
        () => new Promise<string>((resolve) => {
          resolveFirst = resolve
        }),
      )
      .mockResolvedValueOnce('fresh')

    const { result, rerender } = renderHook<
      AsyncResource<string>,
      { keyValue: string }
    >(
      ({ keyValue }) => useAsyncResource(load, [keyValue], { initialData: 'empty' }),
      { initialProps: { keyValue: 'old' } },
    )

    rerender({ keyValue: 'new' })

    await waitFor(() => {
      expect(result.current.data).toBe('fresh')
    })

    await act(async () => {
      resolveFirst('stale')
    })

    await waitFor(() => {
      expect(result.current.data).toBe('fresh')
    })
  })

  it('resets to idle when disabled', async () => {
    const load = jest.fn(async () => 'loaded')

    const { result, rerender } = renderHook<
      AsyncResource<string>,
      { enabled: boolean }
    >(
      ({ enabled }) => useAsyncResource(load, [enabled], { enabled, initialData: 'empty' }),
      { initialProps: { enabled: true } },
    )

    await waitFor(() => {
      expect(result.current.data).toBe('loaded')
    })

    rerender({ enabled: false })

    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBe('empty')
  })
})
