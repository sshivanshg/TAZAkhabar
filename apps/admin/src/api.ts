import { clearSession, getToken } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.auth !== false) {
    const token = getToken()
    if (!token) throw new ApiError(401, 'Not authenticated')
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401 && options.auth !== false) {
    clearSession()
    window.location.assign('/login')
    throw new ApiError(401, 'Unauthorized')
  }
  if (!res.ok) {
    let detail = res.statusText
    try {
      const problem = (await res.json()) as { detail?: string; title?: string }
      detail = problem.detail ?? problem.title ?? detail
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export type LoginResponse = { token: string; expiresAt: string }

export type AdminArticle = {
  id: number
  cityId: number
  headline: string
  summary: string
  sourceName: string
  sourceUrl: string
  publishedAt: string
  category: string
  imageUrl: string | null
  status: string
  isMock: boolean
  ingestedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  sourceId: number | null
}

export type Paged<T> = {
  items: T[]
  total: number
  page?: number
  offset?: number
  limit?: number
}

export type AdminSource = {
  id: number
  name: string
  feedUrl: string | null
  cityId: number
  citySlug?: string
  type: string
  kind: string
  language: string
  isActive: boolean
  lastFetchedAt: string | null
  lastFetchStatus: string | null
  lastErrorMessage: string | null
}

export type IngestionRun = {
  id: number
  sourceId: number
  startedAt: string
  completedAt: string | null
  articlesFound: number
  articlesAdded: number
  articlesSkipped: number
  articlesFailed: number
  errorSummary: string | null
}

export type City = { id: number; name: string; state: string; slug: string }

export const api = {
  login: (password: string, displayName: string) =>
    request<LoginResponse>('/api/admin/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ password, displayName }),
    }),

  getArticles: (q: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    return request<Paged<AdminArticle>>(`/api/admin/articles?${params}`)
  },

  createArticle: (body: Record<string, unknown>) =>
    request<AdminArticle>('/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patchArticle: (id: number, body: Record<string, unknown>) =>
    request<AdminArticle>(`/api/admin/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  publishArticle: (id: number) =>
    request<AdminArticle>(`/api/admin/articles/${id}/publish`, { method: 'POST' }),

  rejectArticle: (id: number) =>
    request<AdminArticle>(`/api/admin/articles/${id}/reject`, { method: 'POST' }),

  getSources: () => request<AdminSource[]>('/api/admin/sources'),

  createSource: (body: Record<string, unknown>) =>
    request<AdminSource>('/api/admin/sources', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patchSource: (id: number, body: Record<string, unknown>) =>
    request<AdminSource>(`/api/admin/sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  triggerSource: (id: number) =>
    request<IngestionRun>(`/api/admin/sources/${id}/trigger`, { method: 'POST' }),

  getIngestionRuns: (q: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    return request<Paged<IngestionRun>>(`/api/admin/ingestion-runs?${params}`)
  },

  getCities: () => request<City[]>('/api/cities', { auth: false }),
}
