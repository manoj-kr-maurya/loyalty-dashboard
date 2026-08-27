import { useState, useEffect } from 'react'
import { Plus, Tag, Pencil, X, ChevronDown, ChevronUp, Key, Copy, Check } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { fetchPromos, fetchPromoById, createPromo, updatePromo, upsertPromoRules, generateCouponCodes, listCouponCodes } from '../lib/endpoints'
import { extractError } from '../lib/api'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeletons'
import type { Promo, PromoRule, CouponCode } from '../lib/types'

const REWARD_TYPES = [
  { value: 'DISCOUNT', label: 'Discount' },
  { value: 'CASHBACK', label: 'Cashback' },
  { value: 'POINTS', label: 'Points' },
  { value: 'COUPON', label: 'Coupon' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'GIFT', label: 'Gift' },
]

const RULE_MODES = [
  { value: 'ABSOLUTE', label: 'Fixed amount' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'RATIO', label: 'Ratio' },
  { value: 'MULTIPLIER', label: 'Multiplier' },
]

const REWARD_TYPES_FOR_RULE = [
  { value: 'DISCOUNT', label: 'Discount' },
  { value: 'CASHBACK', label: 'Cashback' },
  { value: 'POINTS', label: 'Points' },
  { value: 'COUPON', label: 'Coupon' },
]

const BUSINESS_TYPES = ['Retail', 'Food', 'Services', 'Electronics', 'Fashion', 'Healthcare', 'Education', 'Other']

function statusOf(p: Promo): { label: string; cls: string } {
  if (p.status === 'PAUSED') return { label: 'Paused', cls: 'bg-amber-100 text-amber-700' }
  if (p.status === 'ARCHIVED') return { label: 'Archived', cls: 'bg-slate-100 text-slate-600' }
  const now = Date.now()
  if (p.endDate && new Date(p.endDate).getTime() < now) return { label: 'Expired', cls: 'bg-slate-100 text-slate-600' }
  if (p.startDate && new Date(p.startDate).getTime() > now) return { label: 'Scheduled', cls: 'bg-amber-100 text-amber-700' }
  return { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' }
}

function emptyRule(): Omit<PromoRule, 'id'> {
  return { name: '', rewardType: 'DISCOUNT', rewardMode: 'ABSOLUTE', value: 0, conditions: { operator: 'AND', conditions: [] } }
}

function formatDate(d?: string) {
  if (!d) return ''
  const dt = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function codeStatusCls(s: string) {
  if (s === 'AVAILABLE') return 'bg-emerald-100 text-emerald-700'
  if (s === 'CLAIMED') return 'bg-blue-100 text-blue-700'
  if (s === 'BLOCKED') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

export default function PromoCodes() {
  const { data: promos, loading, refetch } = useFetch<Promo[]>(fetchPromos)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailPromo, setDetailPromo] = useState<Promo | null>(null)
  const [rules, setRules] = useState<Omit<PromoRule, 'id'>[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rewardType, setRewardType] = useState('DISCOUNT')
  const [couponValue, setCouponValue] = useState<string>('')
  const [minimumCartValue, setMinimumCartValue] = useState<string>('')
  const [maxDiscountValue, setMaxDiscountValue] = useState<string>('')
  const [subTitle, setSubTitle] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [minBankAmount, setMinBankAmount] = useState<string>('')
  const [businessType, setBusinessType] = useState<string[]>([])
  const [maxClaimsPerUser, setMaxClaimsPerUser] = useState<string>('')
  const [maxClaimsTotal, setMaxClaimsTotal] = useState<string>('')
  const [businessTypeInput, setBusinessTypeInput] = useState('')
  const [busy, setBusy] = useState(false)

  const [couponType, setCouponType] = useState<'manual' | 'auto'>('manual')
  const [isUserSpecific, setIsUserSpecific] = useState(true)
  const [codeCount, setCodeCount] = useState<string>('5')
  const [codeLength, setCodeLength] = useState<string>('8')
  const [codePrefix, setCodePrefix] = useState('')

  const [codes, setCodes] = useState<CouponCode[]>([])
  const [codesLoading, setCodesLoading] = useState(false)
  const [generatingCodes, setGeneratingCodes] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { addToast } = useToast()

  function resetForm() {
    setName(''); setDescription(''); setRewardType('DISCOUNT')
    setCouponValue(''); setMinimumCartValue(''); setMaxDiscountValue(''); setSubTitle('')
    setValidFrom(''); setValidTo('')
    setMinBankAmount(''); setBusinessType([]); setBusinessTypeInput('')
    setMaxClaimsPerUser(''); setMaxClaimsTotal(''); setRules([])
    setCouponType('manual'); setIsUserSpecific(true)
    setCodeCount('5'); setCodeLength('8'); setCodePrefix('')
  }

  function loadFormFromPromo(p: Promo) {
    setName(p.name)
    setDescription(p.description ?? '')
    setRewardType(p.rewardType)
    setCouponValue(p.couponValue != null ? String(p.couponValue) : '')
    setMinimumCartValue(p.minimumCartValue != null ? String(p.minimumCartValue) : '')
    setMaxDiscountValue(p.maxDiscountValue != null ? String(p.maxDiscountValue) : '')
    setSubTitle(p.subTitle ?? '')
    setValidFrom(formatDate(p.startDate))
    setValidTo(formatDate(p.endDate))
    setMinBankAmount(p.minBankAmount != null ? String(p.minBankAmount) : '')
    setBusinessType(Array.isArray(p.businessType) ? p.businessType : [])
    setMaxClaimsPerUser(p.maxClaimsPerUser != null ? String(p.maxClaimsPerUser) : '')
    setMaxClaimsTotal(p.maxClaimsTotal != null ? String(p.maxClaimsTotal) : '')
  }

  function buildPayload() {
    const org = JSON.parse(localStorage.getItem('loyalty_admin_org') || '{}')
    return {
      organizationId: org.id ?? '',
      name, description, rewardType,
      couponValue: couponValue ? Number(couponValue) : undefined,
      minimumCartValue: minimumCartValue ? Number(minimumCartValue) : undefined,
      maxDiscountValue: maxDiscountValue ? Number(maxDiscountValue) : undefined,
      subTitle: subTitle || undefined,
      validFrom, validTo,
      minBankAmount: minBankAmount ? Number(minBankAmount) : undefined,
      businessType: businessType.length ? businessType : undefined,
      maxClaimsPerUser: maxClaimsPerUser ? Number(maxClaimsPerUser) : undefined,
      maxClaimsTotal: maxClaimsTotal ? Number(maxClaimsTotal) : undefined,
    }
  }

  function addBusinessType(val: string) {
    const v = val.trim()
    if (v && !businessType.includes(v)) setBusinessType([...businessType, v])
    setBusinessTypeInput('')
  }

  function removeBusinessType(val: string) {
    setBusinessType(businessType.filter((t) => t !== val))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const promo = await createPromo(buildPayload())
      if (couponType === 'auto') {
        await generateCodesForPromo(promo.id)
      }
      addToast('success', 'Promo created.')
      setShowCreate(false)
      resetForm()
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setBusy(true)
    try {
      await updatePromo(editId, buildPayload())
      if (rules.length) {
        await upsertPromoRules(editId, rules as any)
      }
      addToast('success', 'Promo updated.')
      setEditId(null)
      resetForm()
      await refetch()
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setBusy(false)
    }
  }

  async function startEdit(p: Promo) {
    setEditId(p.id)
    setShowCreate(false)
    loadFormFromPromo(p)
    try {
      const full = await fetchPromoById(p.id)
      setRules((full.rules ?? []).map((r) => ({
        name: r.name,
        rewardType: r.rewardType,
        rewardMode: r.rewardMode,
        value: Number(r.value),
        conditions: r.conditions,
        threshold: r.threshold,
        ratioBase: r.ratioBase,
        meta: r.meta,
      })))
    } catch {
      setRules([])
    }
  }

  async function toggleRules(p: Promo) {
    if (expandedId === p.id) { setExpandedId(null); setDetailPromo(null); setCodes([]); return }
    try {
      const full = await fetchPromoById(p.id)
      setDetailPromo(full)
      setExpandedId(p.id)
      loadCodes(p.id)
    } catch (err) {
      addToast('error', extractError(err))
    }
  }

  async function loadCodes(programId: string) {
    setCodesLoading(true)
    try {
      const data = await listCouponCodes(programId)
      setCodes(data)
    } catch {
      setCodes([])
    } finally {
      setCodesLoading(false)
    }
  }

  async function generateCodesForPromo(programId: string) {
    setGeneratingCodes(true)
    try {
      await generateCouponCodes(programId, {
        isUserSpecific,
        count: Number(codeCount) || 5,
        codeLength: Number(codeLength) || 8,
        prefix: codePrefix || undefined,
      })
      if (expandedId === programId) {
        await loadCodes(programId)
      }
      addToast('success', 'Codes generated.')
    } catch (err) {
      addToast('error', extractError(err))
    } finally {
      setGeneratingCodes(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const activeCount = (promos ?? []).filter((p) => statusOf(p).label === 'Active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
          <p className="mt-1 text-sm text-slate-500">{activeCount} active promotions.</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowCreate((v) => !v); setEditId(null); resetForm() }}>
          <Plus className="h-4 w-4" /> New promo code
        </button>
      </div>

      {(showCreate || editId) && (
        <form onSubmit={editId ? handleUpdate : handleCreate} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{editId ? 'Edit promo' : 'New promo code'}</h2>
            <button type="button" onClick={() => { setShowCreate(false); setEditId(null); resetForm() }} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer2026" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
            </div>
            <div>
              <label className="label">Reward type</label>
              <select className="input" value={rewardType} onChange={(e) => setRewardType(e.target.value)}>
                {REWARD_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Coupon Value</label>
              <input className="input" type="number" min="0" step="0.01" value={couponValue} onChange={(e) => setCouponValue(e.target.value)} placeholder="e.g. 20 (% off)" />
            </div>
            <div>
              <label className="label">Min Cart Value</label>
              <input className="input" type="number" min="0" step="0.01" value={minimumCartValue} onChange={(e) => setMinimumCartValue(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Max Discount Value</label>
              <input className="input" type="number" min="0" step="0.01" value={maxDiscountValue} onChange={(e) => setMaxDiscountValue(e.target.value)} placeholder="e.g. 500" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Sub-title (shown in user app)</label>
              <input className="input" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} placeholder="e.g. Get 20% off on all products" />
            </div>
            <div>
              <label className="label">Min Bank Amount</label>
              <input className="input" type="number" min="0" step="0.01" value={minBankAmount} onChange={(e) => setMinBankAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Valid from</label>
              <input className="input" type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">Valid to</label>
              <input className="input" type="datetime-local" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </div>
            <div>
              <label className="label">Max Claims Per User</label>
              <input className="input" type="number" min="1" step="1" value={maxClaimsPerUser} onChange={(e) => setMaxClaimsPerUser(e.target.value)} placeholder="Unlimited" />
            </div>
            <div>
              <label className="label">Max Claims Total</label>
              <input className="input" type="number" min="1" step="1" value={maxClaimsTotal} onChange={(e) => setMaxClaimsTotal(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>

          <div>
            <label className="label">Coupon Code Type</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="couponType" value="manual" checked={couponType === 'manual'} onChange={() => setCouponType('manual')}
                  className="h-4 w-4 text-brand-600" />
                <span className="text-sm text-slate-700">Manual (user enters code)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="couponType" value="auto" checked={couponType === 'auto'} onChange={() => setCouponType('auto')}
                  className="h-4 w-4 text-brand-600" />
                <span className="text-sm text-slate-700">Auto-generated codes</span>
              </label>
            </div>
          </div>

          {couponType === 'auto' && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
                <Key className="h-4 w-4" /> Auto-generated Code Settings
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isUserSpecific} onChange={(e) => setIsUserSpecific(e.target.checked)}
                    className="h-4 w-4 rounded text-brand-600" />
                  <span className="text-sm text-slate-700">User-specific (assigned to one customer)</span>
                </label>
                <div>
                  <label className="label">Number of codes</label>
                  <input className="input" type="number" min="1" max="1000" value={codeCount} onChange={(e) => setCodeCount(e.target.value)} />
                </div>
                <div>
                  <label className="label">Code length</label>
                  <input className="input" type="number" min="4" max="16" value={codeLength} onChange={(e) => setCodeLength(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Prefix (optional)</label>
                <input className="input" value={codePrefix} onChange={(e) => setCodePrefix(e.target.value.toUpperCase())} placeholder="e.g. DIWALI" maxLength={6} />
              </div>
            </div>
          )}

          <div>
            <label className="label">Business Type</label>
            <div className="flex flex-wrap gap-2">
              {businessType.map((bt) => (
                <span key={bt} className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                  {bt}
                  <button type="button" onClick={() => removeBusinessType(bt)} className="ml-1 hover:text-brand-900"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {BUSINESS_TYPES.filter((bt) => !businessType.includes(bt)).map((bt) => (
                <button key={bt} type="button" onClick={() => addBusinessType(bt)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">{bt}</button>
              ))}
              <input className="w-32 rounded-full border border-slate-200 px-3 py-1 text-xs outline-none focus:border-brand-500" value={businessTypeInput} onChange={(e) => setBusinessTypeInput(e.target.value)} placeholder="Custom..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBusinessType(businessTypeInput) } }} />
            </div>
          </div>

          {editId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Rules</label>
                <button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => setRules([...rules, emptyRule()])}>+ Add rule</button>
              </div>
              {rules.length === 0 && <p className="text-xs text-slate-400">No rules defined yet.</p>}
              {rules.map((r, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-4">
                  <input className="input" value={r.name} onChange={(e) => { const n = [...rules]; n[i] = { ...n[i], name: e.target.value }; setRules(n) }} placeholder="Rule name" required />
                  <select className="input" value={r.rewardType} onChange={(e) => { const n = [...rules]; n[i] = { ...n[i], rewardType: e.target.value }; setRules(n) }}>
                    {REWARD_TYPES_FOR_RULE.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                  </select>
                  <select className="input" value={r.rewardMode} onChange={(e) => { const n = [...rules]; n[i] = { ...n[i], rewardMode: e.target.value }; setRules(n) }}>
                    {RULE_MODES.map((rm) => <option key={rm.value} value={rm.value}>{rm.label}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input className="input flex-1" type="number" min={0} value={r.value} onChange={(e) => { const n = [...rules]; n[i] = { ...n[i], value: Number(e.target.value) }; setRules(n) }} placeholder="Value" required />
                    <button type="button" className="text-slate-400 hover:text-red-500" onClick={() => setRules(rules.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editId ? 'Update promo' : 'Create promo code'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <TableSkeleton cols={5} rows={5} />
      ) : !promos?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Tag className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No promo codes yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first promotion to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => {
            const s = statusOf(p)
            const expanded = expandedId === p.id
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-4">
                    <button className="text-slate-400 hover:text-slate-600" onClick={() => toggleRules(p)}>
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <div>
                      <p className="font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.rewardType.replace(/_/g, ' ').toLowerCase()}
                        {p.couponValue != null && ` · ₹${p.couponValue}`}
                        {p.startDate ? ` · ${new Date(p.startDate).toLocaleDateString()} – ${p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                    <button className="text-slate-400 hover:text-brand-600" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></button>
                  </div>
                </div>
                {expanded && detailPromo && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
                    {detailPromo.description && <p className="text-sm text-slate-600">{detailPromo.description}</p>}
                    {detailPromo.subTitle && <p className="text-xs text-slate-500 italic">{detailPromo.subTitle}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {detailPromo.minBankAmount != null && <span>Min Bank: ₹{detailPromo.minBankAmount}</span>}
                      {detailPromo.minimumCartValue != null && <span>Min Cart: ₹{detailPromo.minimumCartValue}</span>}
                      {detailPromo.maxDiscountValue != null && <span>Max Discount: ₹{detailPromo.maxDiscountValue}</span>}
                      {detailPromo.maxClaimsPerUser != null && <span>Per-user limit: {detailPromo.maxClaimsPerUser}</span>}
                      {detailPromo.maxClaimsTotal != null && <span>Total limit: {detailPromo.maxClaimsTotal}</span>}
                      {Array.isArray(detailPromo.businessType) && detailPromo.businessType.length > 0 && <span>Business: {detailPromo.businessType.join(', ')}</span>}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 uppercase">Rules</p>
                      <button className="text-sm text-brand-600 hover:underline" onClick={() => startEdit(detailPromo)}>Edit rules</button>
                    </div>
                    {!detailPromo.rules?.length ? (
                      <p className="text-xs text-slate-400">No rules defined.</p>
                    ) : (
                      <div className="space-y-1">
                        {detailPromo.rules.map((r, i) => (
                          <div key={r.id ?? i} className="flex items-center gap-3 text-sm">
                            <span className="font-medium text-slate-700">{r.name}</span>
                            <span className="text-xs text-slate-500">{r.rewardType} · {r.rewardMode} · {String(r.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                          <Key className="h-3 w-3" /> Coupon Codes ({codes.length})
                        </p>
                        <button className="btn-secondary text-xs py-1 px-2" onClick={() => generateCodesForPromo(p.id)} disabled={generatingCodes}>
                          {generatingCodes ? 'Generating…' : '+ Generate codes'}
                        </button>
                      </div>
                      {codesLoading ? (
                        <p className="text-xs text-slate-400">Loading codes…</p>
                      ) : codes.length === 0 ? (
                        <p className="text-xs text-slate-400">No codes generated yet.</p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-400">
                                <th className="text-left pb-1 font-medium">Code</th>
                                <th className="text-left pb-1 font-medium">Type</th>
                                <th className="text-left pb-1 font-medium">Customer</th>
                                <th className="text-left pb-1 font-medium">Used</th>
                                <th className="text-left pb-1 font-medium">Status</th>
                                <th className="pb-1"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {codes.map((c) => (
                                <tr key={c.id}>
                                  <td className="py-1 font-mono font-medium text-slate-700">{c.code}</td>
                                  <td className="py-1 text-slate-500">{c.isUserSpecific ? 'User-specific' : 'Blanket'}</td>
                                  <td className="py-1 text-slate-500">{c.customerId ? c.customerId.slice(0, 8) + '…' : '—'}</td>
                                  <td className="py-1 text-slate-500">{c.usedCount}/{c.maxUses}</td>
                                  <td className="py-1"><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${codeStatusCls(c.status)}`}>{c.status}</span></td>
                                  <td className="py-1 pl-2">
                                    <button onClick={() => copyCode(c.code)} className="text-slate-400 hover:text-slate-600" title="Copy code">
                                      {copiedCode === c.code ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
