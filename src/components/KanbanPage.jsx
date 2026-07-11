import { useState } from 'react'
import { useApp } from '../App'
import { api, isUrgent, fmtCountdown, hoursUntil } from '../api'
import { TierBadge } from './LeadsPage'

export default function KanbanPage() {
  const { leads, meta, setEditingLead, loadLeads, toast, permissions } = useApp()
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  const ACTIVE_STAGES = ['Outreach', 'Meeting Scheduled', 'Visit Completed', 'Quotation Requested', 'Proposal Sent']

  async function drop(stage) {
    setOverStage(null)
    if (!dragId) return
    const lead = leads.find(l => l.id === dragId)
    setDragId(null)
    if (!lead || lead.stage === stage) return
    if (!permissions.editLeads) { toast('You do not have permission to move leads', 'urgent'); return }

    /* ---- DATA GUARDRAILS (same rules as the lead form) ---- */
    // 1. Leaving Lead Generation requires decision maker + phone
    if (stage !== 'Lead Generation' && stage !== 'Rejected' && (!lead.dmName || !(lead.phone || lead.dmPhone))) {
      toast('Fill Decision Maker & phone before moving this lead forward', 'urgent')
      setEditingLead({ ...lead, stage })
      return
    }
    // 2. Rejected requires a loss reason → open the form with the reason field required
    if (stage === 'Rejected' && !lead.lossReason) {
      toast('Select a Loss Reason to reject this lead', 'warn')
      setEditingLead({ ...lead, stage: 'Rejected' })
      return
    }
    // 3. Active stages require a future next action date
    if (ACTIVE_STAGES.includes(stage)) {
      const h = hoursUntil(lead.nextActionDate)
      if (h === null || h <= 0) {
        toast('Set a future Next Action Date to move this lead here', 'warn')
        setEditingLead({ ...lead, stage })
        return
      }
    }

    const updates = { id: lead.id, stage }
    if (stage === 'Visit Completed') updates.visitStatus = 'Visited'
    const res = await api('updateLead', { lead: updates })
    if (res.ok) { toast(`${lead.schoolName} → ${stage}`); loadLeads() }
    else toast(res.error || 'Move failed', 'urgent')
  }

  return (
    <div className="space-y-4 h-full">
      <header>
        <h1 className="text-xl font-bold font-display text-white">Pipeline board</h1>
        <p className="text-sm text-slate-400">Drag cards between stages to update a lead's status</p>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-4 items-start">
        {meta.stages.map(stage => {
          const cards = leads
            .filter(l => l.stage === stage)
            .sort((a, b) => new Date(a.nextActionDate || '2100') - new Date(b.nextActionDate || '2100'))
          const isClosed = stage === 'Deal Closed'
          const isRejected = stage === 'Rejected'
          return (
            <div
              key={stage}
              onDragOver={e => { e.preventDefault(); setOverStage(stage) }}
              onDragLeave={() => setOverStage(s => (s === stage ? null : s))}
              onDrop={() => drop(stage)}
              className={
                'w-64 shrink-0 rounded-xl border transition-colors ' +
                (overStage === stage ? 'border-brand-blue bg-brand-blue/5' : 'border-navy-700 bg-navy-900')
              }
            >
              <div className="px-3 py-2.5 flex items-center justify-between border-b border-navy-700">
                <span className={'text-xs font-bold uppercase tracking-wider ' + (isClosed ? 'text-green-400' : isRejected ? 'text-brand-red' : 'text-slate-300')}>
                  {stage}
                </span>
                <span className="text-xs font-display font-bold bg-navy-700 rounded-full px-2 py-0.5">{cards.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-16 max-h-[calc(100vh-220px)] overflow-y-auto">
                {cards.map(l => {
                  const urgent = isUrgent(l)
                  return (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onClick={() => setEditingLead(l)}
                      className={
                        'rounded-lg p-3 cursor-grab active:cursor-grabbing border transition-colors ' +
                        (urgent
                          ? 'bg-brand-red/15 border-brand-red/60 urgent-pulse'
                          : 'bg-navy-800 border-navy-600 hover:border-brand-blue/50')
                      }
                    >
                      <div className="text-sm font-semibold text-white leading-snug">{l.schoolName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.region}{l.curriculum ? ' · ' + l.curriculum : ''}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <TierBadge tier={l.priceTier} />
                        {urgent && <span className="text-[10px] font-bold text-brand-red whitespace-nowrap">{fmtCountdown(l.nextActionDate)}</span>}
                      </div>
                      {l.assignedTo && <div className="text-[10px] text-slate-500 mt-1.5">@{l.assignedTo}</div>}
                    </div>
                  )
                })}
                {cards.length === 0 && <div className="text-xs text-slate-600 text-center py-4">Empty</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
