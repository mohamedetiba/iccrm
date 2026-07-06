import { useState, useMemo } from 'react'
import { useApp } from '../App'
import { isUrgent, fmtDate, fmtCountdown } from '../api'

const EMPTY_FILTERS = { tier: '', curriculum: '', stage: '', visit: '', region: '', from: '', to: '' }

export default function LeadsPage() {
  const { leads, meta, loadingLeads, loadLeads, setEditingLead } = useApp()
  const [q, setQ] = useState('')
  const [f, setF] = useState(EMPTY_FILTERS)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return leads.filter(l => {
      if (f.tier && l.priceTier !== f.tier) return false
      if (f.curriculum && l.curriculum !== f.curriculum) return false
      if (f.stage && l.stage !== f.stage) return false
      if (f.region && l.region !== f.region) return false
      if (f.visit === 'visited' && l.visitStatus !== 'Visited') return false
      if (f.visit === 'not' && l.visitStatus === 'Visited') return false
      if (f.from && (!l.nextActionDate || new Date(l.nextActionDate) < new Date(f.from))) return false
      if (f.to && (!l.nextActionDate || new Date(l.nextActionDate) > new Date(f.to + 'T23:59'))) return false
      if (needle) {
        const hay = [l.schoolName, l.dmName, l.phone, l.dmPhone, l.email, l.dmEmail].join(' ').toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    }).sort((a, b) => {
      // urgent first, then by next action date
      const ua = isUrgent(a), ub = isUrgent(b)
      if (ua !== ub) return ua ? -1 : 1
      return new Date(a.nextActionDate || '2100') - new Date(b.nextActionDate || '2100')
    })
  }, [leads, q, f])

  const active = Object.values(f).filter(Boolean).length
  const sel = 'bg-navy-800 border border-navy-600 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-brand-blue text-slate-300'

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Leads</h1>
          <p className="text-sm text-slate-400">{filtered.length} of {leads.length} schools</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadLeads} className="bg-navy-800 hover:bg-navy-700 border border-navy-600 text-sm px-3 py-2 rounded-lg" title="Refresh">↻</button>
          <button onClick={() => setEditingLead({})} className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-lg">+ New school lead</button>
        </div>
      </header>

      {/* Search + filters */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 space-y-3">
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search school, decision maker, or phone number…"
          className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <select className={sel} value={f.stage} onChange={e => setF({ ...f, stage: e.target.value })}>
            <option value="">Stage · all</option>
            {meta.stages.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={f.tier} onChange={e => setF({ ...f, tier: e.target.value })}>
            <option value="">Price tier · all</option>
            {meta.priceTiers.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={f.curriculum} onChange={e => setF({ ...f, curriculum: e.target.value })}>
            <option value="">Curriculum · all</option>
            {meta.curricula.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={f.region} onChange={e => setF({ ...f, region: e.target.value })}>
            <option value="">Region · all</option>
            {meta.regions.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={f.visit} onChange={e => setF({ ...f, visit: e.target.value })}>
            <option value="">Visit · all</option>
            <option value="visited">Visited</option>
            <option value="not">Not visited</option>
          </select>
          <label className="text-xs text-slate-500">Next action:</label>
          <input type="date" className={sel} value={f.from} onChange={e => setF({ ...f, from: e.target.value })} />
          <span className="text-slate-600 text-xs">→</span>
          <input type="date" className={sel} value={f.to} onChange={e => setF({ ...f, to: e.target.value })} />
          {active > 0 && (
            <button onClick={() => setF(EMPTY_FILTERS)} className="text-xs text-brand-yellow hover:underline ml-1">Clear {active} filter{active > 1 ? 's' : ''}</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-navy-700">
              <th className="px-4 py-3">School</th>
              <th className="px-3 py-3">Region</th>
              <th className="px-3 py-3">Curriculum</th>
              <th className="px-3 py-3">Tier</th>
              <th className="px-3 py-3">Stage</th>
              <th className="px-3 py-3">Decision maker</th>
              <th className="px-3 py-3">Next action</th>
              <th className="px-3 py-3">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {loadingLeads && <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-500">Loading leads…</td></tr>}
            {!loadingLeads && filtered.length === 0 && (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-500">
                {leads.length === 0 ? 'No leads yet — add your first school to start the pipeline.' : 'No leads match these filters.'}
              </td></tr>
            )}
            {filtered.map(l => {
              const urgent = isUrgent(l)
              return (
                <tr
                  key={l.id}
                  onClick={() => setEditingLead(l)}
                  className={
                    'border-b border-navy-800 cursor-pointer transition-colors ' +
                    (urgent
                      ? 'bg-brand-red/15 hover:bg-brand-red/25 border-l-4 border-l-brand-red'
                      : 'hover:bg-navy-800')
                  }
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white flex items-center gap-2">
                      {urgent && <span className="w-2 h-2 rounded-full bg-brand-red urgent-pulse shrink-0" />}
                      {l.schoolName}
                    </div>
                    <div className="text-xs text-slate-500">{l.phone}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{l.region || '—'}</td>
                  <td className="px-3 py-3 text-slate-300">{l.curriculum || '—'}</td>
                  <td className="px-3 py-3"><TierBadge tier={l.priceTier} /></td>
                  <td className="px-3 py-3"><StageBadge stage={l.stage} /></td>
                  <td className="px-3 py-3">
                    <div className="text-slate-300">{l.dmName || '—'}</div>
                    <div className="text-xs text-slate-500">{l.dmPosition}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={urgent ? 'text-brand-red font-semibold' : 'text-slate-300'}>{fmtDate(l.nextActionDate)}</div>
                    {l.nextActionDate && <div className={'text-xs ' + (urgent ? 'text-brand-red' : 'text-slate-500')}>{l.nextActionType} · {fmtCountdown(l.nextActionDate)}</div>}
                  </td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{l.assignedTo}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function StageBadge({ stage }) {
  const map = {
    'Lead Generation': 'bg-slate-500/20 text-slate-300',
    'Outreach': 'bg-brand-blue/20 text-brand-blue',
    'Meeting Scheduled': 'bg-brand-blue/30 text-sky-300',
    'Visit Completed': 'bg-brand-yellow/15 text-brand-yellow',
    'Quotation Requested': 'bg-brand-yellow/25 text-yellow-200',
    'Proposal Sent': 'bg-orange-400/20 text-orange-300',
    'Deal Closed': 'bg-green-500/20 text-green-400',
    'Rejected': 'bg-brand-red/20 text-brand-red',
  }
  return <span className={'text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap ' + (map[stage] || 'bg-navy-700 text-slate-300')}>{stage || '—'}</span>
}

export function TierBadge({ tier }) {
  if (!tier) return <span className="text-slate-600">—</span>
  const dots = { 'Value': 1, 'Mid-Market': 2, 'Premium': 3, 'Luxury': 4 }[tier] || 0
  return (
    <span className="flex items-center gap-1" title={tier}>
      {[1, 2, 3, 4].map(i => (
        <span key={i} className={'w-1.5 h-1.5 rounded-full ' + (i <= dots ? 'bg-brand-yellow' : 'bg-navy-600')} />
      ))}
      <span className="text-xs text-slate-400 ml-1">{tier}</span>
    </span>
  )
}
