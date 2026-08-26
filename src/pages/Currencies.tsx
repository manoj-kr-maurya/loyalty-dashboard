import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { fetchCurrencyBuckets } from '../lib/endpoints'
import { create, addBucketBalance } from '../lib/actions'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeletons'
import type { CurrencyBucket } from '../lib/types'

export default function Currencies() {
  const { data: buckets, loading, refetch } = useFetch<CurrencyBucket[]>(fetchCurrencyBuckets)
  const [showCreate, setShowCreate] = useState(false)
  const [currencyCode, setCurrencyCode] = useState('')
  const [name, setName] = useState('')
  const [topUpTarget, setTopUpTarget] = useState('')
  const [topUpAmount, setTopUpAmount] = useState(0)
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  const totalAvailable = useMemo(() => (buckets ?? []).reduce((s, b) => s + b.availableAmount, 0), [buckets])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await create(currencyCode, name)
      addToast('success', 'Currency created.')
      setCurrencyCode('')
      setName('')
      setShowCreate(false)
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleTopUp(e: React.FormEvent, bucket: CurrencyBucket) {
    e.preventDefault()
    setBusy(true)
    try {
      await addBucketBalance(bucket.code, topUpAmount)
      addToast('success', `Added ${topUpAmount} to ${bucket.code}`)
      topUpRef()
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  function topUpRef() {
    setTopUpTarget('')
    setTopUpAmount(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Currencies</h1>
          <p className="mt-1 text-sm text-slate-500">{totalAvailable.toLocaleString()} points available across all buckets.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="h-4 w-4" /> Create currency
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">New currency</h2>
          <div>
            <label className="label">Code</label>
            <input className="input" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} placeholder="e.g. PTS" required />
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Points" required />
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !buckets?.length ? (
        <p className="text-slate-500">No currency buckets yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {buckets.map((b) => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{b.code}</p>
                  {b.autoTopUpEnabled ? (
                    <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Auto top-up on</span>
                  ) : null}
                </div>
                <span className="text-sm text-slate-500">bucket</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xl font-semibold text-slate-900">{b.availableAmount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Available</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xl font-semibold text-slate-900">{b.distributedAmount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Distributed</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xl font-semibold text-slate-900">{b.receivedAmount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Received</p>
                </div>
              </div>

              <form onSubmit={(e) => handleTopUp(e, b)} className="mt-4 flex items-end gap-2">
                <div className="flex-1">
                  <label className="label">Add balance</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={topUpTarget === b.code ? topUpAmount : ''}
                    onFocus={() => setTopUpTarget(b.code)}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    placeholder="Amount"
                  />
                </div>
                <button className="btn-primary" disabled={busy || !(topUpTarget === b.code && topUpAmount > 0)}>
                  Add
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}