import { useState } from 'react'
import { useApp } from '../App'
import { api } from '../api'

/** Yellow ring badge — the simplified brand mark from the logo */
export function RobotMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#F2DE3C" />
      <circle cx="50" cy="50" r="26" fill="#1B2440" />
      <rect x="34" y="34" width="32" height="24" rx="6" fill="#4D9FDC" />
      <circle cx="43" cy="46" r="5" fill="#fff" />
      <circle cx="57" cy="46" r="5" fill="#fff" />
      <circle cx="43" cy="46" r="2.2" fill="#131A30" />
      <circle cx="57" cy="46" r="2.2" fill="#131A30" />
      <rect x="44" y="60" width="12" height="8" rx="2" fill="#E8262D" />
    </svg>
  )
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { id: 'leads', label: 'Leads', icon: 'M4 6h16M4 12h16M4 18h10', stroke: true },
  { id: 'kanban', label: 'Pipeline', icon: 'M5 4h4v16H5zM10.5 4h4v10h-4zM16 4h4v7h-4z' },
  { id: 'targets', label: 'Targets', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a5 5 0 100 10 5 5 0 000-10zm0 3.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z' },
  { id: 'users', label: 'Team & Roles', icon: 'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
]

export default function Layout({ children }) {
  const { user, permissions, page, setPage, logout, toast } = useApp()
  const [pwOpen, setPwOpen] = useState(false)

  const visibleNav = NAV.filter(n => {
    if (n.id === 'targets') return true // everyone sees targets; only managers can edit
    if (n.id === 'users') return permissions?.manageUsers
    return true
  })

  const roleBadge = { admin: 'bg-brand-red/20 text-brand-red', leader: 'bg-brand-yellow/15 text-brand-yellow', agent: 'bg-brand-blue/20 text-brand-blue' }

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-navy-900 border-r border-navy-700 flex flex-col fixed inset-y-0 z-20 max-md:w-16">
        <div className="flex items-center gap-3 px-4 py-5 max-md:justify-center max-md:px-0">
          <RobotMark size={36} />
          <div className="max-md:hidden">
            <div className="font-display font-bold text-sm leading-tight text-white">I.C ROBOTICS</div>
            <div className="text-[10px] tracking-[0.2em] text-brand-yellow font-semibold">SALES CRM</div>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-1 mt-2">
          {visibleNav.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors max-md:justify-center ' +
                (page === n.id
                  ? 'bg-brand-blue/15 text-brand-blue'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800')
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={n.stroke ? 'none' : 'currentColor'} stroke={n.stroke ? 'currentColor' : 'none'} strokeWidth={n.stroke ? 2 : 0} strokeLinecap="round">
                <path d={n.icon} />
              </svg>
              <span className="max-md:hidden">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-navy-700">
          <div className="flex items-center gap-2.5 mb-3 max-md:justify-center">
            <div className="w-8 h-8 rounded-full bg-navy-700 grid place-items-center text-xs font-bold text-brand-yellow shrink-0">
              {(user.fullName || user.username).slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 max-md:hidden">
              <div className="text-xs font-semibold truncate">{user.fullName || user.username}</div>
              <span className={'text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ' + roleBadge[user.role]}>{user.role}</span>
            </div>
          </div>
          <button onClick={() => setPwOpen(true)} className="w-full text-left text-xs text-slate-400 hover:text-slate-200 px-1 py-1 max-md:text-center">Change password</button>
          <button onClick={logout} className="w-full text-left text-xs text-slate-400 hover:text-brand-red px-1 py-1 max-md:text-center">Sign out</button>
        </div>
      </aside>

      <main className="flex-1 ml-56 max-md:ml-16 p-6 max-md:p-3 min-w-0">{children}</main>

      {pwOpen && <PasswordModal onClose={() => setPwOpen(false)} toast={toast} />}
    </div>
  )
}

function PasswordModal({ onClose, toast }) {
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    const res = await api('changePassword', { oldPassword: oldPw, newPassword: newPw })
    setBusy(false)
    if (res.ok) { toast('Password updated'); onClose() }
    else toast(res.error || 'Failed', 'urgent')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-bold mb-4">Change password</h3>
        <input type="password" placeholder="Current password" value={oldPw} onChange={e => setOldPw(e.target.value)}
          className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-brand-blue" />
        <input type="password" placeholder="New password (min 6 chars)" value={newPw} onChange={e => setNewPw(e.target.value)}
          className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-blue" />
        <div className="flex gap-2 mt-4">
          <button onClick={save} disabled={busy} className="flex-1 bg-brand-blue hover:bg-brand-blue-dark rounded-lg py-2 text-sm font-semibold disabled:opacity-50">Save</button>
          <button onClick={onClose} className="flex-1 bg-navy-700 hover:bg-navy-600 rounded-lg py-2 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )
}
