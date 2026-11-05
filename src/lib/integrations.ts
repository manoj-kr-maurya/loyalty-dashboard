import { request } from './api'
import { getOrg } from './auth'
import type { ApiResponse, Organization } from './types'

function orgId(): string {
  return getOrg<{ id?: string }>()?.id ?? ''
}

// ─── API Keys ────────────────────────────────────────────────

export interface ApiKeyRecord {
  id: string
  organizationId: string
  name?: string | null
  prefix: string
  scopes: string[]
  isActive: boolean
  lastUsedAt?: string | null
  expiresAt?: string | null
  revokedAt?: string | null
  createdAt: string
  updatedAt: string
  key?: string
}

export const API_KEY_SCOPES = [
  'loyalty:read',
  'loyalty:write',
  'promo:read',
  'promo:write',
  'fx:read',
  'fx:write',
  'plb:read',
  'plb:write',
  'exchange:read',
  'exchange:write',
  'webhooks:manage',
  'api-keys:manage',
] as const

export async function listApiKeys() {
  const res = await request<{ status: string; data: ApiKeyRecord[] }>(
    'get',
    `/api-keys?organizationId=${orgId()}`,
  )
  return res.data ?? []
}

export async function createApiKey(payload: { name?: string; scopes?: string[]; expiresAt?: string }) {
  const res = await request<ApiResponse<ApiKeyRecord>>('post', '/api-keys', {
    organizationId: orgId(),
    ...payload,
  })
  return res.data
}

export async function revokeApiKey(id: string) {
  return await request<ApiResponse<{ id: string; revoked: boolean }>>(
    'delete',
    `/api-keys/${id}?organizationId=${orgId()}`,
  )
}

// ─── Webhooks ────────────────────────────────────────────────

export interface WebhookEndpoint {
  id: string
  organizationId: string
  url: string
  events: string[]
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  secret?: string
}

export interface WebhookDelivery {
  id: string
  organizationId: string
  endpointId: string
  eventType?: string
  status: string
  attempts: number
  lastError?: string | null
  nextAttemptAt?: string | null
  createdAt: string
  updatedAt: string
  endpoint?: { url: string }
}

export const WEBHOOK_EVENTS = [
  'points.earned',
  'points.burned',
  'points.expired',
  'points.transferred',
  'tier.upgraded',
] as const

export async function listWebhooks(includeInactive = true) {
  const res = await request<{ status: string; data: WebhookEndpoint[] }>(
    'get',
    `/engines/loyalty/webhooks?organizationId=${orgId()}&includeInactive=${includeInactive}`,
  )
  return res.data ?? []
}

export async function createWebhook(payload: {
  url: string
  events?: string[]
  description?: string
  secret?: string
  isActive?: boolean
}) {
  return await request<WebhookEndpoint>('post', '/engines/loyalty/webhooks', {
    organizationId: orgId(),
    ...payload,
  })
}

export async function deleteWebhook(id: string) {
  return await request<unknown>('delete', `/engines/loyalty/webhooks/${id}?organizationId=${orgId()}`)
}

export async function rotateWebhookSecret(id: string) {
  const res = await request<{ status: string; data: { id: string; secret: string } }>(
    'post',
    `/engines/loyalty/webhooks/${id}/rotate-secret?organizationId=${orgId()}`,
  )
  return res.data
}

export async function testWebhook(id: string) {
  return await request<{ status: string; data: unknown }>(
    'post',
    `/engines/loyalty/webhooks/${id}/test?organizationId=${orgId()}`,
  )
}

export async function listWebhookDeliveries(id: string, page = 1, limit = 20) {
  return await request<{ status: string; data: WebhookDelivery[]; metadata?: unknown }>(
    'get',
    `/engines/loyalty/webhooks/${id}/deliveries?organizationId=${orgId()}&page=${page}&limit=${limit}`,
  )
}

export async function listWebhookDeadLetters(limit = 50) {
  const res = await request<{ status: string; data: WebhookDelivery[] }>(
    'get',
    `/engines/loyalty/webhooks/dead-letters?organizationId=${orgId()}&limit=${limit}`,
  )
  return res.data ?? []
}

export async function retryWebhookDelivery(id: string) {
  return await request<ApiResponse<{ id: string; queued: boolean }>>(
    'post',
    `/engines/loyalty/webhooks/deliveries/${id}/retry?organizationId=${orgId()}`,
  )
}

// ─── Shops ───────────────────────────────────────────────────

export interface Shop {
  id: string
  name?: string | null
  address?: string | null
  upiURI?: string | null
  contactUs?: string | null
  operationalHours?: string | null
  aboutUs?: string | null
  isVerified?: boolean
  role?: string
  phoneNumber?: string
  countryCode?: string
}

export async function fetchShops() {
  const res = await request<{ status: string; data: Shop[] }>(
    'get',
    `/shop/fetch-active-shops-by-org-id?organizationId=${orgId()}`,
  )
  return res.data ?? []
}

export async function updateShop(payload: {
  shopId: string
  name?: string
  address?: string
  upiURI?: string
  contactUs?: string
  operationalHours?: string
  aboutUs?: string
}) {
  const res = await request<ApiResponse<Shop>>('post', '/shop/update', {
    organizationId: orgId(),
    ...payload,
  })
  return res.data
}

// ─── Organization profile ────────────────────────────────────

export async function updateOrganization(payload: {
  name?: string
  address?: string
  upiURI?: string
  contactUs?: string
  operationalHours?: string
  aboutUs?: string
  base64Logo?: string
  base64Cover?: string
}) {
  const res = await request<ApiResponse<Organization>>('post', '/organization/update', {
    organizationId: orgId(),
    ...payload,
  })
  return res.data
}
