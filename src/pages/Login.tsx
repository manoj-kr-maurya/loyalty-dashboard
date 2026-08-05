import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestOrgOtp, verifyOrgOtp } from '../lib/endpoints'
import { setAuth } from '../lib/auth'
import { extractError } from '../lib/api'

type Step = 'phone' | 'otp'

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [countryCode, setCountryCode] = useState('91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const id = await requestOrgOtp({
        countryCode,
        phoneNumber,
        ...(name.trim() ? { name: name.trim() } : {}),
      })
      setOrgId(id)
      setStep('otp')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  async function validateOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { organization } = await verifyOrgOtp({ id: orgId, otp })
      if (!organization.token) throw new Error('No token returned from server')
      setAuth(organization.token, organization)
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="card w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            L
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Loyalty Engine</h1>
          <p className="mt-1 text-sm text-slate-500">Organization admin dashboard</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="label">Phone number</label>
              <div className="flex gap-2">
                <input
                  className="input w-20"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="+91"
                />
                <input
                  className="input flex-1"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Organization name (new orgs only)</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Store"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading || phoneNumber.length < 10}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={validateOtp} className="space-y-4">
            <p className="text-sm text-slate-500">
              Enter the OTP sent to <span className="font-medium">+{countryCode} {phoneNumber}</span>
            </p>
            <div>
              <label className="label">OTP</label>
              <input
                className="input tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading || otp.length < 4}>
              {loading ? 'Verifying…' : 'Verify & Login'}
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => {
                setStep('phone')
                setOtp('')
                setError('')
              }}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}