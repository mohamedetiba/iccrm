import { useEffect, useState, useMemo } from 'react'
import { useApp } from '../App'
import { api, isUrgent, fmtCountdown, fmtDate } from '../api'

export default function Dashboard() {
  const { leads, meta, user, permissions, setEditingLead, setPage } = useApp()
  const [targets, setTargets] = useState([])

  useEffect(() => { api('getTargets').then(r => r.ok && setTargets(r.targets)) }, [])

  const stats = useMemo(() => {
    const total = leads.length
    const meetings = leads.filter(l => ['Meeting Scheduled', 'Visit Completed', 'Quotation Requested', 'Proposal Sent', 'Deal Closed'].includes(l.stage)).length
    const visits = leads.filter(l => l.visitStatus === 'Visited' || ['Visit Completed', 'Quotation Requested', 'Proposal Sent', 'Deal Closed'].includes(l.stage)).length
    const deals = leads.filter(l => l.stage === 'Deal Closed').length
    return { total, meetings, visits, deals }
  }, [leads])

  const funnel = useMemo(() => {
    const order = meta.stages.filter(s => s !== 'Rejected')
    const max = Math.max(1, ...order.map(s => leads.filter(l => l.stage === s).length))
    return order.map((s, i) => {
      const count = leads.filter(l => l.stage === s).length
      const prev = i === 0 ? null : leads.filter(l => l.stage === order[i - 1]).length
      return { stage: s, count, pct: (count / max) * 100 }
    })
  }, [leads, meta])

  const target = useMemo(() => {
    const personal = targets.find(t => t.scope === user.username)
    return personal || targets.find(t => t.scope === 'global') || {}
  }, [targets, user])

  const urgentLeads = useMemo(
    () => leads.filter(isUrgent).sort((a, b) => new Date(a.nextActionDate) - new Date(b.nextActionDate)),
    [leads]
  )

  const conv = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)

  const kpis = [
    { label: 'Total Leads', value: stats.total, target: target.targetSchools, color: 'brand-blue' },
    { label: 'Meetings Booked', value: stats.meetings, target: target.targetMeetings, color: 'brand-blue', sub: conv(stats.meetings, stats.total) + '% of leads' },
    { label: 'Visits Completed', value: stats.visits, target: target.targetVisits, color: 'brand-yellow', sub: conv(stats.visits, stats.meetings) + '% of meetings' },
    { label: 'Deals Closed', value: stats.deals, target: target.targetDeals, color: 'brand-yellow', sub: conv(stats.deals, stats.visits) + '% of visits' },
  ]

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">{permissions.viewTeamAnalytics ? 'Team-wide pipeline overview' : 'Your personal pipeline'}</p>
        </div>
        <button onClick={() => setEditingLead({})} className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-lg">+ New school lead</button>
      </header>

      {/* KPI cards with target progress */}
      <div className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4">
        {kpis.map(k => {
          const pct = k.target ? Math.min(100, Math.round((k.value / k.target) * 100)) : null
          return (
            <div key={k.label} className="bg-navy-800 border border-navy-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{k.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-white">{k.value}</span>
                {k.target ? <span className="text-sm text-slate-500">/ {k.target}</span> : null}
              </div>
              {k.sub && <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>}
              {pct !== null && (
                <div className="mt-3">
                  <div className="h-1.5 bg-navy-900 rounded-full overflow-hidden">
                    <div className={'h-full rounded-full bg-' + k.color} style={{ width: pct + '%' }} />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{pct}% of target</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-5 max-lg:grid-cols-1 gap-6">
        {/* Funnel */}
        <section className="col-span-3 bg-navy-800 border border-navy-700 rounded-xl p-5">
          <h2 className="font-display font-bold text-sm text-white mb-4">Pipeline funnel</h2>
          <div className="space-y-2.5">
            {funnel.map(f => (
              <div key={f.stage} className="flex items-center gap-3">
                <div className="w-36 text-xs text-slate-400 truncate shrink-0">{f.stage}</div>
                <div className="flex-1 h-6 bg-navy-900 rounded-md overflow-hidden">
                  <div
                    className={'h-full rounded-md ' + (f.stage === 'Deal Closed' ? 'bg-brand-yellow' : 'bg-brand-blue/70')}
                    style={{ width: Math.max(f.count ? 4 : 0, f.pct) + '%' }}
                  />
                </div>
                <div className="w-8 text-right text-sm font-semibold font-display">{f.count}</div>
              </div>
            ))}
          </div>
          {target.targetRevenue ? (
            <div className="mt-5 pt-4 border-t border-navy-700 flex items-center justify-between text-sm">
              <span className="text-slate-400">Revenue target</span>
              <span className="font-display font-bold text-brand-yellow">{Number(target.targetRevenue).toLocaleString()} EGP</span>
            </div>
          ) : null}
        </section>

        {/* Urgent actions — the red 30h zone */}
        <section className="col-span-2 bg-navy-800 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-red urgent-pulse" />
            <h2 className="font-display font-bold text-sm text-white">Action needed · next 30 hours</h2>
          </div>
          {urgentLeads.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing urgent. All scheduled actions are more than 30 hours away.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {urgentLeads.map(l => (
                <button
                  key={l.id}
                  onClick={() => setEditingLead(l)}
                  className="w-full text-left bg-brand-red/10 border border-brand-red/40 rounded-lg px-3 py-2.5 hover:bg-brand-red/20 transition-colors"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm font-semibold truncate">{l.schoolName}</span>
                    <span className="text-[11px] font-bold text-brand-red whitespace-nowrap">{fmtCountdown(l.nextActionDate)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{l.nextActionType || 'Action'} · {fmtDate(l.nextActionDate)}</div>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setPage('leads')} className="mt-4 text-xs text-brand-blue hover:underline">Open all leads →</button>
        </section>
      </div>
    </div>
  )
}
