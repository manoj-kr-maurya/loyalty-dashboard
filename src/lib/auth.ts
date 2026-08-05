const TOKEN_KEY = 'loyalty_admin_token'
const ORG_KEY = 'loyalty_admin_org'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuth(token: string, org: unknown) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ORG_KEY, JSON.stringify(org))
}

export function setOrg(org: unknown) {
  localStorage.setItem(ORG_KEY, JSON.stringify(org))
}

export function getOrg<T = unknown>(): T | null {
  const raw = localStorage.getItem(ORG_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ORG_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}