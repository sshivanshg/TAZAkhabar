import { useEffect, useState, type FormEvent } from 'react'
import { api, type AdminSource, type City } from '../api'
import { DataTable, StatusBadge, type Column } from '../components/DataTable'
import { useLiveRun } from '../live/LiveRunContext'

export function SourcesPage() {
  const [rows, setRows] = useState<AdminSource[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [city, setCity] = useState('jhansi')
  const [sourceType, setSourceType] = useState('Rss')
  const [kind, setKind] = useState('CityEdition')
  const [language, setLanguage] = useState('hi')
  const [runningId, setRunningId] = useState<number | null>(null)
  const { watchRun } = useLiveRun()

  const isTriggerable = (type: string) => type === 'Rss' || type === 'Scrape'

  async function load() {
    try {
      const [s, c] = await Promise.all([api.getSources(), api.getCities()])
      setRows(s)
      setCities(c)
      if (c.length && !c.some((x) => x.slug === city)) setCity(c[0].slug)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggleActive(s: AdminSource) {
    try {
      await api.patchSource(s.id, { isActive: !s.isActive })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  async function runNow(s: AdminSource) {
    setError(null)
    setRunningId(s.id)
    try {
      const run = await api.triggerSource(s.id)
      watchRun(run.id, s.name)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trigger failed')
    } finally {
      setRunningId(null)
    }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.createSource({
        name,
        feedUrl,
        city,
        type: sourceType,
        kind,
        language,
        isActive: true,
      })
      setName('')
      setFeedUrl('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  const cityName = (id: number) => cities.find((c) => c.id === id)?.name ?? String(id)

  const columns: Column<AdminSource>[] = [
    { key: 'name', header: 'Name', render: (r) => <strong style={{ fontWeight: 600 }}>{r.name}</strong> },
    { key: 'type', header: 'Type', render: (r) => <span className="num">{r.type}</span>, width: '72px' },
    { key: 'city', header: 'City', render: (r) => cityName(r.cityId) },
    {
      key: 'url',
      header: 'URL',
      render: (r) => <span style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{r.feedUrl ?? '—'}</span>,
    },
    {
      key: 'active',
      header: 'Active',
      render: (r) => (
        <input type="checkbox" checked={r.isActive} onChange={() => void toggleActive(r)} />
      ),
      width: '70px',
    },
    {
      key: 'status',
      header: 'Last fetch',
      render: (r) => (
        <div style={{ fontSize: 12 }}>
          {r.lastFetchStatus ? <StatusBadge status={r.lastFetchStatus} /> : '—'}
          <div style={{ color: 'var(--text-muted)', marginTop: 4 }} className="num">
            {r.lastFetchedAt ? new Date(r.lastFetchedAt).toLocaleString() : 'never'}
          </div>
        </div>
      ),
    },
    {
      key: 'run',
      header: '',
      width: '110px',
      render: (r) => (
        <button
          type="button"
          className="btn-primary"
          disabled={!r.isActive || !isTriggerable(r.type) || runningId === r.id}
          onClick={() => void runNow(r)}
        >
          {runningId === r.id ? 'Starting…' : 'Run now'}
        </button>
      ),
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sources</h1>
          <p>Trigger RSS or scrape runs and watch them stream in the live console.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      <DataTable columns={columns} rows={rows} page={1} pageSize={100} total={rows.length} onPageChange={() => {}} />

      <div className="page-header" style={{ marginTop: 28, marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 18 }}>Add source</h1>
        </div>
      </div>
      <form onSubmit={(e) => void onAdd(e)} className="panel" style={{ display: 'grid', gap: 12, maxWidth: 520, padding: 18 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
          <option value="Rss">RSS</option>
          <option value="Scrape">Scrape</option>
        </select>
        <input
          placeholder={sourceType === 'Scrape' ? 'Scrape URL (page to crawl)' : 'Feed URL'}
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          required
        />
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="CityEdition">CityEdition</option>
          <option value="Wider">Wider</option>
        </select>
        <input placeholder="Language" value={language} onChange={(e) => setLanguage(e.target.value)} required maxLength={8} />
        <button type="submit" className="btn-primary">
          Add {sourceType === 'Scrape' ? 'scrape' : 'RSS'} source
        </button>
      </form>
    </div>
  )
}
