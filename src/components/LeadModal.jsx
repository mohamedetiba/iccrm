import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { api, toInputDateTime, toInputDate } from '../api'

const PRE_VISIT_STAGES = ['Lead Generation', 'Outreach', 'Meeting Scheduled']
const ACTIVE_STAGES = ['Outreach', 'Meeting Scheduled', 'Visit Completed', 'Quotation Requested', 'Proposal Sent']
const FALLBACK_LOSS_REASONS = ['Price too high', 'Curriculum mismatch', 'Management refused', 'Contracted with a competitor', 'Other']

export default function LeadModal({ lead, onClose }) {
  const { meta, users, permissions, user, loadLeads, toast } = useApp()
  const isNew = !lead.id
  const [f, setF] = useState({
    schoolName: '', region: '', phone: '', website: '', email: '',
    curriculum: '', priceTier: '', stemStatus: '', existingPartners: '', summerCamp: '',
    dmName: '', dmPosition: '', dmPhone: '', dmEmail: '', dmLinkedin: '',
    priority: 'Medium', stage: 'Lead Generation', visitStatus: 'Not Visited',
    notes: '', lossReason: '',
    assignedTo: user.username,
    ...lead,
    // BUG FIX: normalize sheet ISO dates into the exact format the inputs accept
    firstCallDate: toInputDate(lead.firstCallDate),
    nextActionDate: toInputDateTime(lead.nextActionDate),
    nextActionType: lead.nextActionType || '',
  })
  const [busy, setBusy] = useState(false)

  const lossReasons = meta.lossReasons || FALLBACK_LOSS_REASONS

  const set = (k) => (e) => {
    const value = e.target.value
    setF(prev => {
      const next = { ...prev, [k]: value }
      // Keep Stage ↔ Visit Status consistent as the user edits
      if (k === 'stage' && value === 'Visit Completed') next.visitStatus = 'Visited'
      if (k === 'visitStatus' && value === 'Visited' && PRE_VISIT_STAGES.includes(prev.stage)) next.stage = 'Visit Completed'
      return next
    })
  }

  const inp = 'w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-blue'
  const lbl = 'block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1'

  /* ---------- DATA GUARDRAILS ---------- */
  function validate() {
    if (!f.schoolName.trim()) return 'School name is required'

    // Rule 1: leaving Lead Generation requires a decision maker + a phone number
    if (f.stage !== 'Lead Generation' && f.stage !== 'Rejected') {
      if (!f.dmName.trim()) return 'Fill in the Decision Maker name before moving past Lead Generation'
      if (!f.phone.trim() && !f.dmPhone.trim()) return 'Fill in a phone number (school or decision maker) before moving past Lead Generation'
    }

    // Rule 2: active pipeline stages require a FUTURE next action date
    if (ACTIVE_STAGES.includes(f.stage)) {
      if (!f.nextActionDate) return 'Set a Next Action Date — active leads cannot be saved without a scheduled next step'
      if (new Date(f.nextActionDate) <= new Date()) return 'Next Action Date must be in the future'
    }

    // Rule 3: Rejected requires a loss reason (feeds ROI analytics)
    if (f.stage === 'Rejected' && !f.lossReason) return 'Select a Loss Reason to mark this lead as Rejected'

    return null
  }

  async function save() {
    const err = validate()
    if (err) { toast(err, 'urgent'); return }
    setBusy(true)
    const payload = { ...f }
    if (payload.stage !== 'Rejected') payload.lossReason = ''
    const res = await api(isNew ? 'createLead' : 'updateLead', { lead: payload })
    setBusy(false)
    if (res.ok) { toast(isNew ? 'Lead created' : 'Lead updated'); loadLeads(); onClose() }
    else toast(res.error || 'Save failed', 'urgent')
  }

  async function remove() {
    if (!confirm(`Delete "${f.schoolName}" permanently?`)) return
    setBusy(true)
    const res = await api('deleteLead', { id: f.id })
    setBusy(false)
    if (res.ok) { toast('Lead deleted'); loadLeads(); onClose() }
    else toast(res.error || 'Delete failed', 'urgent')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-navy-800 border border-navy-600 rounded-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-navy-700 flex items-center justify-between">
          <h3 className="font-display font-bold text-white">{isNew ? 'New school lead' : f.schoolName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* School */}
          <Section title="School">
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
              <div className="col-span-2 max-sm:col-span-1"><label className={lbl}>School name *</label><input className={inp} value={f.schoolName} onChange={set('schoolName')} /></div>
              <div><label className={lbl}>Region</label>
                <select className={inp} value={f.region} onChange={set('region')}><option value="">—</option>{meta.regions.map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label className={lbl}>Curriculum</label>
                <select className={inp} value={f.curriculum} onChange={set('curriculum')}><option value="">—</option>{meta.curricula.map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label className={lbl}>Phone</label><input className={inp} value={f.phone} onChange={set('phone')} /></div>
              <div><label className={lbl}>Email</label><input className={inp} value={f.email} onChange={set('email')} /></div>
              <div><label className={lbl}>Website</label><input className={inp} value={f.website} onChange={set('website')} /></div>
              <div><label className={lbl}>Price tier</label>
                <select className={inp} value={f.priceTier} onChange={set('priceTier')}><option value="">—</option>{meta.priceTiers.map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label className={lbl}>STEM program status</label><input className={inp} value={f.stemStatus} onChange={set('stemStatus')} placeholder="e.g. Has STEM lab, no robotics" /></div>
              <div><label className={lbl}>Existing partners</label><input className={inp} value={f.existingPartners} onChange={set('existingPartners')} /></div>
              <div className="col-span-2 max-sm:col-span-1"><label className={lbl}>Summer camp / activities</label><input className={inp} value={f.summerCamp} onChange={set('summerCamp')} /></div>
            </div>
          </Section>

          {/* Decision maker */}
          <Section title="Decision maker">
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
              <div><label className={lbl}>Name {f.stage !== 'Lead Generation' && '*'}</label><input className={inp} value={f.dmName} onChange={set('dmName')} /></div>
              <div><label className={lbl}>Position</label><input className={inp} value={f.dmPosition} onChange={set('dmPosition')} placeholder="e.g. Principal, Activities Head" /></div>
              <div><label className={lbl}>Phone</label><input className={inp} value={f.dmPhone} onChange={set('dmPhone')} /></div>
              <div><label className={lbl}>Email</label><input className={inp} value={f.dmEmail} onChange={set('dmEmail')} /></div>
              <div className="col-span-2 max-sm:col-span-1"><label className={lbl}>LinkedIn URL</label><input className={inp} value={f.dmLinkedin} onChange={set('dmLinkedin')} /></div>
            </div>
          </Section>

          {/* Pipeline */}
          <Section title="Pipeline & follow-up">
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
              <div><label className={lbl}>Stage</label>
                <select className={inp} value={f.stage} onChange={set('stage')}>{meta.stages.map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label className={lbl}>Priority</label>
                <select className={inp} value={f.priority} onChange={set('priority')}>{meta.priorities.map(r => <option key={r}>{r}</option>)}</select></div>

              {/* Mandatory Loss Reason when Rejected */}
              {f.stage === 'Rejected' && (
                <div className="col-span-2 max-sm:col-span-1 bg-brand-red/10 border border-brand-red/40 rounded-lg p-3">
                  <label className="block text-[11px] font-bold text-brand-red uppercase tracking-wider mb-1">Loss reason * (required for analytics)</label>
                  <select className={inp} value={f.lossReason} onChange={set('lossReason')}>
                    <option value="">— select why this lead was lost —</option>
                    {lossReasons.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              )}

              <div><label className={lbl}>Visit status</label>
                <select className={inp} value={f.visitStatus} onChange={set('visitStatus')}><option>Not Visited</option><option>Visited</option></select></div>
              <div><label className={lbl}>First call date</label><input type="date" className={inp} value={f.firstCallDate} onChange={set('firstCallDate')} /></div>
              <div><label className={lbl}>Next action type</label>
                <select className={inp} value={f.nextActionType} onChange={set('nextActionType')}><option value="">—</option>{meta.actionTypes.map(r => <option key={r}>{r}</option>)}</select></div>
              <div>
                <label className={lbl}>Next action date & time {ACTIVE_STAGES.includes(f.stage) && '*'}</label>
                <input type="datetime-local" className={inp} value={f.nextActionDate} onChange={set('nextActionDate')} />
                <p className="text-[10px] text-brand-red/80 mt-1">Lead turns red 30 hours before this time</p>
              </div>
              {(permissions.assignLeads && users.length > 0) && (
                <div><label className={lbl}>Assigned to</label>
                  <select className={inp} value={f.assignedTo} onChange={set('assignedTo')}>
                    {users.filter(u => u.active).map(u => <option key={u.username} value={u.username}>{u.fullName || u.username}</option>)}
                  </select></div>
              )}
              <div className="col-span-2 max-sm:col-span-1">
                <label className={lbl}>Notes</label>
                <textarea rows="3" className={inp} value={f.notes} onChange={set('notes')} placeholder="General notes about this school…" />
              </div>
            </div>
          </Section>

          {/* Activity log — persistent, append-only */}
          {!isNew && <ActivityLog leadId={f.id} toast={toast} user={user} />}
        </div>

        <div className="px-6 py-4 border-t border-navy-700 flex gap-2">
          <button onClick={save} disabled={busy} className="bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-lg">
            {busy ? 'Saving…' : isNew ? 'Create lead' : 'Save changes'}
          </button>
          <button onClick={onClose} className="bg-navy-700 hover:bg-navy-600 text-sm px-4 py-2 rounded-lg">Cancel</button>
          {!isNew && permissions.deleteLeads && (
            <button onClick={remove} disabled={busy} className="ml-auto text-brand-red hover:bg-brand-red/10 text-sm px-4 py-2 rounded-lg">Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- ACTIVITY LOG (append-only timeline) ---------- */
function ActivityLog({ leadId, toast, user }) {
  const [entries, setEntries] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('getActivity', { leadId }).then(r => setEntries(r.ok ? r.entries : []))
  }, [leadId])

  async function add() {
    if (!note.trim()) return
    setBusy(true)
    const res = await api('addActivity', { leadId, note })
    setBusy(false)
    if (res.ok) {
      setEntries([res.entry, ...(entries || [])])
      setNote('')
    } else toast(res.error || 'Could not add note', 'urgent')
  }

  return (
    <Section title="Activity log">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          placeholder='e.g. "Spoke with Principal — interested, budget opens in September"'
          value={note} onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button onClick={add} disabled={busy || !note.trim()} className="bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-40 text-white text-sm font-semibold px-4 rounded-lg">
          {busy ? '…' : 'Log'}
        </button>
      </div>

      <div className="mt-3 space-y-0 max-h-56 overflow-y-auto pr-1">
        {entries === null && <p className="text-xs text-slate-500 py-2">Loading history…</p>}
        {entries && entries.length === 0 && <p className="text-xs text-slate-500 py-2">No activity logged yet — every note you add here is saved permanently with a timestamp.</p>}
        {entries && entries.map((a, i) => (
          <div key={a.id} className="relative pl-5 pb-3">
            {/* timeline rail */}
            {i !== entries.length - 1 && <span className="absolute left-[5px] top-3 bottom-0 w-px bg-navy-600" />}
            <span className={'absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-navy-800 ' + (i === 0 ? 'bg-brand-yellow' : 'bg-navy-500 bg-slate-500')} />
            <div className="text-[11px] text-slate-500">
              <span className="font-semibold text-brand-blue">@{a.username}</span>
              {' · '}
              {new Date(a.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{a.note}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow" />
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-display">{title}</h4>
        <div className="flex-1 h-px bg-navy-700" />
      </div>
      {children}
    </div>
  )
}
