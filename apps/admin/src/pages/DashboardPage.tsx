import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type AdminSource } from '../api'
import { theme } from '../theme'

export function DashboardPage() {
  const [pending, setPending] = useState<number | null>(null)
  const [sources, setSources] = useState<AdminSource[]>([])
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Dashboard</h1>
        <Link
          to="/articles/new"
          style={{
            background: theme.accent,
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Add article / Push to feed
        </Link>
      </div>

      {error && <p style={{ color: theme.danger }}>{error}</p>}

      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
          maxWidth: 320,
        }}
      >
        <div style={{ fontSize: 13, color: theme.textSecondary }}>Pending review</div>
        <div style={{ fontSize: 36, fontWeight: 700 }}>{pending ?? '—'}</div>
        <Link to="/review" style={{ color: theme.accent, fontSize: 14 }}>
          Open review queue →
        </Link>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Source health</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {sources.map((s) => (
          <div
            key={s.id}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: 14,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600 }}>{s.name}</div>
            <div style={{ color: theme.textMuted, marginTop: 4 }}>{s.feedUrl ?? 'Manual'}</div>
            <div style={{ marginTop: 8 }}>
              Status:{' '}
              <strong style={{ color: s.lastFetchStatus === 'Error' ? theme.danger : theme.success }}>
                {s.lastFetchStatus ?? '—'}
              </strong>
            </div>
            <div style={{ color: theme.textSecondary }}>
              Last: {s.lastFetchedAt ? new Date(s.lastFetchedAt).toLocaleString() : 'never'}
            </div>
            {!s.isActive && <div style={{ color: theme.warning, marginTop: 4 }}>Inactive</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
