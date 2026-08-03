import type { HealthResponse } from '@buildy/shared-types'

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '')

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
    throw new Error(`API ${response.status}: ${response.statusText}`)
  }

  return (await response.json()) as T
}

/** Single typed API client — screens must not call fetch directly. */
export const apiClient = {
  getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health')
  },
}
