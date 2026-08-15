import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

type UseAsyncResourceOptions<T> = {
  enabled?: boolean
  initialData: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export type AsyncResource<T> = {
  data: T
  error: Error | null
  loading: boolean
  status: AsyncStatus
  reload: () => void
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error('Something went wrong')
}

/**
 * Small server-state primitive for Expo screens.
 * Keep API reads here unless pagination/caching needs justify TanStack Query.
 */
export function useAsyncResource<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
  options: UseAsyncResourceOptions<T>,
): AsyncResource<T> {
  const { enabled = true, initialData, onError, onSuccess } = options
  const [data, setData] = useState(initialData)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<AsyncStatus>(enabled ? 'loading' : 'idle')
  const generation = useRef(0)
  const [reloadKey, setReloadKey] = useState(0)
  const loadRef = useRef(load)
  const initialDataRef = useRef(initialData)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  loadRef.current = load
  initialDataRef.current = initialData
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      generation.current += 1
      setData(initialDataRef.current)
      setError(null)
      setStatus('idle')
      return
    }

    const current = ++generation.current
    setStatus('loading')
    setError(null)

    void loadRef.current()
      .then((result) => {
        if (current !== generation.current) {
          return
        }
        setData(result)
        setStatus('success')
        onSuccessRef.current?.(result)
      })
      .catch((err) => {
        if (current !== generation.current) {
          return
        }
        const nextError = toError(err)
        setData(initialDataRef.current)
        setError(nextError)
        setStatus('error')
        onErrorRef.current?.(nextError)
      })

    return () => {
      generation.current += 1
    }
    // Consumers pass stable deps just like useEffect; load/options are read from refs
    // so inline fallback values do not cause request loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadKey, ...deps])

  return useMemo(
    () => ({
      data,
      error,
      loading: status === 'loading',
      status,
      reload,
    }),
    [data, error, reload, status],
  )
}
