import { useCallback, useEffect, useState } from 'react'
import { api, type AdminSource, type IngestionRun } from '../api'
import { DataTable, type Column } from '../components/DataTable'
import { theme } from '../theme'

export function IngestionLogsPage() {
  const [rows, setRows] = useState<IngestionRun[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sourceId, setSourceId] = useState('')
  const [sources, setSources] = useState<AdminSource[]>([])
  const [error, setError] = useState<string | null>(null)

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

  const sourceName = (id: number) => sources.find((s) => s.id === id)?.name ?? String(id)

  const columns: Column<IngestionRun>[] = [
    { key: 'id', header: 'ID', render: (r) => r.id, width: '60px' },
    { key: 'source', header: 'Source', render: (r) => sourceName(r.sourceId) },
    {
      key: 'started',
      header: 'Started',
      render: (r) => new Date(r.startedAt).toLocaleString(),
    },
    { key: 'found', header: 'Found', render: (r) => r.articlesFound, width: '70px' },
    { key: 'added', header: 'Added', render: (r) => r.articlesAdded, width: '70px' },
    { key: 'skipped', header: 'Skipped', render: (r) => r.articlesSkipped, width: '70px' },
    { key: 'failed', header: 'Failed', render: (r) => r.articlesFailed, width: '70px' },
    {
      key: 'error',
      header: 'Error',
      render: (r) => (
        <span style={{ color: r.errorSummary ? theme.danger : theme.textMuted, fontSize: 12 }}>
          {r.errorSummary ?? '—'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: 22 }}>Ingestion logs</h1>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Source{' '}
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
      {error && <p style={{ color: theme.danger }}>{error}</p>}
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  )
}
