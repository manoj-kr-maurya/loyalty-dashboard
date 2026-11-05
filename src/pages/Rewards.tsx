import { useState } from 'react'
import { useToast } from '../components/Toast'
import { extractError } from '../lib/api'
import {
  burnPoints,
  earnPoints,
  estimatePoints,
  expirePoints,
  fetchLedger,
  fetchTierStatus,
  generateStatement,
} from '../lib/engines'

type Tab = 'earn' | 'burn' | 'estimate' | 'expire' | 'statement' | 'ledger' | 'tier'

const TABS: { key: Tab; label: string }[] = [
  { key: 'earn', label: 'Earn' },
  { key: 'burn', label: 'Burn' },
  { key: 'estimate', label: 'Estimate' },
  { key: 'expire', label: 'Expire' },
  { key: 'statement', label: 'Statement' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'tier', label: 'Tier status' },
]

function Result({ value }: { value: unknown }) {
  if (value === null || value === undefined) return null
  return (
    <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-200">
{JSON.stringify(value, null, 2)}
    </pre>
  )
}

export default function Rewards() {
  const [tab, setTab] = useState<Tab>('earn')
  const [customerId, setCustomerId] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [amount, setAmount] = useState('1000')
  const [points, setPoints] = useState('100')
  const [orderRef, setOrderRef] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const { addToast } = useToast()

  async function run(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      let res: unknown
      if (tab === 'earn') {
        res = await earnPoints({
          customerId,
          amount: Number(amount),
          currencyCode,
          ...(orderRef ? { orderRef } : {}),
          ...(expiryDate ? { expiryDate: new Date(expiryDate).toISOString() } : {}),
        })
      } else if (tab === 'burn') {
        res = await burnPoints({
          customerId,
          points: Number(points),
          currencyCode,
          ...(orderRef ? { orderRef } : {}),
        })
      } else if (tab === 'estimate') {
        res = await estimatePoints({ customerId, amount: Number(amount), currencyCode })
      } else if (tab === 'expire') {
        res = await expirePoints({ currencyCode, expiryDate: new Date(expiryDate).toISOString() })
      } else if (tab === 'statement') {
        res = await generateStatement({
          customerId,
          currencyCode,
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
        })
      } else if (tab === 'ledger') {
        res = await fetchLedger(customerId, { currencyCode })
      } else {
        res = await fetchTierStatus(customerId)
      }
      setResult(res)
      addToast('success', 'Request completed.')
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  const needsCustomer = tab !== 'expire'
  const needsCurrency = tab !== 'tier' && tab !== 'ledger'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rewards</h1>
        <p className="mt-1 text-sm text-slate-500">
          Award, redeem, expire and inspect loyalty points through the loyalty engine.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setResult(null) }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={run} className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {needsCustomer && (
            <div>
              <label className="label">Customer ID</label>
              <input className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="customer uuid" required />
            </div>
          )}
          {needsCurrency && (
            <div>
              <label className="label">Currency code</label>
              <input className="input" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} placeholder="e.g. PTS" required />
            </div>
          )}

          {(tab === 'earn' || tab === 'estimate') && (
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
          )}
          {tab === 'burn' && (
            <div>
              <label className="label">Points</label>
              <input className="input" type="number" value={points} onChange={(e) => setPoints(e.target.value)} required />
            </div>
          )}
          {(tab === 'earn' || tab === 'burn') && (
            <div>
              <label className="label">Order reference (optional)</label>
              <input className="input" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} placeholder="ORDER-123" />
            </div>
          )}
          {(tab === 'earn' || tab === 'expire') && (
            <div>
              <label className="label">Expiry date</label>
              <input className="input" type="datetime-local" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
            </div>
          )}
          {tab === 'statement' && (
            <>
              <div>
                <label className="label">Period start</label>
                <input className="input" type="datetime-local" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
              </div>
              <div>
                <label className="label">Period end</label>
                <input className="input" type="datetime-local" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
              </div>
            </>
          )}
        </div>
        <button className="btn-primary" disabled={busy}>{busy ? 'Running…' : `Run ${TABS.find((t) => t.key === tab)?.label}`}</button>
      </form>

      <Result value={result} />
    </div>
  )
}
