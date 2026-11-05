import { useMemo, useState } from 'react'
import { Plus, Pencil, Calculator } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { fetchCampaigns, potentialEarning, updateCampaign } from '../lib/endpoints'
import { createCampaign } from '../lib/actions'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeletons'
import type { Campaign } from '../lib/types'

function statusOf(c: Campaign): { label: string; cls: string } {
  const now = Date.now()
  if (c.isSoftDeleted) return { label: 'Deleted', cls: 'bg-slate-100 text-slate-600' }
  if (new Date(c.startDate).getTime() > now) return { label: 'Scheduled', cls: 'bg-amber-100 text-amber-700' }
  if (new Date(c.endDate).getTime() < now) return { label: 'Expired', cls: 'bg-slate-100 text-slate-600' }
  return { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' }
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Campaigns() {
  const { data: campaigns, loading, refetch } = useFetch<Campaign[]>(fetchCampaigns)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [earningPercentage, setEarningPercentage] = useState(5)
  const [currencyCode, setCurrencyCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [earningExpiresIn, setEarningExpiresIn] = useState(30)
  const [busy, setBusy] = useState(false)
  const [realAmount, setRealAmount] = useState('1000')
  const [estimate, setEstimate] = useState<unknown>(null)
  const { addToast } = useToast()

  const activeCount = useMemo(() => (campaigns ?? []).filter((c) => statusOf(c).label === 'Active').length, [campaigns])

  function resetForm() {
    setEditId(null)
    setName('')
    setEarningPercentage(5)
    setCurrencyCode('')
    setStartDate('')
    setEndDate('')
    setEarningExpiresIn(30)
  }

  function startEdit(c: Campaign) {
    setEditId(c.id)
    setName(c.name)
    setEarningPercentage(c.earningPercentage)
    setCurrencyCode(c.currencyCode)
    setStartDate(toLocalInput(c.startDate))
    setEndDate(toLocalInput(c.endDate))
    setEarningExpiresIn(c.earningExpiresIn)
    setShowCreate(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        name,
        earningPercentage,
        currencyCode,
        startDate,
        endDate,
        earningExpiresIn,
      }
      if (editId) {
        await updateCampaign({ id: editId, ...payload })
        addToast('success', 'Campaign updated.')
      } else {
        await createCampaign(payload)
        addToast('success', 'Campaign created.')
      }
      setShowCreate(false)
      resetForm()
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault()
    try {
      setEstimate(await potentialEarning(Number(realAmount)))
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">{activeCount} active campaigns.</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreate((v) => !v) }}>
          <Plus className="h-4 w-4" /> New campaign
        </button>
      </div>

      <form onSubmit={handleEstimate} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">Potential earning calculator (amount spent)</label>
          <input className="input" type="number" value={realAmount} onChange={(e) => setRealAmount(e.target.value)} />
        </div>
        <button className="btn-secondary"><Calculator className="h-4 w-4" /> Estimate</button>
        {estimate != null && (
          <pre className="w-full overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-200">
{JSON.stringify(estimate, null, 2)}
          </pre>
        )}
      </form>

      {showCreate && (
        <form onSubmit={handleSubmit} className="card grid gap-3 sm:grid-cols-2">
          <h2 className="text-lg font-semibold text-slate-900 sm:col-span-2">
            {editId ? 'Edit campaign' : 'New campaign'}
          </h2>
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monsoon Sale" required />
          </div>
          <div>
            <label className="label">Currency code</label>
            <input className="input" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} placeholder="e.g. PTS" required />
          </div>
          <div>
            <label className="label">Earning %</label>
            <input className="input" type="number" min={1} max={100} value={earningPercentage} onChange={(e) => setEarningPercentage(Number(e.target.value))} required />
          </div>
          <div>
            <label className="label">Earnings valid (days)</label>
            <input className="input" type="number" min={1} value={earningExpiresIn} onChange={(e) => setEarningExpiresIn(Number(e.target.value))} required />
          </div>
          <div>
            <label className="label">Start date</label>
            <input className="input" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">End date</label>
            <input className="input" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editId ? 'Update campaign' : 'Create campaign'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowCreate(false); resetForm() }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <TableSkeleton cols={7} rows={5} />
      ) : !campaigns?.length ? (
        <p className="text-slate-500">No campaigns yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Earning %</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => {
                const s = statusOf(c)
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3">{c.currencyCode}</td>
                    <td className="px-4 py-3">{c.earningPercentage}%</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(c.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(c.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-slate-400 hover:text-brand-600" onClick={() => startEdit(c)} aria-label="Edit campaign">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
