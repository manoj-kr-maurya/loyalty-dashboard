import { request } from './api'
import type { ApiResponse, Campaign, CouponCode, CurrencyBucket, Customer, MetaFlags, Organization, Promo, PromoRule, ValidateCodeResponse } from './types'

function getOrgId(): string {
  const org = JSON.parse(localStorage.getItem('loyalty_admin_org') || '{}')
  return org.id ?? ''
}

export async function requestOrgOtp(payload: { countryCode: string; phoneNumber: string; name?: string }) {
  const res = await request<ApiResponse<string>>('post', '/organization/otp/phone', payload)
  return res.data
}

export async function verifyOrgOtp(payload: { id: string; otp: string }) {
  const res = await request<ApiResponse<{ organization: Organization; metaFlags: MetaFlags }>>(
    'post',
    '/organization/otp/validate',
    payload,
  )
  return res.data
}

export async function fetchOrganization() {
  const res = await request<ApiResponse<{ organization: Organization; metaFlags: MetaFlags }>>(
    'get',
    `/organization/?organizationId=${getOrgId()}`,
  )
  return res.data
}

export async function fetchCurrencyBuckets() {
  const res = await request<ApiResponse<CurrencyBucket[]>>(
    'get',
    `/currency/get-organization-currency-buckets?organizationId=${getOrgId()}`,
  )
  return res.data
}

export async function fetchCampaigns() {
  const res = await request<ApiResponse<Campaign[]>>(
    'get',
    `/campaign/get-organization-level-campaigns?organizationId=${getOrgId()}`,
  )
  return res.data
}

export async function fetchCustomers() {
  const res = await request<{ status: string; data: Customer[]; metadata?: unknown }>(
    'get',
    '/admin/fetch-all-customers',
  )
  return res.data
}

export async function fetchPromos() {
  const res = await request<Promo[]>('get', `/promo/?organizationId=${getOrgId()}`)
  return res
}

export async function createPromo(payload: {
  name: string
  description: string
  rewardType: string
  validFrom: string
  validTo: string
  minBankAmount?: number
  businessType?: string[]
  maxClaimsPerUser?: number
  maxClaimsTotal?: number
}) {
  const res = await request<Promo>('post', '/promo/create', {
    organizationId: getOrgId(),
    ...payload,
  })
  return res
}

export async function fetchPromoById(id: string) {
  return await request<Promo & { rules?: PromoRule[] }>('get', `/promo/${id}`)
}

export async function updatePromo(id: string, payload: {
  name: string
  description: string
  rewardType: string
  validFrom: string
  validTo: string
  status?: string
  minBankAmount?: number
  businessType?: string[]
  maxClaimsPerUser?: number
  maxClaimsTotal?: number
}) {
  return await request<Promo>('post', `/promo/${id}/update`, payload)
}

export async function upsertPromoRules(id: string, rules: {
  name: string
  rewardType: string
  rewardMode: string
  value: number
  conditions: unknown
  threshold?: number
  ratioBase?: number
  meta?: unknown
}[]) {
  return await request<PromoRule[]>('post', `/promo/${id}/rules`, { rules })
}

// ─── Coupon Code (Auto-generated) ─────────────────────────────

export async function generateCouponCodes(programId: string, options: {
  isUserSpecific?: boolean
  count?: number
  codeLength?: number
  prefix?: string
  customerId?: string
  maxUses?: number
  expiresAt?: string
}) {
  return await request<CouponCode[]>('post', '/promo/codes/generate', {
    programId,
    isUserSpecific: options.isUserSpecific ?? true,
    count: options.count ?? 1,
    codeLength: options.codeLength ?? 8,
    prefix: options.prefix,
    customerId: options.customerId,
    maxUses: options.maxUses ?? 1,
    expiresAt: options.expiresAt,
  })
}

export async function validateCouponCode(code: string, options?: {
  customerId?: string
  cartValue?: number
  cartCategories?: string[]
  isBankOffer?: boolean
}) {
  return await request<ValidateCodeResponse>('post', '/promo/codes/validate', {
    code,
    ...options,
  })
}

export async function allocateCouponCode(programId: string, customerId: string) {
  return await request<CouponCode>('post', '/promo/codes/allocate', { programId, customerId })
}

export async function claimCouponCode(code: string, customerId: string, transactionRef?: string) {
  return await request<CouponCode>('post', '/promo/codes/claim', { code, customerId, transactionRef })
}

export async function listCouponCodes(programId: string, customerId?: string) {
  const qs = customerId ? `?customerId=${customerId}` : ''
  return await request<CouponCode[]>('get', `/promo/codes/${programId}${qs}`)
}

export async function getCustomerCouponCode(programId: string, customerId: string) {
  return await request<CouponCode>('get', `/promo/codes/${programId}/customer/${customerId}`)
}
