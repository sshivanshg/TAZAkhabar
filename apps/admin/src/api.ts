import type {
  AdminArticleResponse,
  AdminLoginResponse,
  AdminSourceResponse,
  CityResponse,
  DocumentUploadResponseDto,
  IngestionRunResponseDto,
  PagedAdminArticlesResponse,
  PagedDocumentUploadsResponse,
  PagedIngestionRunsResponse,
} from '@tazakhabar/shared-types'
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
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
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

export type AdminArticle = {
  id: number
  cityId: number
  headline: string
  summary: string
  sourceName: string
  sourceUrl: string
  publishedAt: string
  category: string
  imageUrl?: string | null
  status: string
  isMock: boolean
  ingestedAt?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  sourceId?: number | null
  detectedLanguage?: string | null
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
  feedUrl?: string | null
  cityId: number
  citySlug?: string
  type: string
  kind: string
  language: string
  isActive: boolean
  lastFetchedAt?: string | null
  lastFetchStatus?: string | null
  lastErrorMessage?: string | null
}

export type IngestionRun = {
  id: number
  sourceId: number
  startedAt: string
  completedAt?: string | null
  articlesFound: number
  articlesAdded: number
  articlesSkipped: number
  articlesFailed: number
  errorSummary?: string | null
}

export type City = {
  id: number
  name: string
  state: string
  slug: string
}

export type IngestionEvent = {
  type: string
  message: string
  at: string
  found?: number | null
  added?: number | null
  skipped?: number | null
  failed?: number | null
}

export type DocumentUpload = {
  id: number
  originalFileName: string
  contentType: string
  byteSize: number
  cityHintId?: number | null
  status: string
  errorSummary?: string | null
  ingestionRunId?: number | null
  createdAt: string
  processedAt?: string | null
  articlesCreated: number
}

function mapArticle(a: AdminArticleResponse): AdminArticle {
  return {
    id: a.id ?? 0,
    cityId: a.cityId ?? 0,
    headline: a.headline ?? '',
    summary: a.summary ?? '',
    sourceName: a.sourceName ?? '',
    sourceUrl: a.sourceUrl ?? '',
    publishedAt: a.publishedAt ?? '',
    category: a.category ?? '',
    imageUrl: a.imageUrl,
    status: a.status ?? '',
    isMock: a.isMock ?? false,
    ingestedAt: a.ingestedAt,
    reviewedBy: a.reviewedBy,
    reviewedAt: a.reviewedAt,
    sourceId: a.sourceId,
    detectedLanguage: a.detectedLanguage,
  }
}

function mapSource(s: AdminSourceResponse): AdminSource {
  return {
    id: s.id ?? 0,
    name: s.name ?? '',
    feedUrl: s.feedUrl,
    cityId: s.cityId ?? 0,
    citySlug: s.citySlug,
    type: s.type ?? '',
    kind: s.kind ?? '',
    language: s.language ?? '',
    isActive: s.isActive ?? false,
    lastFetchedAt: s.lastFetchedAt,
    lastFetchStatus: s.lastFetchStatus,
    lastErrorMessage: s.lastErrorMessage,
  }
}

function mapRun(r: IngestionRunResponseDto): IngestionRun {
  return {
    id: r.id ?? 0,
    sourceId: r.sourceId ?? 0,
    startedAt: r.startedAt ?? '',
    completedAt: r.completedAt,
    articlesFound: r.articlesFound ?? 0,
    articlesAdded: r.articlesAdded ?? 0,
    articlesSkipped: r.articlesSkipped ?? 0,
    articlesFailed: r.articlesFailed ?? 0,
    errorSummary: r.errorSummary,
  }
}

function mapUpload(u: DocumentUploadResponseDto): DocumentUpload {
  return {
    id: u.id ?? 0,
    originalFileName: u.originalFileName ?? '',
    contentType: u.contentType ?? '',
    byteSize: u.byteSize ?? 0,
    cityHintId: u.cityHintId,
    status: u.status ?? '',
    errorSummary: u.errorSummary,
    ingestionRunId: u.ingestionRunId,
    createdAt: u.createdAt ?? '',
    processedAt: u.processedAt,
    articlesCreated: u.articlesCreated ?? 0,
  }
}

export const api = {
  login: async (password: string, displayName: string) => {
    const res = await request<AdminLoginResponse>('/api/admin/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ password, displayName }),
    })
    if (!res.token || !res.expiresAt) throw new ApiError(500, 'Invalid login response')
    return { token: res.token, expiresAt: res.expiresAt }
  },

  getArticles: async (q: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    const data = await request<PagedAdminArticlesResponse>(`/api/admin/articles?${params}`)
    return {
      items: (data.items ?? []).map(mapArticle),
      total: data.total ?? 0,
      page: data.page,
      limit: data.limit,
    } satisfies Paged<AdminArticle>
  },

  createArticle: async (body: Record<string, unknown>) =>
    mapArticle(
      await request<AdminArticleResponse>('/api/admin/articles', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  patchArticle: async (id: number, body: Record<string, unknown>) =>
    mapArticle(
      await request<AdminArticleResponse>(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    ),

  publishArticle: async (id: number) =>
    mapArticle(await request<AdminArticleResponse>(`/api/admin/articles/${id}/publish`, { method: 'POST' })),

  rejectArticle: async (id: number) =>
    mapArticle(await request<AdminArticleResponse>(`/api/admin/articles/${id}/reject`, { method: 'POST' })),

  archiveArticle: async (id: number) =>
    mapArticle(await request<AdminArticleResponse>(`/api/admin/articles/${id}/archive`, { method: 'POST' })),

  uploadDocument: async (file: File, cityHintId?: number) => {
    const form = new FormData()
    form.append('file', file)
    if (cityHintId != null && cityHintId > 0) {
      form.append('cityHintId', String(cityHintId))
    }
    return mapUpload(
      await request<DocumentUploadResponseDto>('/api/admin/uploads', {
        method: 'POST',
        body: form,
      }),
    )
  },

  listUploads: async (page: number) => {
    const data = await request<PagedDocumentUploadsResponse>(`/api/admin/uploads?page=${page}`)
    return {
      items: (data.items ?? []).map(mapUpload),
      total: data.total ?? 0,
      page: data.page,
      limit: data.pageSize,
    } satisfies Paged<DocumentUpload>
  },

  getSources: async () => {
    const data = await request<AdminSourceResponse[]>('/api/admin/sources')
    return data.map(mapSource)
  },

  createSource: async (body: Record<string, unknown>) =>
    mapSource(
      await request<AdminSourceResponse>('/api/admin/sources', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  patchSource: async (id: number, body: Record<string, unknown>) =>
    mapSource(
      await request<AdminSourceResponse>(`/api/admin/sources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    ),

  triggerSource: async (id: number) => {
    const headers = new Headers()
    const token = getToken()
    if (!token) throw new ApiError(401, 'Not authenticated')
    headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${API_BASE}/api/admin/sources/${id}/trigger`, {
      method: 'POST',
      headers,
    })
    if (res.status === 401) {
      clearSession()
      window.location.assign('/login')
      throw new ApiError(401, 'Unauthorized')
    }
    if (!res.ok && res.status !== 202) {
      let detail = res.statusText
      try {
        const problem = (await res.json()) as { detail?: string; title?: string }
        detail = problem.detail ?? problem.title ?? detail
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, detail)
    }
    return mapRun(await res.json())
  },

  streamIngestionEvents: async function* (
    runId: number,
    signal?: AbortSignal,
  ): AsyncGenerator<IngestionEvent> {
    const token = getToken()
    if (!token) throw new ApiError(401, 'Not authenticated')
    const res = await fetch(`${API_BASE}/api/admin/ingestion-runs/${runId}/events`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      signal,
    })
    if (res.status === 401) {
      clearSession()
      window.location.assign('/login')
      throw new ApiError(401, 'Unauthorized')
    }
    if (!res.ok || !res.body) {
      throw new ApiError(res.status, 'Failed to open event stream')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''
      for (const chunk of chunks) {
        const dataLine = chunk
          .split('\n')
          .find((l) => l.startsWith('data:'))
        if (!dataLine) continue
        const json = dataLine.slice(5).trim()
        if (!json) continue
        const raw = JSON.parse(json) as {
          type?: string
          message?: string
          at?: string
          found?: number | null
          added?: number | null
          skipped?: number | null
          failed?: number | null
        }
        yield {
          type: raw.type ?? 'progress',
          message: raw.message ?? '',
          at: raw.at ?? new Date().toISOString(),
          found: raw.found,
          added: raw.added,
          skipped: raw.skipped,
          failed: raw.failed,
        }
      }
    }
  },

  getIngestionRuns: async (q: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    const data = await request<PagedIngestionRunsResponse>(`/api/admin/ingestion-runs?${params}`)
    return {
      items: (data.items ?? []).map(mapRun),
      total: data.total ?? 0,
      page: data.page,
      limit: data.limit,
    } satisfies Paged<IngestionRun>
  },

  getCities: async () => {
    const data = await request<CityResponse[]>('/api/cities', { auth: false })
    return data.map(
      (c): City => ({
        id: c.id ?? 0,
        name: c.name ?? '',
        state: c.state ?? '',
        slug: c.slug ?? '',
      }),
    )
  },
}
