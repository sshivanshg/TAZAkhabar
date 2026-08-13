import { useEffect, useRef, useState } from 'react'
import { api, type IngestionEvent } from '../api'

export function useIngestionStream(runId: number | null) {
  const [events, setEvents] = useState<IngestionEvent[]>([])
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (runId == null) {
      setEvents([])
      setStatus('idle')
      setError(null)
      return
    }

    const ac = new AbortController()
    abortRef.current = ac
    setEvents([])
    setStatus('connecting')
    setError(null)

    void (async () => {
      try {
        setStatus('live')
        for await (const evt of api.streamIngestionEvents(runId, ac.signal)) {
          setEvents((prev) => [...prev, evt])
          if (evt.type === 'completed' || evt.type === 'error') {
            setStatus(evt.type === 'error' ? 'error' : 'done')
          }
        }
        setStatus((s) => (s === 'live' ? 'done' : s))
      } catch (e) {
        if (ac.signal.aborted) return
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Stream failed')
      }
    })()

    return () => {
      ac.abort()
    }
  }, [runId])

  const latest = events[events.length - 1]
  const counts = {
    found: latest?.found ?? 0,
    added: latest?.added ?? 0,
    skipped: latest?.skipped ?? 0,
    failed: latest?.failed ?? 0,
  }

  return { events, status, error, counts }
}
