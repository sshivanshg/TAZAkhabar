import { useEffect, useState, type FormEvent } from 'react'
import { api, type AdminSource, type City } from '../api'
import { DataTable, StatusBadge, type Column } from '../components/DataTable'
import { theme } from '../theme'

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

  async function runNow(id: number) {
    try {
      await api.triggerSource(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trigger failed')
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
    { key: 'name', header: 'Name', render: (r) => r.name },
    { key: 'type', header: 'Type', render: (r) => r.type, width: '72px' },
    { key: 'city', header: 'City', render: (r) => cityName(r.cityId) },
    {
      key: 'url',
      header: 'URL',
      render: (r) => <span style={{ fontSize: 12, wordBreak: 'break-all' }}>{r.feedUrl ?? '—'}</span>,
    },
    {
      key: 'active',
      header: 'Active',
      render: (r) => (
        <input type="checkbox" checked={r.isActive} onChange={() => void toggleActive(r)} />
      ),
    },
    {
      key: 'status',
      header: 'Last fetch',
      render: (r) => (
        <div style={{ fontSize: 12 }}>
          {r.lastFetchStatus ? <StatusBadge status={r.lastFetchStatus === 'Error' ? 'Rejected' : 'Published'} /> : '—'}
          <div style={{ color: theme.textMuted, marginTop: 4 }}>
            {r.lastFetchedAt ? new Date(r.lastFetchedAt).toLocaleString() : 'never'}
          </div>
        </div>
      ),
    },
    {
      key: 'run',
      header: '',
      render: (r) => (
        <button type="button" disabled={!r.isActive || !isTriggerable(r.type)} onClick={() => void runNow(r.id)}>
          Run now
        </button>
      ),
    },
  ]

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: 22 }}>Sources</h1>
      {error && <p style={{ color: theme.danger }}>{error}</p>}
      <DataTable columns={columns} rows={rows} page={1} pageSize={100} total={rows.length} onPageChange={() => {}} />

      <h2 style={{ fontSize: 16, marginTop: 28 }}>Add source</h2>
      <form onSubmit={(e) => void onAdd(e)} style={{ display: 'grid', gap: 10, maxWidth: 480 }}>
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
        <button type="submit" style={{ background: theme.accent, color: '#fff', border: 'none', padding: 10, borderRadius: 6 }}>
          Add {sourceType === 'Scrape' ? 'scrape' : 'RSS'} source
        </button>
      </form>
    </div>
  )
}
