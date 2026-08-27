const TOKEN_KEY = 'tazakhabar_admin_token'
const EXPIRES_KEY = 'tazakhabar_admin_expires'
const NAME_KEY = 'tazakhabar_admin_name'

export function getToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const expires = sessionStorage.getItem(EXPIRES_KEY)
  if (!token || !expires) return null
  if (Date.parse(expires) <= Date.now()) {
    clearSession()
    return null
  }
  return token
}

export function getDisplayName(): string | null {
  return sessionStorage.getItem(NAME_KEY)
}

export function setSession(token: string, expiresAt: string, displayName: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(EXPIRES_KEY, expiresAt)
  sessionStorage.setItem(NAME_KEY, displayName)
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRES_KEY)
  sessionStorage.removeItem(NAME_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
