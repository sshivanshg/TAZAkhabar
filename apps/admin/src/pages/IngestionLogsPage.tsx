import { useCallback, useEffect, useState } from 'react'
import { api, type AdminSource, type IngestionRun } from '../api'
import { DataTable, type Column } from '../components/DataTable'
import { useLiveRun } from '../live/LiveRunContext'

export function IngestionLogsPage() {
  const [rows, setRows] = useState<IngestionRun[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sourceId, setSourceId] = useState('')
  const [sources, setSources] = useState<AdminSource[]>([])
  const [error, setError] = useState<string | null>(null)
  const { watchRun } = useLiveRun()

  const load = useCallback(async () => {
    try {
      const data = await api.getIngestionRuns({
        sourceId: sourceId || undefined,
        page,
      })
      setRows(data.items)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [sourceId, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void api.getSources().then(setSources)
  }, [])

  useEffect(() => {
    const hasRunning = rows.some((r) => !r.completedAt)
    if (!hasRunning) return
    const id = window.setInterval(() => void load(), 2000)
    return () => window.clearInterval(id)
  }, [rows, load])

  const sourceName = (id: number) => sources.find((s) => s.id === id)?.name ?? String(id)

  const columns: Column<IngestionRun>[] = [
    { key: 'id', header: 'ID', render: (r) => <span className="num">{r.id}</span>, width: '64px' },
    { key: 'source', header: 'Source', render: (r) => sourceName(r.sourceId) },
    {
      key: 'started',
      header: 'Started',
      render: (r) => <span className="num">{new Date(r.startedAt).toLocaleString()}</span>,
    },
    {
      key: 'state',
      header: 'State',
      width: '90px',
      render: (r) => (
        <span style={{ color: r.completedAt ? 'var(--text-secondary)' : 'var(--success)', fontWeight: 600, fontSize: 12 }}>
          {r.completedAt ? 'Done' : 'Live'}
        </span>
      ),
    },
    { key: 'found', header: 'Found', render: (r) => <span className="num">{r.articlesFound}</span>, width: '70px' },
    { key: 'added', header: 'Added', render: (r) => <span className="num">{r.articlesAdded}</span>, width: '70px' },
    { key: 'skipped', header: 'Skipped', render: (r) => <span className="num">{r.articlesSkipped}</span>, width: '70px' },
    { key: 'failed', header: 'Failed', render: (r) => <span className="num">{r.articlesFailed}</span>, width: '70px' },
    {
      key: 'error',
      header: 'Error',
      render: (r) => (
        <span style={{ color: r.errorSummary ? 'var(--danger)' : 'var(--text-muted)', fontSize: 12 }}>
          {r.errorSummary ?? '—'}
        </span>
      ),
    },
    {
      key: 'watch',
      header: '',
      width: '88px',
      render: (r) => (
        <button type="button" onClick={() => watchRun(r.id, sourceName(r.sourceId))}>
          Watch
        </button>
      ),
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ingestion logs</h1>
          <p>Run history — Watch opens the live terminal (replay while events remain in memory).</p>
        </div>
      </div>

      <div className="toolbar">
        <label className="field">
          Source
          <select
            value={sourceId}
            onChange={(e) => {
              setPage(1)
              setSourceId(e.target.value)
            }}
          >
            <option value="">All</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  )
}
