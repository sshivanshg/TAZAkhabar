import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type AdminSource } from '../api'
import { useLiveRun } from '../live/LiveRunContext'

export function DashboardPage() {
  const [pending, setPending] = useState<number | null>(null)
  const [sources, setSources] = useState<AdminSource[]>([])
  const [error, setError] = useState<string | null>(null)
  const { session } = useLiveRun()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [articles, src] = await Promise.all([
          api.getArticles({ status: 'PendingReview', page: 1 }),
          api.getSources(),
        ])
        if (!cancelled) {
          setPending(articles.total)
          setSources(src)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const active = sources.filter((s) => s.isActive).length
  const errored = sources.filter((s) => s.lastFetchStatus === 'Error').length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Editorial queue and live ingest status.</p>
        </div>
        <Link
          to="/articles/new"
          className="btn-primary"
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            borderRadius: 8,
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          Add article
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-strip">
        <div className="stat-cell">
          <div className="label">Pending review</div>
          <div className="value">{pending ?? '—'}</div>
          <Link to="/review" style={{ fontSize: 13 }}>
            Open queue
          </Link>
        </div>
        <div className="stat-cell">
          <div className="label">Active sources</div>
          <div className="value">{active}</div>
        </div>
        <div className="stat-cell">
          <div className="label">Last fetch errors</div>
          <div className="value" style={{ color: errored ? 'var(--danger)' : undefined }}>
            {errored}
          </div>
        </div>
        <div className="stat-cell">
          <div className="label">Live run</div>
          <div className="value" style={{ fontSize: 18, paddingTop: 10 }}>
            {session ? session.sourceLabel : 'Idle'}
          </div>
        </div>
      </div>

      <div className="page-header" style={{ marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 18 }}>Source health</h1>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {sources.map((s) => (
          <div key={s.id} className="panel" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>{s.name}</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 12, wordBreak: 'break-all' }}>
              {s.feedUrl ?? 'Manual'}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span>
                <span style={{ color: 'var(--text-muted)' }}>Status </span>
                <strong style={{ color: s.lastFetchStatus === 'Error' ? 'var(--danger)' : 'var(--success)' }}>
                  {s.lastFetchStatus ?? '—'}
                </strong>
              </span>
              <span className="num" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {s.type}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6 }}>
              Last {s.lastFetchedAt ? new Date(s.lastFetchedAt).toLocaleString() : 'never'}
            </div>
            {!s.isActive && (
              <div style={{ color: 'var(--warning)', marginTop: 6, fontSize: 12 }}>Inactive</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
