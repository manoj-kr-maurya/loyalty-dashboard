import { useState } from 'react'
import { Copy, Check, KeyRound, Plus, Trash2 } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { fetchOrganization } from '../lib/endpoints'
import { setOrg } from '../lib/auth'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeletons'
import {
  API_KEY_SCOPES,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  updateOrganization,
} from '../lib/integrations'
import type { ApiKeyRecord } from '../lib/integrations'
import type { Organization } from '../lib/types'

function OrgProfile() {
  const { data, loading, refetch } = useFetch<{ organization: Organization }>(fetchOrganization)
  const org = data?.organization
  const [form, setForm] = useState({
    name: '', address: '', contactUs: '', operationalHours: '', aboutUs: '', upiURI: '',
  })
  const [hydrated, setHydrated] = useState(false)
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  if (org && !hydrated) {
    const o = org as unknown as Record<string, string | undefined>
    setForm({
      name: org.name ?? '',
      address: o.address ?? '',
      contactUs: o.contactUs ?? '',
      operationalHours: o.operationalHours ?? '',
      aboutUs: o.aboutUs ?? '',
      upiURI: o.upiURI ?? '',
    })
    setHydrated(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const updated = await updateOrganization(form)
      setOrg(updated ?? org)
      addToast('success', 'Organization profile updated.')
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="card"><TableSkeleton cols={2} rows={3} /></div>

  const field = (key: keyof typeof form, label: string) => (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  )

  return (
    <form onSubmit={save} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Organization profile</h2>
        <p className="text-sm text-slate-500">Public details customers see in your loyalty program.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field('name', 'Name')}
        {field('address', 'Address')}
        {field('contactUs', 'Contact')}
        {field('operationalHours', 'Operational hours')}
        {field('upiURI', 'UPI URI')}
      </div>
      <div>
        <label className="label">About us</label>
        <textarea
          className="input min-h-[80px]"
          value={form.aboutUs}
          onChange={(e) => setForm((f) => ({ ...f, aboutUs: e.target.value }))}
        />
      </div>
      <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
  )
}

function ApiKeys() {
  const { data: keys, loading, refetch } = useFetch<ApiKeyRecord[]>(listApiKeys)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>([...API_KEY_SCOPES])
  const [expiresAt, setExpiresAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()

  function toggleScope(scope: string) {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]))
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const created = await createApiKey({
        name: name || undefined,
        scopes,
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      })
      setNewKey(created.key ?? null)
      addToast('success', 'API key created.')
      setName('')
      setExpiresAt('')
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  async function revoke(id: string) {
    if (!window.confirm('Revoke this API key? Clients using it will lose access.')) return
    try {
      await revokeApiKey(id)
      addToast('success', 'API key revoked.')
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">API keys</h2>
        <p className="text-sm text-slate-500">
          Organization-scoped credentials for your own integrations. The secret is shown once.
        </p>
      </div>

      {newKey && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-800">New API key — copy it now</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-slate-800">{newKey}</code>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { void navigator.clipboard?.writeText(newKey); setCopied(true) }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={create} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Storefront" />
          </div>
          <div>
            <label className="label">Expires at (optional)</label>
            <input className="input" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Scopes</label>
          <div className="flex flex-wrap gap-2">
            {API_KEY_SCOPES.map((scope) => (
              <button
                type="button"
                key={scope}
                onClick={() => toggleScope(scope)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  scopes.includes(scope)
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary" disabled={busy || scopes.length === 0}>
          <KeyRound className="h-4 w-4" /> {busy ? 'Creating…' : 'Create API key'}
        </button>
      </form>

      {loading ? (
        <TableSkeleton cols={4} rows={3} />
      ) : !keys?.length ? (
        <p className="text-sm text-slate-500">No API keys yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Prefix</th>
                <th className="px-3 py-2">Scopes</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">{k.name || '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{k.prefix}</td>
                  <td className="px-3 py-2 text-slate-500">{k.scopes.length}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      k.isActive && !k.revokedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {k.isActive && !k.revokedAt ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {k.isActive && !k.revokedAt && (
                      <button
                        className="text-slate-400 hover:text-red-600"
                        onClick={() => revoke(k.id)}
                        aria-label="Revoke key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your organization profile and integration credentials.</p>
      </div>
      <OrgProfile />
      <ApiKeys />
      <p className="flex items-center gap-1 text-xs text-slate-400">
        <Plus className="h-3 w-3" /> Need webhooks? Configure them under the Webhooks page.
      </p>
    </div>
  )
}
