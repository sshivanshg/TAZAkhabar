import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type AdminArticle, type AdminSource, type City } from '../api'
import { DataTable, StatusBadge, type Column } from '../components/DataTable'
import { theme } from '../theme'

export function ReviewQueuePage() {
  const [rows, setRows] = useState<AdminArticle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('PendingReview')
  const [city, setCity] = useState('')
  const [source, setSource] = useState('')
  const [cities, setCities] = useState<City[]>([])
  const [sources, setSources] = useState<AdminSource[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.getArticles({
        status: status || undefined,
        city: city || undefined,
        source: source || undefined,
        page,
      })
      setRows(data.items)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [status, city, source, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void Promise.all([api.getCities(), api.getSources()]).then(([c, s]) => {
      setCities(c)
      setSources(s)
    })
  }, [])

  async function approve(id: number) {
    setBusyId(id)
    try {
      await api.publishArticle(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setBusyId(null)
    }
  }

  async function reject(id: number) {
    setBusyId(id)
    try {
      await api.rejectArticle(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed')
    } finally {
      setBusyId(null)
    }
  }

  const cityName = (id: number) => cities.find((c) => c.id === id)?.name ?? String(id)

  const columns: Column<AdminArticle>[] = [
    {
      key: 'headline',
      header: 'Headline',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.headline}</div>
          <div style={{ color: theme.textMuted, fontSize: 12 }}>{r.sourceName}</div>
        </div>
      ),
    },
    { key: 'city', header: 'City', render: (r) => cityName(r.cityId), width: '100px' },
    { key: 'category', header: 'Category', render: (r) => r.category, width: '90px' },
    {
      key: 'ingested',
      header: 'Ingested',
      width: '140px',
      render: (r) => (r.ingestedAt ? new Date(r.ingestedAt).toLocaleString() : '—'),
    },
    { key: 'status', header: 'Status', width: '120px', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" disabled={busyId === r.id} onClick={() => void approve(r.id)}>
            Approve
          </button>
          <button type="button" disabled={busyId === r.id} onClick={() => void reject(r.id)}>
            Reject
          </button>
          <Link to={`/articles/${r.id}`}>Edit</Link>
        </div>
      ),
    },
  ]

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: 22 }}>Review queue</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <label>
          Status{' '}
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
            <option value="">All</option>
            <option value="PendingReview">PendingReview</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Rejected">Rejected</option>
            <option value="Archived">Archived</option>
          </select>
        </label>
        <label>
          City{' '}
          <select value={city} onChange={(e) => { setPage(1); setCity(e.target.value) }}>
            <option value="">All</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Source{' '}
          <select value={source} onChange={(e) => { setPage(1); setSource(e.target.value) }}>
            <option value="">All</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p style={{ color: theme.danger }}>{error}</p>}
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  )
}
