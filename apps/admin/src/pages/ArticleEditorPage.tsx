import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type City } from '../api'
import { theme } from '../theme'

const CATEGORIES = ['Local', 'State', 'National', 'Business', 'Health', 'Sports']

export function ArticleEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const [cities, setCities] = useState<City[]>([])
  const [headline, setHeadline] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('Local')
  const [citySlug, setCitySlug] = useState('jhansi')
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void api.getCities().then((c) => {
      setCities(c)
      if (c.length && !c.some((x) => x.slug === citySlug)) setCitySlug(c[0].slug)
    })
  }, [])

  useEffect(() => {
    if (isNew) return
    const articleId = Number(id)
    void api.getArticles({ page: 1 }).then(async () => {
      // Fetch via list filter isn't ideal; load by scanning admin list or use dedicated get.
      // Prefer loading from review queue context — fetch page and find, else patch endpoints need GET by id.
      // Use articles list with high page scan — better: call PATCH after load from a helper.
    })
    void (async () => {
      try {
        // Admin GET by id isn't in spec — load pending/all pages until found, or use list with no status.
        let found = null as Awaited<ReturnType<typeof api.getArticles>>['items'][0] | null
        for (let page = 1; page <= 20 && !found; page++) {
          const batch = await api.getArticles({ page })
          found = batch.items.find((a) => a.id === articleId) ?? null
          if (batch.items.length === 0) break
        }
        if (!found) {
          setError('Article not found')
          return
        }
        setHeadline(found.headline)
        setSummary(found.summary)
        setCategory(found.category)
        setSourceName(found.sourceName)
        setSourceUrl(found.sourceUrl)
        setStatus(found.status)
        const city = (await api.getCities()).find((c) => c.id === found!.cityId)
        if (city) setCitySlug(city.slug)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load article')
      }
    })()
  }, [id, isNew])

  async function saveDraft(e?: FormEvent) {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isNew) {
        const created = await api.createArticle({
          headline,
          summary,
          category,
          city: citySlug,
          sourceName,
          sourceUrl,
          publishNow: false,
        })
        navigate(`/articles/${created.id}`, { replace: true })
      } else {
        await api.patchArticle(Number(id), { headline, summary, category, city: citySlug })
        setStatus('Draft')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    setBusy(true)
    setError(null)
    try {
      if (isNew) {
        const created = await api.createArticle({
          headline,
          summary,
          category,
          city: citySlug,
          sourceName,
          sourceUrl,
          publishNow: true,
        })
        navigate(`/articles/${created.id}`, { replace: true })
      } else {
        await api.patchArticle(Number(id), { headline, summary, category, city: citySlug })
        const updated = await api.publishArticle(Number(id))
        setStatus(updated.status)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setBusy(false)
    }
  }

  async function reject() {
    if (isNew) return
    setBusy(true)
    setError(null)
    try {
      const updated = await api.rejectArticle(Number(id))
      setStatus(updated.status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setBusy(false)
    }
  }

  const field: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ marginTop: 0, fontSize: 22 }}>{isNew ? 'New article' : 'Edit article'}</h1>
      {status && <p style={{ color: theme.textSecondary }}>Status: {status}</p>}
      {error && <p style={{ color: theme.danger }}>{error}</p>}
      <form onSubmit={(e) => void saveDraft(e)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={field}>
          Headline
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} required maxLength={300} />
        </label>
        <label style={field}>
          Summary
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} required maxLength={1000} rows={5} />
        </label>
        <label style={field}>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label style={field}>
          City
          <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)}>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label style={field}>
          Source name
          <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} required={isNew} disabled={!isNew} />
        </label>
        <label style={field}>
          Source URL
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} required={isNew} disabled={!isNew} />
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={busy}>
            Save as draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void publish()}
            style={{ background: theme.accent, color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4 }}
          >
            Publish
          </button>
          {!isNew && (
            <button type="button" disabled={busy} onClick={() => void reject()}>
              Reject
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
