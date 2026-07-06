import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { api, isUrgent, isToday } from './api'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import LeadsPage from './components/LeadsPage'
import KanbanPage from './components/KanbanPage'
import TargetsPage from './components/TargetsPage'
import UsersPage from './components/UsersPage'
import LeadModal from './components/LeadModal'
import Toasts from './components/Toasts'

export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const FALLBACK_META = {
  regions: [], stages: [], curricula: [], priceTiers: [], priorities: [], actionTypes: [], roles: [],
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('ic_user') || 'null'))
  const [permissions, setPermissions] = useState(() => JSON.parse(localStorage.getItem('ic_perms') || 'null'))
  const [meta, setMeta] = useState(() => JSON.parse(localStorage.getItem('ic_meta') || 'null') || FALLBACK_META)
  const [checking, setChecking] = useState(!!localStorage.getItem('ic_token'))
  const [page, setPage] = useState('dashboard')
  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [editingLead, setEditingLead] = useState(null) // null | {} (new) | lead object
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 6000)
  }, [])

  /* Session restore — keeps the user logged in across refresh/close */
  useEffect(() => {
    if (!localStorage.getItem('ic_token')) return
    api('verifyToken').then(res => {
      if (res.ok) {
        setUser(res.user)
        setPermissions(res.permissions)
        setMeta(res.meta)
        localStorage.setItem('ic_user', JSON.stringify(res.user))
        localStorage.setItem('ic_perms', JSON.stringify(res.permissions))
        localStorage.setItem('ic_meta', JSON.stringify(res.meta))
      }
      setChecking(false)
    }).catch(() => setChecking(false))
  }, [])

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true)
    const res = await api('getLeads')
    if (res.ok) setLeads(res.leads)
    setLoadingLeads(false)
    return res.leads || []
  }, [])

  const loadUsers = useCallback(async () => {
    const res = await api('getUsers')
    if (res.ok) setUsers(res.users)
  }, [])

  /* Initial data + daily task toasts */
  useEffect(() => {
    if (!user) return
    loadLeads().then(list => {
      const dueToday = list.filter(l => isToday(l.nextActionDate) && l.stage !== 'Deal Closed' && l.stage !== 'Rejected')
      const urgent = list.filter(isUrgent)
      if (dueToday.length) toast(`${dueToday.length} task(s) scheduled for today`, 'warn')
      else if (urgent.length) toast(`${urgent.length} lead(s) need action within 30 hours`, 'urgent')
    })
    if (permissions?.assignLeads || permissions?.manageUsers) loadUsers()
  }, [user]) // eslint-disable-line

  function onLogin(res) {
    localStorage.setItem('ic_token', res.token)
    localStorage.setItem('ic_user', JSON.stringify(res.user))
    localStorage.setItem('ic_perms', JSON.stringify(res.permissions))
    localStorage.setItem('ic_meta', JSON.stringify(res.meta))
    setUser(res.user)
    setPermissions(res.permissions)
    setMeta(res.meta)
    toast(`Welcome back, ${res.user.fullName || res.user.username}`)
  }

  function logout() {
    localStorage.removeItem('ic_token')
    localStorage.removeItem('ic_user')
    localStorage.removeItem('ic_perms')
    setUser(null)
    setPermissions(null)
    setPage('dashboard')
  }

  const ctx = {
    user, permissions, meta, leads, users, loadingLeads,
    loadLeads, loadUsers, toast, setEditingLead, logout, page, setPage,
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-navy-950">
        <div className="w-14 h-14 rounded-full border-4 border-brand-yellow border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <Login onLogin={onLogin} />

  return (
    <AppCtx.Provider value={ctx}>
      <Layout>
        {page === 'dashboard' && <Dashboard />}
        {page === 'leads' && <LeadsPage />}
        {page === 'kanban' && <KanbanPage />}
        {page === 'targets' && <TargetsPage />}
        {page === 'users' && <UsersPage />}
      </Layout>
      {editingLead !== null && <LeadModal lead={editingLead} onClose={() => setEditingLead(null)} />}
      <Toasts toasts={toasts} />
    </AppCtx.Provider>
  )
}
