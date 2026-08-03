import type {
  ArticleResponse,
  CityResponse,
  HealthResponse,
  PagedArticlesResponse,
  ProblemDetails,
} from '@newsfeed/shared-types'

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '')

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
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
}

export type GetArticlesParams = {
  city: string
  category?: string
  q?: string
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
      search.set('q', params.q)
    }
    if (params.offset != null) {
      search.set('offset', String(params.offset))
    }
    if (params.limit != null) {
      search.set('limit', String(params.limit))
    }
    return request<PagedArticlesResponse>(`/api/articles?${search.toString()}`)
  },
}
