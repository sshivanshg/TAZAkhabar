import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, type City, type DocumentUpload } from '../api'
import { DataTable, StatusBadge, type Column } from '../components/DataTable'
import { theme } from '../theme'

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp'
const IN_FLIGHT = new Set(['Queued', 'Processing'])

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadsPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<DocumentUpload[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [cities, setCities] = useState<City[]>([])
  const [cityHintId, setCityHintId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.listUploads(page)
      setRows(data.items)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void api.getCities().then(setCities)
  }, [])

  const polling = rows.some((r) => IN_FLIGHT.has(r.status))
  useEffect(() => {
    if (!polling) return
    const id = window.setInterval(() => {
      void load()
    }, 3000)
    return () => window.clearInterval(id)
  }, [polling, load])

  async function upload(file: File) {
    setError(null)
    setBusy(true)
    try {
      const hint = cityHintId ? Number(cityHintId) : undefined
      await api.uploadDocument(file, hint)
      if (page !== 1) setPage(1)
      else await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void upload(file)
  }

  const cityName = (id?: number | null) =>
    id == null ? '—' : (cities.find((c) => c.id === id)?.name ?? String(id))

  const columns: Column<DocumentUpload>[] = [
    {
      key: 'file',
      header: 'File',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.originalFileName}</div>
          <div style={{ color: theme.textMuted, fontSize: 12 }}>
            {formatBytes(r.byteSize)} · {r.contentType}
          </div>
        </div>
      ),
    },
    { key: 'city', header: 'City hint', render: (r) => cityName(r.cityHintId), width: '110px' },
    { key: 'status', header: 'Status', width: '110px', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'articles', header: 'Articles', width: '80px', render: (r) => r.articlesCreated },
    {
      key: 'created',
      header: 'Created',
      width: '160px',
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    {
      key: 'error',
      header: 'Error',
      render: (r) => (
        <span style={{ color: r.errorSummary ? theme.danger : theme.textMuted, fontSize: 12 }}>
          {r.errorSummary ?? '—'}
        </span>
      ),
    },
    {
      key: 'review',
      header: '',
      width: '90px',
      render: (r) =>
        r.articlesCreated > 0 ? (
          <Link to="/review">Review</Link>
        ) : (
          <span style={{ color: theme.textMuted }}>—</span>
        ),
    },
  ]

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: 22 }}>Uploads</h1>
      {error && <p style={{ color: theme.danger }}>{error}</p>}

      <label style={{ display: 'block', marginBottom: 12 }}>
        City hint{' '}
        <select value={cityHintId} onChange={(e) => setCityHintId(e.target.value)}>
          <option value="">None</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? theme.accent : theme.border}`,
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          background: dragging ? '#EEF1FF' : theme.surface,
          cursor: busy ? 'wait' : 'pointer',
          marginBottom: 24,
          color: theme.textSecondary,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void upload(file)
          }}
        />
        {busy ? 'Uploading…' : 'Drop a PDF or image here, or click to browse'}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={setPage}
        emptyMessage="No uploads yet"
      />
    </div>
  )
}
