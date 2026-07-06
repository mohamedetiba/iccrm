import { useEffect, useState, useMemo } from 'react'
import { useApp } from '../App'
import { api } from '../api'

const FIELDS = [
  { key: 'targetSchools', label: 'Schools reached' },
  { key: 'targetMeetings', label: 'Meetings booked' },
  { key: 'targetVisits', label: 'Visits completed' },
  { key: 'targetDeals', label: 'Deals closed' },
  { key: 'targetRevenue', label: 'Revenue (EGP)' },
]

export default function TargetsPage() {
  const { leads, users, user, permissions, toast, loadUsers } = useApp()
  const [targets, setTargets] = useState([])
  const [busy, setBusy] = useState(false)
  const canEdit = permissions.manageTargets

  useEffect(() => {
    api('getTargets').then(r => r.ok && setTargets(r.targets))
    if (canEdit && users.length === 0) loadUsers()
  }, []) // eslint-disable-line

  const progress = useMemo(() => {
    const per = (list) => ({
      targetSchools: list.length,
      targetMeetings: list.filter(l => ['Meeting Scheduled', 'Visit Completed', 'Quotation Requested', 'Proposal Sent', 'Deal Closed'].includes(l.stage)).length,
      targetVisits: list.filter(l => l.visitStatus === 'Visited' || ['Visit Completed', 'Quotation Requested', 'Proposal Sent', 'Deal Closed'].includes(l.stage)).length,
      targetDeals: list.filter(l => l.stage === 'Deal Closed').length,
      targetRevenue: null, // manual for now
    })
    const out = { global: per(leads) }
    users.forEach(u => { out[u.username] = per(leads.filter(l => l.assignedTo === u.username)) })
    out[user.username] = out[user.username] || per(leads.filter(l => l.assignedTo === user.username))
    return out
  }, [leads, users, user])

  function setVal(scope, key, value) {
    setTargets(ts => {
      const exists = ts.find(t => t.scope === scope)
      if (exists) return ts.map(t => (t.scope === scope ? { ...t, [key]: value } : t))
      return [...ts, { scope, [key]: value }]
    })
  }

  async function save() {
    setBusy(true)
    const res = await api('saveTargets', { targets })
    setBusy(false)
    if (res.ok) toast('Targets saved')
    else toast(res.error || 'Save failed', 'urgent')
  }

  const scopes = canEdit
    ? ['global', ...users.filter(u => u.active && u.role !== 'admin').map(u => u.username)]
    : ['global', user.username]

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Targets</h1>
          <p className="text-sm text-slate-400">{canEdit ? 'Set team and individual goals — progress updates live from the pipeline' : 'Your goals and live progress'}</p>
        </div>
        {canEdit && (
          <button onClick={save} disabled={busy} className="bg-brand-yellow hover:brightness-95 text-navy-950 font-bold text-sm px-5 py-2 rounded-lg disabled:opacity-50">
            {busy ? 'Saving…' : 'Save all targets'}
          </button>
        )}
      </header>

      {scopes.map(scope => {
        const t = targets.find(x => x.scope === scope) || {}
        const p = progress[scope] || {}
        const title = scope === 'global' ? 'Team target' : (users.find(u => u.username === scope)?.fullName || scope)
        return (
          <section key={scope} className="bg-navy-800 border border-navy-700 rounded-xl p-5">
            <h2 className="font-display font-bold text-sm text-white mb-4">
              {title}
              {scope !== 'global' && <span className="text-slate-500 font-normal ml-2 text-xs">@{scope}</span>}
            </h2>
            <div className="grid grid-cols-5 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4">
              {FIELDS.map(fl => {
                const target = Number(t[fl.key]) || 0
                const actual = p[fl.key]
                const pct = target > 0 && actual !== null ? Math.min(100, Math.round((actual / target) * 100)) : null
                return (
                  <div key={fl.key} className="bg-navy-900 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{fl.label}</div>
                    {canEdit ? (
                      <input
                        type="number" min="0"
                        className="w-full bg-navy-800 border border-navy-600 rounded-md px-2 py-1.5 text-sm mt-2 outline-none focus:border-brand-yellow font-display font-bold"
                        value={t[fl.key] ?? ''}
                        onChange={e => setVal(scope, fl.key, e.target.value)}
                        placeholder="0"
                      />
                    ) : (
                      <div className="text-xl font-display font-bold mt-1">{target || '—'}</div>
                    )}
                    {actual !== null && actual !== undefined && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">{actual} done</span>
                          {pct !== null && <span className={pct >= 100 ? 'text-green-400 font-bold' : 'text-brand-yellow font-semibold'}>{pct}%</span>}
                        </div>
                        <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
                          <div className={'h-full rounded-full ' + (pct >= 100 ? 'bg-green-400' : 'bg-brand-yellow')} style={{ width: (pct || 0) + '%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
