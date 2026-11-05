import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, RefreshCw } from 'lucide-react'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeletons'
import {
  broadCustomerBalance,
  getCustomer,
  listCustomerOrders,
  listCustomerWallets,
  updateCustomer,
} from '../lib/customers'
import type { CustomerRecord, Wallet } from '../lib/customers'

function ObjectTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: string[] }) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">No records.</p>
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>{columns.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={(row.id as string) ?? i}>
              {columns.map((c) => (
                <td key={c} className="px-3 py-2 text-slate-600">
                  {row[c] === null || row[c] === undefined ? '—' : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CustomerDetail() {
  const { customerId: paramId } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(paramId ?? '')
  const [customerId, setCustomerId] = useState(paramId ?? '')
  const [profile, setProfile] = useState<CustomerRecord | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [balance, setBalance] = useState<unknown>(null)
  const [orders, setOrders] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  const load = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const [profileRes, walletsRes, balanceRes, ordersRes] = await Promise.allSettled([
        getCustomer(id),
        listCustomerWallets(id),
        broadCustomerBalance(id),
        listCustomerOrders(id),
      ])
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value)
        setName(profileRes.value?.name ?? '')
      }
      setWallets(walletsRes.status === 'fulfilled' ? walletsRes.value : [])
      setBalance(balanceRes.status === 'fulfilled' ? balanceRes.value : null)
      setOrders(ordersRes.status === 'fulfilled' ? ordersRes.value : [])
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    if (customerId) void load(customerId)
  }, [customerId, load])

  function lookup(e: React.FormEvent) {
    e.preventDefault()
    const id = input.trim()
    if (!id) return
    setCustomerId(id)
    navigate(`/customers/${id}`)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await updateCustomer({ customerId, name })
      addToast('success', 'Customer updated.')
      await load(customerId)
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer</h1>
        <p className="mt-1 text-sm text-slate-500">Look up a customer by ID to inspect balances, orders and history.</p>
      </div>

      <form onSubmit={lookup} className="flex max-w-xl gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Customer UUID"
          />
        </div>
        <button className="btn-primary" type="submit">Load</button>
      </form>

      {loading ? (
        <TableSkeleton cols={3} rows={4} />
      ) : profile ? (
        <>
          <section className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{profile.name || 'Unnamed customer'}</h2>
                <p className="text-sm text-slate-500">
                  {profile.countryCode ? `+${profile.countryCode} ` : ''}{profile.phoneNumber || profile.id}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {profile.isVerified ? 'Verified' : 'Unverified'}
                  {profile.createdAt ? ` · joined ${new Date(profile.createdAt).toLocaleDateString()}` : ''}
                </p>
              </div>
              <button className="btn-secondary" onClick={() => load(customerId)}>
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
            <form onSubmit={save} className="mt-4 flex items-end gap-2">
              <div className="flex-1">
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Update'}</button>
            </form>
          </section>

          <section className="card">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Wallets</h2>
            <ObjectTable rows={wallets as unknown as Record<string, unknown>[]} columns={['currencyCode', 'balance', 'id']} />
            {balance ? (
              <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-200">
{JSON.stringify(balance, null, 2)}
              </pre>
            ) : null}
          </section>

          <section className="card">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Orders</h2>
            <ObjectTable rows={orders} columns={['id', 'status', 'amount', 'createdAt']} />
          </section>
        </>
      ) : customerId ? (
        <p className="text-sm text-slate-500">No data returned for this customer.</p>
      ) : null}
    </div>
  )
}
