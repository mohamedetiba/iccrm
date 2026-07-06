import { useState } from 'react'
import { api } from '../api'
import { RobotMark } from './Layout'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!username || !password) { setError('Enter your username and password'); return }
    setLoading(true); setError('')
    try {
      const res = await api('login', { username, password })
      if (res.ok) onLogin(res)
      else setError(res.error || 'Login failed')
    } catch {
      setError('Cannot reach the server — check the API URL in config.js')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-navy-950 relative overflow-hidden px-4">
      {/* brand ribbons echoing the flag sweep in the logo */}
      <div className="absolute -top-24 -left-24 w-[560px] h-[560px] rounded-full bg-brand-red/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 w-[560px] h-[560px] rounded-full bg-brand-blue/10 blur-3xl" />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <RobotMark size={72} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white font-display">I.C ROBOTICS ACADEMY</h1>
          <p className="text-sm text-slate-400 mt-1">School Sales CRM</p>
        </div>

        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 shadow-2xl">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
          <input
            className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-blue mb-4"
            value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} autoFocus
          />
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
          <input
            type="password"
            className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
          {error && <p className="text-brand-red text-sm mt-3">{error}</p>}
          <button
            onClick={submit} disabled={loading}
            className="w-full mt-5 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">Sessions stay active for 30 days on this device.</p>
      </div>
    </div>
  )
}
