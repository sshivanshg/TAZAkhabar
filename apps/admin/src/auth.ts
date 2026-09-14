const TOKEN_KEY = 'khabro_admin_token'
const EXPIRES_KEY = 'khabro_admin_expires'
const IDENTITY_KEY = 'khabro_admin_identity'

const LEGACY_TOKEN_KEY = 'tazakhabar_admin_token'
const LEGACY_EXPIRES_KEY = 'tazakhabar_admin_expires'
const LEGACY_IDENTITY_KEY = 'tazakhabar_admin_identity'

function migrateLegacySession(): void {
  if (sessionStorage.getItem(TOKEN_KEY)) {
    return
  }
  const legacyToken = sessionStorage.getItem(LEGACY_TOKEN_KEY)
  const legacyExpires = sessionStorage.getItem(LEGACY_EXPIRES_KEY)
  if (!legacyToken || !legacyExpires) {
    return
  }
  sessionStorage.setItem(TOKEN_KEY, legacyToken)
  sessionStorage.setItem(EXPIRES_KEY, legacyExpires)
  sessionStorage.setItem(
    IDENTITY_KEY,
    sessionStorage.getItem(LEGACY_IDENTITY_KEY) ?? 'Admin',
  )
  sessionStorage.removeItem(LEGACY_TOKEN_KEY)
  sessionStorage.removeItem(LEGACY_EXPIRES_KEY)
  sessionStorage.removeItem(LEGACY_IDENTITY_KEY)
}

export function getToken(): string | null {
  migrateLegacySession()
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
