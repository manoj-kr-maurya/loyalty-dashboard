import { useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { request } from '../lib/api'
import { extractError } from '../lib/api'
import { getOrg } from '../lib/auth'
import { useToast } from '../components/Toast'

interface Operation {
  key: string
  group: string
  label: string
  method: 'get' | 'post' | 'put' | 'delete'
  path: string
  pathParams?: string[]
  query?: string[]
  body?: unknown
}

const ORG = () => getOrg<{ id?: string }>()?.id ?? ''

const OPERATIONS: Operation[] = [
  // FX
  { key: 'fx.convert', group: 'FX', label: 'Convert', method: 'post', path: '/engines/fx/convert',
    body: { fromCurrency: 'INR', toCurrency: 'PTS', amount: 100, lockRate: false, lockDurationMinutes: 60 } },
  { key: 'fx.lock', group: 'FX', label: 'Lock rate', method: 'post', path: '/engines/fx/lock-rate',
    body: { currencyCode: 'PTS', physicalCurrencyCode: 'INR', rate: 1, lockedBy: 'admin', lockDurationMinutes: 60 } },
  { key: 'fx.historical', group: 'FX', label: 'Historical rates', method: 'get', path: '/engines/fx/historical-rates/:currencyCode',
    pathParams: ['currencyCode'], query: ['physicalCurrencyCode', 'startDate', 'endDate'] },
  { key: 'fx.recon', group: 'FX', label: 'Reconciliation', method: 'get', path: '/engines/fx/reconciliation/:tenantId',
    pathParams: ['tenantId'], query: ['startDate', 'endDate'] },

  // PLB
  { key: 'plb.programs', group: 'PLB', label: 'List programs', method: 'get', path: '/engines/plb/programs/:organizationId', pathParams: ['organizationId'] },
  { key: 'plb.create', group: 'PLB', label: 'Create program', method: 'post', path: '/engines/plb/programs',
    body: { organizationId: ORG(), name: 'Platinum Bonus', metricType: 'REVENUE', cycleType: 'MONTHLY',
      cycleStart: '', cycleEnd: '', tiers: [{ level: 1, name: 'Base', minThreshold: 0, bonusType: 'PERCENTAGE', bonusValue: 5 }] } },
  { key: 'plb.metric', group: 'PLB', label: 'Record metric', method: 'post', path: '/engines/plb/metrics',
    body: { organizationId: ORG(), programId: '', customerId: '', metricValue: 10000, periodStart: '', periodEnd: '' } },
  { key: 'plb.calculate', group: 'PLB', label: 'Calculate bonus', method: 'post', path: '/engines/plb/calculate',
    body: { organizationId: ORG(), programId: '', customerId: '', periodStart: '', periodEnd: '' } },
  { key: 'plb.evaluate', group: 'PLB', label: 'Evaluate cycle', method: 'post', path: '/engines/plb/evaluate-cycle',
    body: { organizationId: ORG(), customerId: '', periodStart: '', periodEnd: '' } },
  { key: 'plb.statement', group: 'PLB', label: 'Statement', method: 'post', path: '/engines/plb/statement',
    body: { organizationId: ORG(), customerId: '', periodStart: '', periodEnd: '' } },

  // Value exchange
  { key: 'vx.agreements', group: 'Value Exchange', label: 'List agreements', method: 'get', path: '/engines/value-exchange/agreements/:sourceEntityId', pathParams: ['sourceEntityId'] },
  { key: 'vx.create', group: 'Value Exchange', label: 'Create agreement', method: 'post', path: '/engines/value-exchange/agreements',
    body: { sourceEntityId: '', targetEntityId: '', name: 'Partner exchange', sourceCurrency: 'PTS', targetCurrency: 'MILES', conversionRatio: 1 } },
  { key: 'vx.quote', group: 'Value Exchange', label: 'Quote', method: 'post', path: '/engines/value-exchange/quote',
    body: { agreementId: '', sourceEntityId: '', sourceCustomerId: '', sourceAmount: 100 } },
  { key: 'vx.execute', group: 'Value Exchange', label: 'Execute', method: 'post', path: '/engines/value-exchange/execute',
    body: { quoteId: '', sourceEntityId: '', sourceCustomerId: '' } },
  { key: 'vx.reverse', group: 'Value Exchange', label: 'Reverse', method: 'post', path: '/engines/value-exchange/reverse',
    body: { orderId: '', sourceEntityId: '', reason: '' } },
  { key: 'vx.history', group: 'Value Exchange', label: 'Order history', method: 'get', path: '/engines/value-exchange/orders/:sourceCustomerId/:sourceEntityId', pathParams: ['sourceCustomerId', 'sourceEntityId'] },

  // Promo engine
  { key: 'pe.codes', group: 'Promo Engine', label: 'Generate codes', method: 'post', path: '/engines/promo/codes',
    body: { organizationId: ORG(), programId: '', count: 5, isUserSpecific: false } },
  { key: 'pe.validate', group: 'Promo Engine', label: 'Validate', method: 'post', path: '/engines/promo/validate',
    body: { organizationId: ORG(), code: '', cartValue: 100 } },
  { key: 'pe.redeem', group: 'Promo Engine', label: 'Redeem', method: 'post', path: '/engines/promo/redeem',
    body: { organizationId: ORG(), code: '', customerId: '', cartValue: 100 } },
  { key: 'pe.stacking', group: 'Promo Engine', label: 'Stacking', method: 'post', path: '/engines/promo/stacking',
    body: { organizationId: ORG(), codes: [], cartValue: 100 } },
  { key: 'pe.redemptions', group: 'Promo Engine', label: 'Redemptions', method: 'get', path: '/engines/promo/redemptions/:customerId/:organizationId', pathParams: ['customerId', 'organizationId'] },

  // Legacy points
  { key: 'pt.create', group: 'Legacy Points', label: 'Create program', method: 'post', path: '/loyalty-programs/program/create', body: { organizationId: ORG(), name: 'Legacy program' } },
  { key: 'pt.eligible', group: 'Legacy Points', label: 'Eligible', method: 'post', path: '/loyalty-programs/eligible', body: { organizationId: ORG(), customerId: '' } },
  { key: 'pt.calculate', group: 'Legacy Points', label: 'Calculate', method: 'post', path: '/loyalty-programs/calculate', body: { organizationId: ORG(), customerId: '', amount: 100 } },
  { key: 'pt.block', group: 'Legacy Points', label: 'Block', method: 'post', path: '/loyalty-programs/block', body: { organizationId: ORG(), customerId: '', points: 100 } },
  { key: 'pt.award', group: 'Legacy Points', label: 'Award', method: 'post', path: '/loyalty-programs/award', body: { organizationId: ORG(), customerId: '', points: 100 } },
  { key: 'pt.reverse', group: 'Legacy Points', label: 'Reverse', method: 'post', path: '/loyalty-programs/reverse', body: { organizationId: ORG(), customerId: '', points: 100 } },
  { key: 'pt.expire', group: 'Legacy Points', label: 'Expire', method: 'post', path: '/loyalty-programs/expire', body: { organizationId: ORG(), currencyCode: '' } },
]

const GROUPS = [...new Set(OPERATIONS.map((o) => o.group))]

export default function Engines() {
  const [selectedKey, setSelectedKey] = useState(OPERATIONS[0].key)
  const op = useMemo(() => OPERATIONS.find((o) => o.key === selectedKey)!, [selectedKey])
  const [pathValues, setPathValues] = useState<Record<string, string>>({})
  const [queryValues, setQueryValues] = useState<Record<string, string>>({})
  const [body, setBody] = useState(JSON.stringify(op.body ?? {}, null, 2))
  const [result, setResult] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  function selectOp(key: string) {
    const next = OPERATIONS.find((o) => o.key === key)!
    setSelectedKey(key)
    setPathValues({})
    setQueryValues({})
    setBody(JSON.stringify(next.body ?? {}, null, 2))
    setResult(null)
  }

  async function run() {
    setBusy(true)
    setResult(null)
    try {
      let url = op.path
      op.pathParams?.forEach((p) => { url = url.replace(`:${p}`, encodeURIComponent(pathValues[p] ?? '')) })
      const qs = new URLSearchParams()
      op.query?.forEach((q) => { if (queryValues[q]) qs.set(q, queryValues[q]) })
      url += qs.toString() ? `?${qs.toString()}` : ''

      let parsed: unknown
      if (op.method !== 'get') {
        try {
          parsed = body.trim() ? JSON.parse(body) : undefined
        } catch {
          addToast('error', 'Request body is not valid JSON.')
          setBusy(false)
          return
        }
      }
      const res = await request<unknown>(op.method, url, parsed)
      setResult(res)
      addToast('success', 'Request completed.')
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Engines</h1>
        <p className="mt-1 text-sm text-slate-500">
          Advanced operations for the FX, PLB, value-exchange, promo and legacy points engines.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <div>
            <label className="label">Operation</label>
            <select className="input" value={selectedKey} onChange={(e) => selectOp(e.target.value)}>
              {GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {OPERATIONS.filter((o) => o.group === g).map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-400 font-mono">{op.method.toUpperCase()} {op.path}</p>

          {op.pathParams?.map((p) => (
            <div key={p}>
              <label className="label">{p}</label>
              <input
                className="input"
                value={pathValues[p] ?? ''}
                onChange={(e) => setPathValues((v) => ({ ...v, [p]: e.target.value }))}
                placeholder={p === 'organizationId' ? ORG() : ''}
              />
            </div>
          ))}

          {op.query?.map((q) => (
            <div key={q}>
              <label className="label">{q}</label>
              <input
                className="input"
                value={queryValues[q] ?? ''}
                onChange={(e) => setQueryValues((v) => ({ ...v, [q]: e.target.value }))}
                placeholder={q.toLowerCase().includes('date') ? '2026-01-01' : ''}
              />
            </div>
          ))}

          {op.method !== 'get' && (
            <div>
              <label className="label">Request body (JSON)</label>
              <textarea
                className="input min-h-[220px] font-mono text-xs"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          )}

          <button className="btn-primary" onClick={run} disabled={busy}>
            <Play className="h-4 w-4" /> {busy ? 'Running…' : 'Run'}
          </button>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Response</h2>
          {result === null ? (
            <p className="text-sm text-slate-500">Run an operation to see the response.</p>
          ) : (
            <pre className="max-h-[520px] overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-200">
{JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
