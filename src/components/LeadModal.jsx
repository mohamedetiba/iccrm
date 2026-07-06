import { useState } from 'react'
import { useApp } from '../App'
import { api } from '../api'

export default function LeadModal({ lead, onClose }) {
  const { meta, users, permissions, user, loadLeads, toast } = useApp()
  const isNew = !lead.id
  const [f, setF] = useState({
    schoolName: '', region: '', phone: '', website: '', email: '',
    curriculum: '', priceTier: '', stemStatus: '', existingPartners: '', summerCamp: '',
    dmName: '', dmPosition: '', dmPhone: '', dmEmail: '', dmLinkedin: '',
    priority: 'Medium', stage: 'Lead Generation', visitStatus: 'Not Visited',
    firstCallDate: '', nextActionDate: '', nextActionType: '', notes: '',
    assignedTo: user.username,
    ...lead,
  })
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const inp = 'w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-blue'
  const lbl = 'block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1'

  async function save() {
    if (!f.schoolName.trim()) { toast('School name is required', 'urgent'); return }
    setBusy(true)
    const res = await api(isNew ? 'createLead' : 'updateLead', { lead: f })
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
              <div><label className={lbl}>Name</label><input className={inp} value={f.dmName} onChange={set('dmName')} /></div>
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
              <div><label className={lbl}>Visit status</label>
                <select className={inp} value={f.visitStatus} onChange={set('visitStatus')}><option>Not Visited</option><option>Visited</option></select></div>
              <div><label className={lbl}>First call date</label><input type="date" className={inp} value={f.firstCallDate} onChange={set('firstCallDate')} /></div>
              <div><label className={lbl}>Next action type</label>
                <select className={inp} value={f.nextActionType} onChange={set('nextActionType')}><option value="">—</option>{meta.actionTypes.map(r => <option key={r}>{r}</option>)}</select></div>
              <div>
                <label className={lbl}>Next action date & time</label>
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
                <textarea rows="3" className={inp} value={f.notes} onChange={set('notes')} placeholder="Visit feedback, objections, follow-up details…" />
              </div>
            </div>
          </Section>
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
