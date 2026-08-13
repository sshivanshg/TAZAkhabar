import { useEffect, useRef } from 'react'
import type { IngestionEvent } from '../api'
import { useIngestionStream } from '../live/useIngestionStream'

type LiveTerminalProps = {
  runId: number
  title: string
  embedded?: boolean
  onClose?: () => void
  onTerminal?: (status: 'done' | 'error') => void
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '--:--:--'
  }
}

export function LiveTerminal({ runId, title, embedded, onClose, onTerminal }: LiveTerminalProps) {
  const { events, status, error, counts } = useIngestionStream(runId)
  const bodyRef = useRef<HTMLDivElement>(null)
  const notified = useRef(false)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [events.length])

  useEffect(() => {
    if (notified.current) return
    if (status === 'done' || status === 'error') {
      notified.current = true
      onTerminal?.(status)
    }
  }, [status, onTerminal])

  const pulseClass =
    status === 'error' ? 'pulse err' : status === 'live' || status === 'connecting' ? 'pulse' : 'pulse idle'

  return (
    <div className={`terminal${embedded ? ' embedded' : ''}`}>
      <div className="terminal-head">
        <div className="terminal-title">
          <span className={pulseClass} aria-hidden />
          <span>{title}</span>
        </div>
        <div className="terminal-meta">
          <span>#{runId}</span>
          <span>+{counts.added}</span>
          <span>~{counts.skipped}</span>
          <span>!{counts.failed}</span>
          {onClose && (
            <button type="button" className="btn-ghost" style={{ color: 'var(--terminal-muted)', border: 'none', padding: '2px 6px' }} onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {events.length === 0 && !error && (
          <div className="terminal-empty">
            {status === 'connecting' ? 'Connecting to run stream…' : 'Waiting for ingest events…'}
          </div>
        )}
        {error && (
          <div className="terminal-line">
            <span className="ts">—</span>
            <span className="kind kind-error">error</span>
            <span className="msg">{error}</span>
          </div>
        )}
        {events.map((evt, i) => (
          <TerminalLine key={`${evt.at}-${i}`} evt={evt} />
        ))}
      </div>
    </div>
  )
}

function TerminalLine({ evt }: { evt: IngestionEvent }) {
  return (
    <div className="terminal-line">
      <span className="ts">{formatTime(evt.at)}</span>
      <span className={`kind kind-${evt.type}`}>{evt.type.replace('_', ' ')}</span>
      <span className="msg">{evt.message}</span>
    </div>
  )
}
