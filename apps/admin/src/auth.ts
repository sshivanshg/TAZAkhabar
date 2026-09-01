const TOKEN_KEY = 'tazakhabar_admin_token'
const EXPIRES_KEY = 'tazakhabar_admin_expires'
const IDENTITY_KEY = 'tazakhabar_admin_identity'

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

export function getAdminIdentity(): string {
  return sessionStorage.getItem(IDENTITY_KEY) ?? 'Admin'
}

export function setSession(token: string, expiresAt: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(EXPIRES_KEY, expiresAt)
  sessionStorage.setItem(IDENTITY_KEY, 'Admin')
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRES_KEY)
  sessionStorage.removeItem(IDENTITY_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
