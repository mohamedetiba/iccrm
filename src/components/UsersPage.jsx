import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { api } from '../api'

const PERM_LABELS = {
  viewAllLeads: 'View all leads (not only their own)',
  createLeads: 'Create leads',
  editLeads: 'Edit leads',
  deleteLeads: 'Delete leads',
  assignLeads: 'Assign leads to others',
  manageTargets: 'Manage targets',
  manageUsers: 'Manage users & permissions',
  viewTeamAnalytics: 'View team analytics',
}

export default function UsersPage() {
  const { users, meta, loadUsers, toast, user } = useApp()
  const [editing, setEditing] = useState(null)
  const [matrix, setMatrix] = useState(null)
  const [permKeys, setPermKeys] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadUsers()
    api('getPermissions').then(r => { if (r.ok) { setMatrix(r.matrix); setPermKeys(r.keys) } })
  }, []) // eslint-disable-line

  async function saveMatrix() {
    setBusy(true)
    const res = await api('savePermissions', { matrix })
    setBusy(false)
    if (res.ok) toast('Permissions updated — users will get them on next action')
    else toast(res.error || 'Save failed', 'urgent')
  }

  async function removeUser(username) {
    if (!confirm(`Remove user "${username}"? Their leads stay in the sheet.`)) return
    const res = await api('deleteUser', { username })
    if (res.ok) { toast('User removed'); loadUsers() }
    else toast(res.error || 'Failed', 'urgent')
  }

  const roleColor = { admin: 'text-brand-red', leader: 'text-brand-yellow', agent: 'text-brand-blue' }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Team & roles</h1>
          <p className="text-sm text-slate-400">Manage accounts and what each role can do</p>
        </div>
        <button onClick={() => setEditing({})} className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add user</button>
      </header>

      {/* Users list */}
      <section className="bg-navy-900 border border-navy-700 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-navy-700">
              <th className="px-4 py-3">User</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Region</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.username} className="border-b border-navy-800">
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{u.fullName || u.username}</div>
                  <div className="text-xs text-slate-500">@{u.username}</div>
                </td>
                <td className={'px-3 py-3 font-bold uppercase text-xs ' + roleColor[u.role]}>{u.role}</td>
                <td className="px-3 py-3 text-slate-300">{u.region || '—'}</td>
                <td className="px-3 py-3">
                  <span className={'text-xs font-semibold ' + (u.active ? 'text-green-400' : 'text-slate-500')}>{u.active ? 'Active' : 'Disabled'}</span>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(u)} className="text-brand-blue hover:underline text-xs mr-3">Edit</button>
                  {u.username !== 'admin' && u.username !== user.username && (
                    <button onClick={() => removeUser(u.username)} className="text-brand-red hover:underline text-xs">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Permission matrix */}
      {matrix && (
        <section className="bg-navy-800 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-display font-bold text-sm text-white">Role permission matrix</h2>
              <p className="text-xs text-slate-400 mt-0.5">Admin permissions are locked. Changes apply to everyone with that role.</p>
            </div>
            <button onClick={saveMatrix} disabled={busy} className="bg-brand-yellow hover:brightness-95 text-navy-950 font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {busy ? 'Saving…' : 'Save matrix'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-navy-700">
                  <th className="py-2.5 pr-4">Permission</th>
                  <th className="py-2.5 px-3 text-center text-brand-red">Admin</th>
                  <th className="py-2.5 px-3 text-center text-brand-yellow">Team Leader</th>
                  <th className="py-2.5 px-3 text-center text-brand-blue">Business Developer</th>
                </tr>
              </thead>
              <tbody>
                {permKeys.map(key => (
                  <tr key={key} className="border-b border-navy-700/60">
                    <td className="py-2.5 pr-4 text-slate-300">{PERM_LABELS[key] || key}</td>
                    {['admin', 'leader', 'agent'].map(role => (
                      <td key={role} className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          disabled={role === 'admin'}
                          checked={role === 'admin' ? true : !!matrix[role]?.[key]}
                          onChange={e => setMatrix(m => ({ ...m, [role]: { ...m[role], [key]: e.target.checked } }))}
                          className="w-4 h-4 accent-[#4D9FDC] disabled:opacity-40"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editing !== null && <UserModal u={editing} meta={meta} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); loadUsers() }} toast={toast} />}
    </div>
  )
}

function UserModal({ u, meta, onClose, onSaved, toast }) {
  const isNew = !u.username
  const [f, setF] = useState({ username: '', fullName: '', role: 'agent', region: '', password: '', active: true, ...u })
  const [busy, setBusy] = useState(false)
  const inp = 'w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-blue'
  const lbl = 'block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1'

  async function save() {
    if (!f.username.trim()) { toast('Username is required', 'urgent'); return }
    if (isNew && !f.password) { toast('Password is required for a new user', 'urgent'); return }
    setBusy(true)
    const res = await api('saveUser', { user: f })
    setBusy(false)
    if (res.ok) { toast(isNew ? 'User created' : 'User updated'); onSaved() }
    else toast(res.error || 'Save failed', 'urgent')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-bold mb-4">{isNew ? 'Add user' : 'Edit ' + f.username}</h3>
        <div className="space-y-3">
          <div><label className={lbl}>Username</label><input className={inp} value={f.username} disabled={!isNew} onChange={e => setF({ ...f, username: e.target.value.trim() })} /></div>
          <div><label className={lbl}>Full name</label><input className={inp} value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} /></div>
          <div><label className={lbl}>Role</label>
            <select className={inp} value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>
              <option value="agent">Business Developer</option>
              <option value="leader">Team Leader</option>
              <option value="admin">Admin</option>
            </select></div>
          <div><label className={lbl}>Region</label>
            <select className={inp} value={f.region} onChange={e => setF({ ...f, region: e.target.value })}>
              <option value="">—</option>{meta.regions.map(r => <option key={r}>{r}</option>)}<option>All</option>
            </select></div>
          <div><label className={lbl}>{isNew ? 'Password' : 'New password (leave empty to keep current)'}</label>
            <input type="password" className={inp} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} className="w-4 h-4 accent-[#4D9FDC]" />
            Active account
          </label>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={save} disabled={busy} className="flex-1 bg-brand-blue hover:bg-brand-blue-dark rounded-lg py-2 text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
          <button onClick={onClose} className="flex-1 bg-navy-700 hover:bg-navy-600 rounded-lg py-2 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )
}
