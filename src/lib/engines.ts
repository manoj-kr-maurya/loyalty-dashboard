import { request } from './api'
import { getOrg } from './auth'

function orgId(): string {
  return getOrg<{ id?: string }>()?.id ?? ''
}

// ─── Loyalty engine (earn / burn / estimate / expire / statement / ledger) ───

export interface LedgerEntry {
  id: string
  type: string
  amount: number
  currencyCode?: string
  reference?: string | null
  createdAt: string
  balanceAfter?: number
  [key: string]: unknown
}

export async function earnPoints(payload: {
  customerId: string
  amount: number
  currencyCode: string
  orderRef?: string
  expiryDate?: string
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}) {
  return await request<unknown>('post', '/engines/loyalty/earn', { organizationId: orgId(), ...payload })
}

export async function burnPoints(payload: {
  customerId: string
  points: number
  currencyCode: string
  orderRef?: string
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}) {
  return await request<unknown>('post', '/engines/loyalty/burn', { organizationId: orgId(), ...payload })
}

export async function estimatePoints(payload: { customerId: string; amount: number; currencyCode?: string }) {
  return await request<unknown>('post', '/engines/loyalty/estimate', { organizationId: orgId(), ...payload })
}

export async function expirePoints(payload: { currencyCode: string; expiryDate: string }) {
  return await request<unknown>('post', '/engines/loyalty/expire', { organizationId: orgId(), ...payload })
}

export async function generateStatement(payload: {
  customerId: string
  currencyCode?: string
  periodStart: string
  periodEnd: string
}) {
  return await request<unknown>('post', '/engines/loyalty/statement', { organizationId: orgId(), ...payload })
}

export async function fetchLedger(
  customerId: string,
  query: { currencyCode?: string; from?: string; to?: string; page?: number; limit?: number } = {},
) {
  const params = new URLSearchParams({ organizationId: orgId() })
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })
  return await request<{ status: string; data: LedgerEntry[]; metadata?: unknown }>(
    'get',
    `/engines/loyalty/ledger/${customerId}?${params.toString()}`,
  )
}

export async function fetchTierStatus(customerId: string) {
  return await request<unknown>('get', `/engines/loyalty/tier-status/${customerId}/${orgId()}`)
}

// ─── FX engine ───────────────────────────────────────────────

export async function fxConvert(payload: {
  fromCurrency: string
  toCurrency: string
  amount: number
  lockRate?: boolean
  lockDurationMinutes?: number
}) {
  return await request<unknown>('post', '/engines/fx/convert', payload)
}

export async function fxLockRate(payload: {
  currencyCode: string
  physicalCurrencyCode: string
  rate: number
  lockedBy: string
  lockDurationMinutes: number
}) {
  return await request<unknown>('post', '/engines/fx/lock-rate', payload)
}

export async function fxHistoricalRates(
  currencyCode: string,
  query: { physicalCurrencyCode: string; startDate: string; endDate: string },
) {
  const params = new URLSearchParams(query)
  return await request<unknown>('get', `/engines/fx/historical-rates/${currencyCode}?${params.toString()}`)
}

export async function fxReconciliation(tenantId: string, query: { startDate: string; endDate: string }) {
  const params = new URLSearchParams(query)
  return await request<unknown>('get', `/engines/fx/reconciliation/${tenantId}?${params.toString()}`)
}

// ─── PLB engine ──────────────────────────────────────────────

export async function plbCreateProgram(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/plb/programs', { organizationId: orgId(), ...payload })
}

export async function plbListPrograms() {
  return await request<unknown>('get', `/engines/plb/programs/${orgId()}`)
}

export async function plbRecordMetric(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/plb/metrics', { organizationId: orgId(), ...payload })
}

export async function plbCalculate(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/plb/calculate', { organizationId: orgId(), ...payload })
}

export async function plbEvaluateCycle(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/plb/evaluate-cycle', { organizationId: orgId(), ...payload })
}

export async function plbStatement(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/plb/statement', { organizationId: orgId(), ...payload })
}

// ─── Value exchange engine ───────────────────────────────────

export async function vxCreateAgreement(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/value-exchange/agreements', payload)
}

export async function vxListAgreements(sourceEntityId: string) {
  return await request<unknown>('get', `/engines/value-exchange/agreements/${sourceEntityId}`)
}

export async function vxQuote(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/value-exchange/quote', payload)
}

export async function vxExecute(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/value-exchange/execute', payload)
}

export async function vxReverse(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/value-exchange/reverse', payload)
}

export async function vxOrderHistory(sourceCustomerId: string, sourceEntityId: string) {
  return await request<unknown>(
    'get',
    `/engines/value-exchange/orders/${sourceCustomerId}/${sourceEntityId}`,
  )
}

// ─── Promo engine ────────────────────────────────────────────

export async function promoEngineCodes(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/promo/codes', payload)
}

export async function promoEngineValidate(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/promo/validate', payload)
}

export async function promoEngineRedeem(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/promo/redeem', payload)
}

export async function promoEngineStacking(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/engines/promo/stacking', payload)
}

export async function promoEngineRedemptions(customerId: string) {
  return await request<unknown>('get', `/engines/promo/redemptions/${customerId}/${orgId()}`)
}

// ─── Legacy points programs ──────────────────────────────────

export async function pointsProgramCreate(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/loyalty-programs/program/create', payload)
}

export async function pointsEligible(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/loyalty-programs/eligible', payload)
}

export async function pointsCalculate(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/loyalty-programs/calculate', payload)
}

export async function pointsBlock(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/loyalty-programs/block', payload)
}

export async function pointsAward(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/loyalty-programs/award', payload)
}

export async function pointsReverse(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/loyalty-programs/reverse', payload)
}

export async function pointsExpire(payload: Record<string, unknown>) {
  return await request<unknown>('post', '/loyalty-programs/expire', payload)
}
