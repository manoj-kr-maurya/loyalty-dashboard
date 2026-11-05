import { request } from './api'
import type { ApiResponse, Campaign, CouponCode, CurrencyBucket, LoyaltyTier, MetaFlags, Organization, Promo, PromoRule, TopCustomer, ValidateCodeResponse } from './types'

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
  const res = await request<ApiResponse<TopCustomer[]>>(
    'get',
    `/customer/leader-board/top-customers?organizationId=${getOrgId()}`,
  )
  return res.data ?? []
}

export async function fetchTiers() {
  return await request<LoyaltyTier[]>('get', `/engines/loyalty/tiers/${getOrgId()}`)
}

export async function upsertTiers(tiers: LoyaltyTier[]) {
  const res = await request<{ organizationId: string; tiers: LoyaltyTier[] }>(
    'post',
    '/engines/loyalty/tiers',
    { organizationId: getOrgId(), tiers },
  )
  return res.tiers
}

export async function fetchPromos() {
  const res = await request<Promo[]>('get', `/promo/list?organizationId=${getOrgId()}`)
  return res ?? []
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
  attributes?: Record<string, any>
  channels?: string[]
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
  attributes?: Record<string, any>
  channels?: string[]
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

export async function couponCheck(payload: { couponCode: string; customerId?: string; cartValue: number }) {
  return await request<unknown>('post', '/promo/coupon/check', { organizationId: getOrgId(), ...payload })
}

export async function couponBlock(payload: { couponCode: string; customerId: string }) {
  return await request<unknown>('post', '/promo/coupon/block', { organizationId: getOrgId(), ...payload })
}

export async function couponRelease(payload: { couponCode: string; customerId: string }) {
  return await request<unknown>('post', '/promo/coupon/release', { organizationId: getOrgId(), ...payload })
}

// ─── Currency buckets ────────────────────────────────────────

export async function createCurrencyBucket(currencyCode: string) {
  return await request<unknown>('post', '/currency/create-organization-currency-bucket', {
    organizationId: getOrgId(),
    currencyCode,
  })
}

export async function updateCurrencyBucket(payload: {
  id: string
  autoTopUpEnabled: boolean
  autoTopUpThreshold?: number
  autoTopUpAmount?: number
}) {
  return await request<unknown>('post', '/currency/update-organization-currency-bucket', {
    organizationId: getOrgId(),
    ...payload,
  })
}

export async function searchNonOrgCurrencies(substring: string) {
  return await request<unknown>(
    'get',
    `/currency/search/non-organization/${encodeURIComponent(substring)}?organizationId=${getOrgId()}`,
  )
}

// ─── Campaign update / potential earning ─────────────────────

export async function updateCampaign(payload: {
  id: string
  name: string
  earningPercentage: number
  currencyCode: string
  startDate: string
  endDate: string
  earningExpiresIn: number
  isSoftDeleted?: boolean
  force?: boolean
}) {
  return await request<unknown>('post', '/campaign/update-organization-level-campaign', {
    organizationId: getOrgId(),
    isSoftDeleted: false,
    ...payload,
  })
}

export async function potentialEarning(realAmount: number) {
  return await request<unknown>('post', '/campaign/get-active-campaigns-potential-earning', {
    organizationId: getOrgId(),
    realAmount,
  })
}
