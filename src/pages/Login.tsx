import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import {
  loginWithCredentials,
  requestOrgOtp,
  verifyLoginChallenge,
  verifyOrgOtp,
} from '../lib/endpoints'
import { setAuth } from '../lib/auth'
import { extractError } from '../lib/api'
import type { Organization } from '../lib/types'

type Mode = 'credentials' | 'phone'
type Step = 'start' | 'otp'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('credentials')
  const [step, setStep] = useState<Step>('start')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [countryCode, setCountryCode] = useState('91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function switchMode(next: Mode) {
    setMode(next)
    setStep('start')
    setOtp('')
    setError('')
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { challengeId: id } = await loginWithCredentials({ username, password })
      setChallengeId(id)
      setStep('otp')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault()
    if (phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
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
      let token: string | undefined
      let organization: Organization
      if (mode === 'credentials') {
        const result = await verifyLoginChallenge({ challengeId, otp })
        token = result.token
        organization = result.organization
      } else {
        const result = await verifyOrgOtp({ id: orgId, otp })
        token = result.organization.token
        organization = result.organization
      }
      if (!token) throw new Error('No token returned from server')
      setAuth(token, organization)
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
          <p className="mt-1 text-sm text-slate-500">Tenant dashboard</p>
        </div>

        {step === 'start' ? (
          mode === 'credentials' ? (
            <form onSubmit={submitCredentials} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  className="input text-base text-slate-900"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input text-base text-slate-900 pr-11"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? 'Verifying…' : 'Continue'}
              </button>
              <button
                type="button"
                className="w-full text-center text-sm text-brand-600 hover:underline"
                onClick={() => switchMode('phone')}
              >
                First time? Register with phone
              </button>
            </form>
          ) : (
            <form onSubmit={submitPhone} className="space-y-4">
              <div>
                <label className="label">Phone number</label>
                <div className="flex items-stretch gap-2">
                  <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-500">
                    <span className="text-base font-medium">+</span>
                    <input
                      className="h-full w-10 border-none bg-transparent text-center text-base text-slate-900 outline-none"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      placeholder="91"
                      maxLength={4}
                    />
                  </div>
                  <input
                    className="input flex-1 text-base text-slate-900"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter 10-digit number"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Organization name (new orgs only)</label>
                <input
                  className="input text-base text-slate-900"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Store"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
              <button
                type="button"
                className="w-full text-center text-sm text-brand-600 hover:underline"
                onClick={() => switchMode('credentials')}
              >
                Have a username and password? Sign in
              </button>
            </form>
          )
        ) : (
          <form onSubmit={validateOtp} className="space-y-4">
            <p className="text-sm text-slate-500">
              {mode === 'credentials' ? (
                <>Enter the OTP sent to the mobile number registered for this account.</>
              ) : (
                <>Enter the OTP sent to <span className="font-medium">+{countryCode} {phoneNumber}</span></>
              )}
            </p>
            <div>
              <label className="label">OTP</label>
              <input
                className="input text-base tracking-widest text-slate-900"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
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
                setStep('start')
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
