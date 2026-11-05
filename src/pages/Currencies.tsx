import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { createCurrencyBucket, fetchCurrencyBuckets, searchNonOrgCurrencies, updateCurrencyBucket } from '../lib/endpoints'
import { create } from '../lib/actions'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeletons'
import type { CurrencyBucket } from '../lib/types'

export default function Currencies() {
  const { data: buckets, loading, refetch } = useFetch<CurrencyBucket[]>(fetchCurrencyBuckets)
  const [showCreate, setShowCreate] = useState(false)
  const [showBucket, setShowBucket] = useState(false)
  const [currencyCode, setCurrencyCode] = useState('')
  const [name, setName] = useState('')
  const [bucketCode, setBucketCode] = useState('')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<unknown[]>([])
  const [busy, setBusy] = useState(false)

  const [autoTopUpFor, setAutoTopUpFor] = useState<string | null>(null)
  const [autoTopUp, setAutoTopUp] = useState({ enabled: false, threshold: '', amount: '' })

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

  async function handleAddBucket(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await createCurrencyBucket(bucketCode)
      addToast('success', `Bucket ${bucketCode} created.`)
      setBucketCode('')
      setShowBucket(false)
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = (await searchNonOrgCurrencies(search)) as { data?: unknown[] } | unknown[]
      setSearchResults(Array.isArray(res) ? res : res.data ?? [])
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  function openAutoTopUp(b: CurrencyBucket) {
    setAutoTopUpFor(b.id)
    setAutoTopUp({
      enabled: b.autoTopUpEnabled,
      threshold: b.autoTopUpThreshold != null ? String(b.autoTopUpThreshold) : '',
      amount: b.autoTopUpAmount != null ? String(b.autoTopUpAmount) : '',
    })
  }

  async function saveAutoTopUp(e: React.FormEvent) {
    e.preventDefault()
    if (!autoTopUpFor) return
    setBusy(true)
    try {
      await updateCurrencyBucket({
        id: autoTopUpFor,
        autoTopUpEnabled: autoTopUp.enabled,
        ...(autoTopUp.threshold ? { autoTopUpThreshold: Number(autoTopUp.threshold) } : {}),
        ...(autoTopUp.amount ? { autoTopUpAmount: Number(autoTopUp.amount) } : {}),
      })
      addToast('success', 'Bucket updated.')
      setAutoTopUpFor(null)
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Currencies</h1>
          <p className="mt-1 text-sm text-slate-500">{totalAvailable.toLocaleString()} points available across all buckets.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowBucket((v) => !v)}>
            <Plus className="h-4 w-4" /> Add bucket
          </button>
          <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" /> Create currency
          </button>
        </div>
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

      {showBucket && (
        <form onSubmit={handleAddBucket} className="card space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Add currency bucket</h2>
          <div>
            <label className="label">Search currencies from other organizations</label>
            <div className="flex gap-2">
              <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. KFC" />
              <button type="button" className="btn-secondary" onClick={handleSearch}>
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {searchResults.map((c, i) => {
                  const code = (c as { code?: string }).code
                  return code ? (
                    <button key={`${code}-${i}`} type="button" className="rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200" onClick={() => setBucketCode(code)}>
                      {code}
                    </button>
                  ) : null
                })}
              </div>
            )}
          </div>
          <div>
            <label className="label">Currency code</label>
            <input className="input" value={bucketCode} onChange={(e) => setBucketCode(e.target.value)} placeholder="e.g. PTS" required />
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? 'Adding…' : 'Add bucket'}</button>
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
                <button className="text-sm text-brand-700 hover:underline" onClick={() => openAutoTopUp(b)}>
                  Auto top-up
                </button>
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

              {autoTopUpFor === b.id && (
                <form onSubmit={saveAutoTopUp} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoTopUp.enabled}
                      onChange={(e) => setAutoTopUp((t) => ({ ...t, enabled: e.target.checked }))}
                    />
                    Enable auto top-up
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Threshold</label>
                      <input className="input" type="number" value={autoTopUp.threshold} onChange={(e) => setAutoTopUp((t) => ({ ...t, threshold: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Top-up amount</label>
                      <input className="input" type="number" value={autoTopUp.amount} onChange={(e) => setAutoTopUp((t) => ({ ...t, amount: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
                    <button type="button" className="btn-secondary" onClick={() => setAutoTopUpFor(null)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
