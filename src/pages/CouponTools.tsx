import { useState } from 'react'
import { useToast } from '../components/Toast'
import { extractError } from '../lib/api'
import {
  allocateCouponCode,
  claimCouponCode,
  couponBlock,
  couponCheck,
  couponRelease,
  generateCouponCodes,
  listCouponCodes,
  validateCouponCode,
} from '../lib/endpoints'
import type { CouponCode } from '../lib/types'

export default function CouponTools() {
  const [programId, setProgramId] = useState('')
  const [code, setCode] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [cartValue, setCartValue] = useState('100')
  const [count, setCount] = useState('5')
  const [codes, setCodes] = useState<CouponCode[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const { addToast } = useToast()

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true)
    try {
      setResult(await fn())
      addToast('success', `${label} completed.`)
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Coupon tools</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate, allocate, claim and validate coupon codes for a promotion.
        </p>
      </div>

      <div className="card grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Promotion ID</label>
          <input className="input" value={programId} onChange={(e) => setProgramId(e.target.value)} placeholder="rewardProgram id" />
        </div>
        <div>
          <label className="label">Code</label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVE10" />
        </div>
        <div>
          <label className="label">Customer ID</label>
          <input className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cart value</label>
            <input className="input" type="number" value={cartValue} onChange={(e) => setCartValue(e.target.value)} />
          </div>
          <div>
            <label className="label">Count</label>
            <input className="input" type="number" value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={busy || !programId} onClick={() => run('Generate', async () => {
          const res = await generateCouponCodes(programId, { isUserSpecific: false, count: Number(count), codeLength: 8 })
          setCodes(res)
          return res
        })}>Generate codes</button>
        <button className="btn-secondary" disabled={busy || !programId} onClick={() => run('List', async () => {
          const res = await listCouponCodes(programId)
          setCodes(res)
          return res
        })}>List codes</button>
        <button className="btn-secondary" disabled={busy || !code} onClick={() => run('Validate', () => validateCouponCode(code, { cartValue: Number(cartValue), customerId: customerId || undefined }))}>Validate</button>
        <button className="btn-secondary" disabled={busy || !programId || !customerId} onClick={() => run('Allocate', () => allocateCouponCode(programId, customerId))}>Allocate to customer</button>
        <button className="btn-secondary" disabled={busy || !code || !customerId} onClick={() => run('Claim', () => claimCouponCode(code, customerId))}>Claim</button>
        <button className="btn-secondary" disabled={busy || !code} onClick={() => run('Check', () => couponCheck({ couponCode: code, customerId: customerId || undefined, cartValue: Number(cartValue) }))}>Check</button>
        <button className="btn-secondary" disabled={busy || !code || !customerId} onClick={() => run('Block', () => couponBlock({ couponCode: code, customerId }))}>Block</button>
        <button className="btn-secondary" disabled={busy || !code || !customerId} onClick={() => run('Release', () => couponRelease({ couponCode: code, customerId }))}>Release</button>
      </div>

      {codes.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Codes</h2>
          <div className="flex flex-wrap gap-2">
            {codes.map((c) => (
              <button
                key={c.id}
                className="rounded-lg border border-slate-200 px-3 py-1 font-mono text-xs hover:border-brand-300"
                onClick={() => setCode(c.code)}
              >
                {c.code} <span className="text-slate-400">· {c.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {result !== null && (
        <pre className="max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-200">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
