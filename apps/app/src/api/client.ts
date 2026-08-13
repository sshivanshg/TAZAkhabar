import type {
  ArticleResponse,
  CityResponse,
  HealthResponse,
  PagedArticlesResponse,
  ProblemDetails,
} from '@newsfeed/shared-types'

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 15000
const NETWORK_ERROR_MESSAGE = 'Check your connection and try again.'

export class ApiError extends Error {
  readonly status: number
  readonly problem?: ProblemDetails

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

function createTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms)
  }
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

function toFriendlyNetworkError(err: unknown): Error {
  if (err instanceof ApiError) {
    return err
  }
  return new Error(NETWORK_ERROR_MESSAGE)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured')
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: createTimeoutSignal(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      let problem: ProblemDetails | undefined
      try {
        problem = (await response.json()) as ProblemDetails
      } catch {
        // ignore non-JSON error bodies
      }

      throw new ApiError(
        response.status,
        problem?.detail ?? problem?.title ?? `API ${response.status}: ${response.statusText}`,
        problem,
      )
    }

    return (await response.json()) as T
  } catch (err) {
    if (err instanceof ApiError) {
      throw err
    }
    throw toFriendlyNetworkError(err)
  }
}

export type GetArticlesParams = {
  city: string
  category?: string
  q?: string
  lang?: string
  offset?: number
  limit?: number
}

/** Single typed API client — screens must not call fetch directly. */
export const apiClient = {
  getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health')
  },

  getCities(): Promise<CityResponse[]> {
    return request<CityResponse[]>('/api/cities')
  },

  getArticles(params: GetArticlesParams): Promise<PagedArticlesResponse> {
    const search = new URLSearchParams()
    search.set('city', params.city)
    if (params.category) {
      search.set('category', params.category)
    }
    if (params.q) {
      // API MaxQueryLength is 100 — truncate so Discover never hard-fails on long paste.
      search.set('q', params.q.slice(0, 100))
    }
    if (params.lang) {
      search.set('lang', params.lang)
    }
    if (params.offset != null) {
      search.set('offset', String(params.offset))
    }
    if (params.limit != null) {
      search.set('limit', String(params.limit))
    }
    return request<PagedArticlesResponse>(`/api/articles?${search.toString()}`)
  },

  getArticle(id: string, lang?: string): Promise<ArticleResponse> {
    const search = new URLSearchParams()
    if (lang) {
      search.set('lang', lang)
    }
    const qs = search.toString()
    return request<ArticleResponse>(
      `/api/articles/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`,
    )
  },
}
