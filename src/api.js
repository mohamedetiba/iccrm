import { API_URL } from './config'

/**
 * CORS-safe call to Google Apps Script.
 * We deliberately do NOT set a Content-Type header, so the browser sends
 * text/plain — a "simple request" that skips the CORS preflight (OPTIONS)
 * which GAS Web Apps cannot answer. redirect:'follow' handles the
 * script.googleusercontent.com redirect GAS always performs.
 */
export async function api(action, payload = {}) {
  const token = localStorage.getItem('ic_token') || ''
  const res = await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action, token, ...payload }),
  })
  const data = await res.json()
  if (data.error === 'AUTH') {
    localStorage.removeItem('ic_token')
    localStorage.removeItem('ic_user')
    window.location.reload()
  }
  return data
}

/* ---------- urgency helpers ---------- */

export const URGENT_WINDOW_HOURS = 30

export function hoursUntil(dateStr) {
  if (!dateStr) return null
  const t = new Date(dateStr).getTime()
  if (isNaN(t)) return null
  return (t - Date.now()) / 36e5
}

/** Red state: action is due within the next 30 hours (or overdue but not older than 48h past). */
export function isUrgent(lead) {
  if (!lead.nextActionDate || lead.stage === 'Deal Closed' || lead.stage === 'Rejected') return false
  const h = hoursUntil(lead.nextActionDate)
  return h !== null && h <= URGENT_WINDOW_HOURS && h > -48
}

export function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/**
 * BUG FIX — Date sync: Google Sheets returns dates as full ISO strings
 * ("2026-07-13T12:00:00.000Z"). <input type="datetime-local"> only accepts
 * "YYYY-MM-DDTHH:mm" and silently renders BLANK for anything else.
 * These helpers convert any stored value to the exact local format inputs need.
 */
const pad = (n) => String(n).padStart(2, '0')

export function toInputDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  if (isNaN(d)) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function toInputDate(v) {
  if (!v) return ''
  const d = new Date(v)
  if (isNaN(d)) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fmtCountdown(dateStr) {
  const h = hoursUntil(dateStr)
  if (h === null) return ''
  if (h < 0) return 'Overdue by ' + Math.abs(Math.round(h)) + 'h'
  if (h < 1) return Math.round(h * 60) + ' min left'
  if (h < 48) return Math.round(h) + 'h left'
  return Math.round(h / 24) + ' days left'
}
