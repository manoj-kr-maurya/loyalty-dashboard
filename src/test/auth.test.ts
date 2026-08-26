import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setAuth, clearAuth, isAuthenticated, getOrg, setOrg } from '../lib/auth'

describe('auth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return null when no token', () => {
    expect(getToken()).toBeNull()
  })

  it('should set and get token', () => {
    setAuth('test-token', { id: '1', name: 'Test Org' })
    expect(getToken()).toBe('test-token')
  })

  it('should return false when not authenticated', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('should return true when authenticated', () => {
    setAuth('test-token', { id: '1', name: 'Test Org' })
    expect(isAuthenticated()).toBe(true)
  })

  it('should clear auth', () => {
    setAuth('test-token', { id: '1', name: 'Test Org' })
    clearAuth()
    expect(getToken()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('should get org data', () => {
    const org = { id: '1', name: 'Test Org' }
    setAuth('test-token', org)
    expect(getOrg()).toEqual(org)
  })

  it('should set org data', () => {
    setAuth('test-token', { id: '1', name: 'Test Org' })
    setOrg({ id: '1', name: 'Updated Org' })
    expect(getOrg()).toEqual({ id: '1', name: 'Updated Org' })
  })

  it('should return null for invalid JSON in org', () => {
    localStorage.setItem('loyalty_admin_org', 'invalid-json')
    expect(getOrg()).toBeNull()
  })
})
